# ShowBrowse

A Netflix-style TV show browser backed by `apps/api`, a backend-for-frontend that syncs the full [TVMaze](https://www.tvmaze.com/api) show index.

Live demo: https://nx-showbrowse.vercel.app/

## Requirements

- Node.js (24.15.0 LTS is recommended)
- npm

## Getting started

```bash
# Install dependencies
# Using ci to make sure that the dependencies are installed
# by the current lock file to avoid accidental breaking changes being
# introduced by updated dependencies
npm ci

# apps/web now talks to apps/api instead of TVMaze directly, so both need
# to be running for the app to actually show data. Two terminals:

# Terminal 1 — backend → http://localhost:4300
npm run start:api

# Terminal 2 — frontend → http://localhost:4200
npm start

# Build for production
npm run build

# Run all unit tests
npm test

# Run E2E tests (starts both apps/api, warm-started from a committed
# fixture snapshot, and the Vite dev server automatically)
npm run test:e2e
```

On its first-ever boot (no snapshot on disk yet), `apps/api` crawls TVMaze's full index before `/genres` and `/shows` start returning data — a few minutes at its default, rate-limit-safe pace. `/health` (`http://localhost:4300/health`) reports `ready: true` once that's done; every boot after that is instant, since it warm-starts from the snapshot it wrote last time. See [Backend (`apps/api`)](#backend-appsapi) below for details.

## Features

- Home shows a curated overview: TV shows grouped by genre, each row sorted by rating, plus a global Top 10 — computed by `apps/api` across its _entire_ synced catalog, not a single page. Each row's "See all" link opens that same slice in All Shows
- All Shows: real paginated/filtered/sorted browsing of the full catalog — genre filter and sort (rating, release date, or title) apply across every show that matches, not just the current page. Page, filter, sort, and page size are all reflected in the URL so a view can be shared or bookmarked
- Filter shows by country (today's schedule)
- Search shows by name
- Full show detail page with cast
- Vertical and horizontal lazy loading for better UI performance
- Optimistic detail page render for smoother experience
- Light/dark theme, following the system preference by default and toggleable, persisted across visits

## Architecture

The project is structured as an Nx monorepo with a strict separation between business logic and the UI layer, now spanning three projects:

```
packages/
  shows/    # Pure TypeScript — zero framework dependencies
              entities, one client/service pair (apps/api-facing:
              IBackendApiClient/ICatalogService), and use cases — all typed
              against apps/api's HTTP contract, never TVMaze's
apps/
  api/      # Node/Express backend-for-frontend
              owns its entire TVMaze integration locally (apps/api/src/tvmaze/):
              raw types, client, mapper, cached service, entities — none of it
              shared with packages/shows (see "Backend" below)
  web/      # Vue 3 presentation layer
              components, composables, views, router, DI plugin
```

### Why a separate `packages` layer?

The core data logic (fetching, mapping, caching) lives in `packages` (currently only `shows`) with no Vue imports. This means it can be unit-tested without a browser, reused in a different framework, or published as an npm package without changes. `apps/web` consumes it exclusively through the public API at `@show-browse/shows` and never talks to TVMaze directly. `apps/api` doesn't depend on it at all — its own TVMaze integration is entirely local (see below).

### Why apps/api's TVMaze integration lives locally instead of shared

`packages/shows` represents exactly one upstream from `apps/web`'s point of view: `apps/api`'s HTTP contract. It has no business knowing `apps/api`'s data came from TVMaze, or sharing types with TVMaze's wire format — that would leak an implementation detail of one specific backend into a package meant to be provider-agnostic. So `apps/api` owns its complete TVMaze integration privately (`apps/api/src/tvmaze/`: raw types, `IShowApiClient`, mapper, cached `IShowService`, its own `Show`/`ShowDetail` entities) and `packages/shows` owns its own, independent `Show`/`ShowDetail` entities plus the client/service that talks to `apps/api`. Neither imports the other's data-source-facing code.

The three read operations that happen to have identical signatures on both sides (`getShowById`/`searchShows`/`getShowsByCountry`) still share the same use-case factories in `packages/shows`, just narrowed to `Pick<ICatalogService, 'getShowById'>` etc. — a type-only reference to `packages/shows`'s own service interface, not to anything TVMaze-shaped.

### Why use cases instead of putting logic in composables?

Use cases (`createGetCatalogPageUseCase`, `createSearchShowsUseCase`, etc.) are plain factory functions that express a single business operation and depend only on a narrow slice of a service interface. This keeps the Vue composables thin — they handle reactivity and loading state, not business rules. It also makes the logic independently testable with a mock service, without mounting any component.

### Why `provide/inject` instead of Pinia?

All dependencies are wired once in `showsPlugin` and provided top-down via Vue's built-in DI. This avoids global module-level singletons, keeps the dependency graph explicit, and makes the entire composition root swappable in tests. Pinia would add value if cross-component shared state becomes more complex, but for this scope it would be overhead without benefit.

### Why Nx?

Nx enforces hard boundaries between `packages/` and `apps/` at the linter level, so it's impossible to accidentally import TVMaze types directly into a component. It also provides a single task runner with caching for build, test and lint across both packages.

### Caching

`apps/api`'s `tvmaze/service.ts` and `packages/shows`'s `catalog.service.ts` independently use the same simple in-memory TTL cache shape (managed via `CACHE_TTL_MS`, fallback 5 minutes), keyed per query — same pattern, no shared code:

- `apps/api/src/tvmaze/service.ts` (backs apps/api's own live-proxy routes) — per show id, per country.
- `packages/shows/src/services/catalog.service.ts` (used by `apps/web`) — per exact `{page,pageSize,genre,sort}` query, per genre-groups `limit`, per show id, per country. Search is never cached in either — repeatedly searching the same term should reflect current results, not stale ones.

### Why Home and All Shows, and not separate Genre/Popular pages too

TVMaze's `/shows` index paginates but has no genre-aware endpoint and never exposes a total page count — grouping by genre and knowing "how many pages exist" both require having crawled the _entire_ index first. `apps/api` does exactly that (see below), so both capabilities exist and are correct at the same time:

- **Home (`/`)** shows a curated, bounded view: top-N per genre and a global top-10, both computed by `apps/api` across the whole catalog (`GET /genres?limit=20`, `GET /shows?sort=rating&pageSize=10`). This is "what's good," not "everything" — each row's "See all" link opens that same genre (or rating sort) in All Shows.
- **All Shows (`/catalog`)** is the one exhaustive, paginated view over `GET /shows`, which supports real `{page, pageSize, genre, sort}` filtering with correct `totalPages`/`totalShows` — a genre filter or sort here reflects _every_ matching show in the catalog, not just what happened to be on the current page.

Earlier iterations had dedicated `/genre/:genre` and `/popular` pages layered on top of this, each a thin, single-purpose wrapper around the same `useShowCatalog` composable (a fixed genre, or a fixed rating sort, with no control over the other). Once All Shows could filter by genre _and_ sort by rating _and_ paginate, together, those pages had nothing left to justify their own route — anything they could show, a deep link like `/catalog?genre=Drama` or `/catalog?sort=rating` already showed, with strictly more control (page size, combining genre with sort, etc.). Removing them cut three views, a route, and a chunk of nav down to one, without losing any capability — one dashboard-style browsing surface instead of three overlapping ones.

Since `apps/api`'s `/shows` always returns a real `totalPages` (unlike TVMaze), `useShowCatalog` (`apps/web/src/composables/useShowCatalog.ts`) just compares against it directly for Prev/Next/boundary logic — no probing or 404-based guessing needed. A failed request (a genuine network/server error, not an expected "out of range" case) leaves the previously-loaded page on screen with an inline notice, rather than blanking the grid.

## Backend (`apps/api`)

A small backend-for-frontend that periodically crawls TVMaze's **full** show index into memory, so genre-grouping, global sorting, and real pagination can all be correct **at the same time** — `apps/web` consumes it exclusively and never talks to TVMaze directly for the bulk catalog.

`apps/api` owns its complete TVMaze integration locally (`apps/api/src/tvmaze/`: raw wire types, `IShowApiClient`, mapper, cached `IShowService`, its own `Show`/`ShowDetail`/`CastMember` entities) rather than importing any of it from `packages/shows` — its HTTP contract is its own, independent of whatever `packages/shows`'s `Show`/`ShowDetail` types happen to look like. `apps/api/src/store/group-shows-by-genre.ts` is likewise its own local copy, not shared with the client-side grouping util `packages/shows` still exposes for `apps/web`'s Today page.

**How it works:**

- On boot, it loads a JSON snapshot from disk (if one exists) for an instant warm start, then serves immediately — `/health` always returns 200 so it never looks "down" during a crawl, while `/genres`, `/genres/names`, and `/shows` return 503 until the store is populated.
- If there's no snapshot (first-ever boot), it crawls TVMaze's index from page 0, rate-limited under TVMaze's documented ~20 calls/10s per IP, backing off and retrying on 429.
- A daily cron job (default `0 3 * * *`) then keeps it fresh incrementally: per TVMaze's own docs, it resumes from `floor(highestKnownShowId / 250)` instead of re-crawling everything, merging new/updated shows into the existing set.
- Every successful crawl atomically swaps the in-memory store (`apps/api/src/store/show-store.ts`) and writes a new JSON snapshot (write-to-temp-file-then-rename, so a crash mid-write can't corrupt it) — a failed crawl never touches what's currently being served.
- `GET /genres?limit=` returns each genre's top-N shows by rating (default 20) — deliberately bounded, since a genre can have tens of thousands of shows and Home only ever needs a curated row. `GET /genres/names` returns just `{genre, count}[]`, no show payloads, for All Shows' genre filter dropdown.
- `GET /shows?page=&pageSize=&genre=&sort=` is the one exhaustive, paginated endpoint — global filter + sort + pagination with correct totals, backing All Shows.
- `GET /shows/:id`, `GET /search`, and `GET /schedule/:country` are **not** bulk-crawled (embedding cast info for ~89k shows would blow the rate limit for no benefit) — they proxy live to TVMaze, reusing apps/api's own local `IShowService`/`createShowApiClient` (`apps/api/src/tvmaze/`).
- `POST /admin/refresh` (guarded by an `X-Admin-Token` header) triggers a sync on demand instead of waiting for the daily schedule — useful for local testing/demoing.
- A small permissive CORS middleware (`apps/api/src/middleware/cors.ts`) lets the browser-based `apps/web` call across origins/ports — no cookies/credentials are involved, so this is deliberately simple rather than pulling in the `cors` package.

**Why a JSON snapshot instead of a database:** no database, no schema, no external account a reviewer would need to run this locally — `npm ci` + the two `npm start*` commands below still fully reproduce it. TVMaze itself caches the show index server-side for 24h, so a database's query capabilities aren't buying anything a flat in-memory array plus a disk backup doesn't already cover at this scale.

**Running it:**

```bash
cd apps/api && cp .env.example .env   # optional — sane defaults exist without this
npm run start:api                     # → http://localhost:4300
```

## Tech Stack

**Nx**  
**Vue 3**  
**TypeScript**
**Vite**  
**Vue Router**
**Vitest**  
**Playwright**
**Tailwind CSS v4**
**Express** (apps/api)
**node-cron** (apps/api)

## Dependency Rationale

Runtime dependencies are deliberately minimal — six packages across the whole app:

- **`vue` / `vue-router`** — the brief's preferred framework; Composition API throughout.
- **`tailwindcss` / `@tailwindcss/vite`** — utility-first styling with no custom CSS framework to hand-roll; the CSS-variable-based theme (`apps/web/src/styles.css`) drives light/dark mode entirely through it, with no separate theming library.
- **`express`** — `apps/api`'s HTTP server. Minimal and well-understood for a handful of routes; no framework magic to fight.
- **`node-cron`** — schedules `apps/api`'s daily incremental TVMaze sync from a single cron expression, instead of hand-rolling a `setInterval` scheduler with its own drift/skip handling.

What's deliberately **not** here, and why:

- **No state management library (Pinia/Vuex)** — `provide`/`inject` plus a handful of composables covers this app's actual state-sharing needs (see [Architecture](#architecture)); a store would be overhead without benefit at this scope.
- **No HTTP client (axios/ky)** — every network call is a plain `fetch()` wrapped in one small `fetchJson` helper per client (`packages/shows/src/api/backend-api.client.ts`, `apps/api/src/tvmaze/client.ts`); axios's interceptors/cancellation aren't used for anything this app currently needs.
- **No UI component library** — every control (buttons, selects, the theme toggle) is a plain styled HTML element; a kit would add a large surface area and its own theming model to reconcile with the Tailwind tokens already driving light/dark mode here.
- **No database/ORM** — `apps/api` persists its synced catalog as a single JSON snapshot on disk (see [Backend](#backend-appsapi)); the data fits comfortably in memory, and a database's query capabilities aren't buying anything at this scale.
- **No `cors` package** — a five-line custom middleware (`apps/api/src/middleware/cors.ts`) covers the one thing actually needed: allow the browser origin, no credentials involved.

Dev-only tooling — Nx (task graph/caching/module boundaries), Vite (dev server/bundler), Vitest (unit tests, shares Vite's config and transform pipeline), Playwright (e2e — chosen over Cypress for first-class multi-browser support and a faster headless runner), ESLint + Prettier + Husky/lint-staged (enforced at commit time, not just in CI) — is listed above and covered in [CI/CD](#cicd).

## Testing

### Unit tests

Co-located with source files (`foo.ts` → `foo.spec.ts`). `packages/shows` and `apps/api` tests run in Node; `apps/web` tests use jsdom via `@vue/test-utils`. The service interface (`IShowService`) is mocked — no HTTP calls; `apps/api`'s route handlers are tested as plain functions against mock req/res objects (no `supertest`), and its crawl/backoff/persistence logic uses fake timers and real temp-dir file I/O rather than mocking the filesystem.

```bash
npm test                           # all unit tests, including apps/api
npm test packages/shows/src        # shows package only
npm test apps/web/src/composables  # composables only
npm test apps/web/src/components   # components only
npm test apps/api/src              # backend service only
```

### E2E tests

Playwright's `webServer` config (`apps/web-e2e/playwright.config.ts`) boots **two** processes: the Vite dev server, and a dedicated `apps/api` instance warm-started from a committed, deterministic fixture (`apps/web-e2e/fixtures/shows-snapshot.json` — 600 shows across 4 genres, generated by `generate-snapshot.ts`) instead of crawling live TVMaze. This keeps catalog/genre/pagination assertions exact (known totals, known rating/title order) and fast, and the apps/api instance is never reused from an already-running dev server, so a stray manual instance with real crawled data can't silently make a test run non-deterministic.

Tests cover home navigation (genre carousels, a "See all" row linking into All Shows), search (URL params), show detail, All Shows' pagination/genre-filtering/sorting/deep-linking, and today's country filtering. `/shows/:id`, `/search`, and `/schedule/:country` still hit live TVMaze (they're proxied, not bulk-crawled), same as before.

```bash
npm run test:e2e          # headless
npm run test:e2e -- --ui  # Playwright UI mode
```

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request:

1. **Lint** — ESLint across all source files
2. **Type-check** — `tsc --noEmit` on the web app and packages
3. **Unit tests** — Vitest
4. **E2E tests** — Playwright (Chromium); report uploaded on failure
5. **Deploy (manual)** - by-pass actions and directly deploy to production (eg. hot fixes)

A **pre-commit hook** (Husky + lint-staged) runs ESLint + Prettier on staged files and a TypeScript type-check before every commit.

After each time actions above succesfully performed, deployment
is automatically to done production environment.

## Reproducible Installs

To ensure everyone gets exactly the same dependencies, this project uses a committed `package-lock.json` file. **Always install dependencies with:**

```
npm ci
```

This will install exactly what is in the lock file, guaranteeing reproducible builds for all contributors and CI.

## AI Usage

This project was built with heavy AI assistance, using Claude Code (Anthropic's agentic CLI) as a pair-programming tool rather than a one-shot generator:

- Product and architecture decisions — page structure, the `apps/api` backend-for-frontend design, consolidating the earlier Genre/Popular pages into a single filterable All Shows view, the dark-mode implementation strategy — were directed by the developer; Claude Code implemented them.
- Implementation — components, composables, the backend's crawl/cache/store logic, styling, and the unit/e2e test suites — was largely AI-written, in a loop of: make a change, run the real test suite (and a real browser check for UI-affecting work), fix what's wrong, repeat.
- Every change was reviewed before being accepted; a green test suite was treated as necessary, not sufficient, for UI work — pages were also exercised manually in the browser.
- Self-review caught real issues along the way, not just implemented requests — e.g. a WCAG contrast failure on the brand-red rating badge against dark backgrounds, and this README drifting out of sync with the app after the Genre/Popular/hero-banner removals, both surfaced by asking the AI to audit its own prior work rather than assuming it was fine.

## Known limitations

- `apps/api`'s incremental sync only walks forward from the highest known show id, so a show delisted from TVMaze's index would linger in the snapshot indefinitely rather than being pruned. Low-probability in practice, not handled.
- A shared Catalog link that includes `?genre=` may show no results if the linked genre no longer matches anything by the time it's opened — the filter resets to "All genres" automatically in that case rather than showing a blank state silently.
- `apps/web` has a hard runtime dependency on `apps/api` now — there's no fallback to TVMaze-direct if the backend is unreachable; the existing loading/error/retry UI just surfaces a connection error.
- Search and the country schedule are still live TVMaze proxies (through `apps/api`), not backed by the synced catalog — by design, since TVMaze's fuzzy search and daily schedule aren't things worth reimplementing or bulk-crawling (see the [Backend](#backend-appsapi) section).

## Possible improvement points

1. Runtime data validation with Zod
2. Global logging/monitoring integration (eg. Datadog)
3. MSW implementation to use mock data in both tests and development process to become independent from possible expected backend changes
4. Faker implementation to generate dynamic/realistic data for testing (minor)
5. Deploy `apps/api` somewhere persistent (currently only `apps/web` is deployed via Vercel) and point production's `VITE_API_BASE_URL` at it — needed before the live demo link reflects this backend-backed architecture
6. Prune delisted shows during incremental sync (see Known limitations)
