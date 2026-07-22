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

- Browse TV shows grouped by genre, each sorted by rating — computed by `apps/api` across its *entire* synced catalog, not a single page
- Top-rated shows hero banner on the home screen, likewise a real global top-N
- All Shows: real paginated/filtered/sorted browsing of the full catalog — genre filter and sort (rating, release date, or title) apply across every show that matches, not just the current page. Page, filter, and sort are all reflected in the URL so a view can be shared or bookmarked
- Genre pages paginate too — a genre can have thousands of shows, so "view all" is a real paginated grid, not a single unbounded dump
- Popular shows ranked by rating across the whole catalog, paginated
- Filter shows by country (today's schedule)
- Search shows by name
- Full show detail page with cast
- Vertical and horizontal lazy loading for better UI performance
- Optimistic detail page render for smoother experience

## Architecture

The project is structured as an Nx monorepo with a strict separation between business logic and the UI layer, now spanning three projects:

```
packages/
  shows/    # Pure TypeScript — zero framework dependencies
              entities, mappers, use cases, and two independent client/service pairs:
              - TVMaze-facing (IShowApiClient/IShowService) — used internally by apps/api
              - apps/api-facing (IBackendApiClient/ICatalogService) — used by apps/web
apps/
  api/      # Node/Express backend-for-frontend
              crawls & serves the full TVMaze catalog (see "Backend" below)
  web/      # Vue 3 presentation layer
              components, composables, views, router, DI plugin
```

### Why a separate `packages` layer?

The core data logic (fetching, mapping, caching) lives in `packages` (currently only `shows`) with no Vue imports. This means it can be unit-tested without a browser, reused in a different framework, or published as an npm package without changes. Both `apps/web` and `apps/api` consume it exclusively through the public API at `@show-browse/shows` — `apps/api` uses the TVMaze-facing client/service for its own live proxy routes and ingestion crawl; `apps/web` uses the apps/api-facing client/service, and never talks to TVMaze directly.

### Why two client/service pairs instead of one?

`IShowApiClient`/`IShowService` model TVMaze's actual shape (paginated but genre-blind, no totals). `IBackendApiClient`/`ICatalogService` model what apps/api actually offers (genre-aware, globally paginated, real totals) — a structurally different capability, not just a different base URL, so it's a separate interface rather than a mutation of the first one. The three read operations that *are* identical in shape between them (`getShowById`/`searchShows`/`getShowsByCountry`) share the same use-case factories via a narrowed parameter type (`Pick<IShowService, 'getShowById'>`, etc.) instead of being duplicated.

### Why use cases instead of putting logic in composables?

Use cases (`createGetCatalogPageUseCase`, `createSearchShowsUseCase`, etc.) are plain factory functions that express a single business operation and depend only on a narrow slice of a service interface. This keeps the Vue composables thin — they handle reactivity and loading state, not business rules. It also makes the logic independently testable with a mock service, without mounting any component.

### Why `provide/inject` instead of Pinia?

All dependencies are wired once in `showsPlugin` and provided top-down via Vue's built-in DI. This avoids global module-level singletons, keeps the dependency graph explicit, and makes the entire composition root swappable in tests. Pinia would add value if cross-component shared state becomes more complex, but for this scope it would be overhead without benefit.

### Why Nx?

Nx enforces hard boundaries between `packages/` and `apps/` at the linter level, so it's impossible to accidentally import TVMaze types directly into a component. It also provides a single task runner with caching for build, test and lint across both packages.

### Caching

Both service implementations in `packages/shows` use the same simple in-memory TTL cache shape (managed via `CACHE_TTL_MS`, fallback 5 minutes), keyed per query:

- `show.service.ts` (TVMaze-facing, used by `apps/api`'s live proxy routes) — per TVMaze page (`shows:0`, `shows:1`, ...), per show id, per country.
- `catalog.service.ts` (apps/api-facing, used by `apps/web`) — per exact `{page,pageSize,genre,sort}` query, per genre-groups `limit`, per show id, per country. Search is never cached in either — repeatedly searching the same term should reflect current results, not stale ones.

### Why "Browse by Genre" and "All Shows" are separate pages

TVMaze's `/shows` index paginates but has no genre-aware endpoint and never exposes a total page count — grouping by genre and knowing "how many pages exist" both require having crawled the *entire* index first. `apps/api` does exactly that (see below), so both capabilities now exist and are correct at the same time. The two pages still exist because they serve different UX purposes, not because of a data limitation:

- **Home (`/`)** shows a curated, bounded view: top-N per genre and a global top-10, both computed by `apps/api` across the whole catalog (`GET /genres?limit=20`, `GET /shows?sort=rating&pageSize=10`). This is "what's good," not "everything."
- **All Shows (`/catalog`)**, **Genre pages (`/genre/:genre`)**, and **Popular (`/popular`)** are exhaustive, paginated views over `GET /shows`, which supports real `{page, pageSize, genre, sort}` filtering with correct `totalPages`/`totalShows` — a genre filter or sort here reflects *every* matching show in the catalog, not just what happened to be on the current page.

Since `apps/api`'s `/shows` always returns a real `totalPages` (unlike TVMaze), `useShowCatalog` (`apps/web/src/composables/useShowCatalog.ts`) just compares against it directly for Prev/Next/boundary logic — no probing or 404-based guessing needed. A failed request (a genuine network/server error, not an expected "out of range" case) leaves the previously-loaded page on screen with an inline notice, rather than blanking the grid.

## Backend (`apps/api`)

A small backend-for-frontend that periodically crawls TVMaze's **full** show index into memory, so genre-grouping, global sorting, and real pagination can all be correct **at the same time** — `apps/web` consumes it exclusively and never talks to TVMaze directly for the bulk catalog.

**How it works:**

- On boot, it loads a JSON snapshot from disk (if one exists) for an instant warm start, then serves immediately — `/health` always returns 200 so it never looks "down" during a crawl, while `/genres`, `/genres/names`, and `/shows` return 503 until the store is populated.
- If there's no snapshot (first-ever boot), it crawls TVMaze's index from page 0, rate-limited under TVMaze's documented ~20 calls/10s per IP, backing off and retrying on 429.
- A daily cron job (default `0 3 * * *`) then keeps it fresh incrementally: per TVMaze's own docs, it resumes from `floor(highestKnownShowId / 250)` instead of re-crawling everything, merging new/updated shows into the existing set.
- Every successful crawl atomically swaps the in-memory store (`apps/api/src/store/show-store.ts`) and writes a new JSON snapshot (write-to-temp-file-then-rename, so a crash mid-write can't corrupt it) — a failed crawl never touches what's currently being served.
- `GET /genres?limit=` returns each genre's top-N shows by rating (default 20) — deliberately bounded, since a genre can have tens of thousands of shows and Home only ever needs a curated row. `GET /genres/names` returns just `{genre, count}[]`, no show payloads, for NavBar's nav links.
- `GET /shows?page=&pageSize=&genre=&sort=` is the one exhaustive, paginated endpoint — global filter + sort + pagination with correct totals, backing Catalog, Genre, and Popular.
- `GET /shows/:id`, `GET /search`, and `GET /schedule/:country` are **not** bulk-crawled (embedding cast info for ~89k shows would blow the rate limit for no benefit) — they proxy live to TVMaze, reusing the exact same tested TVMaze-facing `IShowService`/`createShowApiClient` from `packages/shows`.
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

Tests cover home navigation, search (URL params), show detail, catalog pagination/filtering/sorting, genre-page pagination and cross-genre navigation, popular-list pagination, and country filtering. `/shows/:id`, `/search`, and `/schedule/:country` still hit live TVMaze (they're proxied, not bulk-crawled), same as before.

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
