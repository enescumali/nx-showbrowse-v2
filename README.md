# ShowBrowse V2

TV show browser/dashboard backed by `apps/api`, a backend-for-frontend that syncs the full [TVMaze](https://www.tvmaze.com/api) show index.

Live demo: https://nx-showbrowse-v2.vercel.app/ (backed by `apps/api` at https://showbrowse-api.onrender.com — free tier, spins down after 15 min idle; first request after that can take 30–50s)

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

`apps/api` boots instantly, including on a fresh checkout — `apps/api/data/seed-snapshot.json.gz`, a real full crawl result, is committed to the repo and gets loaded on any boot that doesn't already have a live snapshot on disk. A live, multi-minute TVMaze crawl only happens if both the live snapshot and that committed seed are ever missing — which shouldn't occur in a normal checkout. See [Backend (`apps/api`)](#backend-appsapi) below for details.

## Features

- Home shows a curated overview: TV shows grouped by genre, each row sorted by rating, plus a global Top 10. Each row's "See all" link opens that same slice in All Shows page
- All Shows: real paginated/filtered/sorted browsing of the full catalog. Page, filter, sort, and page size are all reflected in the URL so a view can be shared or bookmarked
- Filter shows by country (On TV Today)
- Search shows by name
- Clicking a show opens a quick-view panel, a side panel on desktop, a bottom sheet on mobile, showing rating, genres, and overview, with a "View full page" link to the complete show detail page
- Full show detail page with cast
- Vertical and horizontal lazy loading for better UI performance
- Light/dark theme, following the system preference by default and toggleable, persisted across visits

## Architecture

The project is structured as an Nx monorepo with a strict separation between business logic and the UI layer, now spanning three projects:

```
packages/
  shows/    # Pure TypeScript — zero framework dependencies
              types, one API client (apps/api-facing: IBFFApiClient),
              and use cases that depend on it directly — all typed
              against apps/api's HTTP contract, never TVMaze's
apps/
  api/      # Node/Express backend-for-frontend
              owns its entire TVMaze integration locally (apps/api/src/tvmaze/):
              raw types, client, mapper, cached service — none of it shared
              with packages/shows (see "Backend" below)
  web/      # Vue 3 presentation layer
              components, composables, views, router, DI plugin
```

### Why a separate `packages` layer?

The core data logic (currently only fetching and minor checks) lives in `packages` (currently only `shows`) with no Vue imports. This means it can be unit-tested without a browser, reused in a different framework, or published as an npm package without changes. `apps/web` consumes it exclusively through the public API at `@show-browse/shows` and never talks to TVMaze directly. `apps/api` doesn't depend on it at all — its own TVMaze integration is entirely local (see below).

### Why use cases instead of putting logic in composables?

Use cases (`createGetCatalogPageUseCase`, `createSearchShowsUseCase`, etc.) are plain factory functions that express a single business operation and depend only on a narrow slice of `IBFFApiClient` (e.g. `Pick<IBFFApiClient, 'getCatalogPage'>`). This keeps the Vue composables thin — they handle reactivity and loading state, not business rules. It also makes the logic independently testable with a mock client, without mounting any component.

### Why `provide/inject` instead of Pinia?

All dependencies are wired once in `showsPlugin` and provided top-down via Vue's built-in DI. This avoids global module-level singletons, keeps the dependency graph explicit, and makes the entire composition root swappable in tests. Pinia would add value if cross-component shared state becomes more complex, but for this scope it would be overhead without benefit.

### Why Nx?

Nx enforces hard boundaries between `packages/` and `apps/` at the linter level, so it's impossible to accidentally import TVMaze types directly into a component. It also provides a single task runner with caching for build, test and lint across both packages. In addition, thanks to `nx affected` feature, deployments can be done on point based on only relevant changes.

### Caching

`apps/api/src/tvmaze/service.ts` keeps a simple in-memory TTL cache (managed via `CACHE_TTL_MS`, fallback 5 minutes) in front of its live TVMaze proxy calls (`/shows/:id`, `/search`, `/schedule/:country`) — those genuinely hit an external, rate-limited API, so avoiding a redundant call has a real payoff.

### Runtime validation

`packages/shows/src/api/schemas.ts` defines a Zod schema mirroring each of `packages/shows`'s own types (`Show`, `ShowDetail`, `CatalogPage`, `GenreGroup`, `GenreSummary`). `bff-api.client.ts`'s `fetchJson` runs every parsed response through the matching schema via `safeParse` before returning it — a failed parse throws `Unexpected response shape from <path>: <zod error>` instead of quietly returning malformed data typed as if it were correct. Return types are inferred from the schemas (`z.infer`), so there's exactly one source of truth per shape rather than a hand-maintained type plus a hand-maintained schema that could drift from each other.

This validates every one of `IBFFApiClient`'s six calls (`getCatalogPage`, `getGenreGroups`, `getGenreNames`, `getShowById`, `searchShows`, `getShowsByCountry`) — the full surface `apps/web` talks to `apps/api` through. `apps/web` and `apps/api` deploy independently (see CI/CD below), so a build-time type match between them doesn't guarantee anything at runtime — this is the actual boundary where a shape mismatch would surface, and now it fails loudly with a clear error instead of silently passing along malformed data.

### CI/CD

After each push, thanks to `nx affected`, based on the changes, both frontend app (on vercel) and backend (on render) will be re-deployed via GitHub Actions (`.github/workflows/ci.yml`) after all the checks (linting, unit and E2E tests) passed.

A **pre-commit hook** (Husky + lint-staged) runs ESLint + Prettier on staged files and a TypeScript type-check before every commit.

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
**Zod** (packages/shows)

## AI Usage

This project was built with heavy AI assistance, using Claude Code (Anthropic's agentic CLI) as a pair-programming tool rather than a one-shot generator:

- Product and architecture decisions, page structure, the `apps/api` backend-for-frontend design, consolidating the earlier Genre/Popular pages into a single filterable All Shows view, the dark-mode implementation strategy were directed by the developer; Claude Code implemented them.
- Implementation — components, composables, the backend's crawl/cache/store logic, styling, and the unit/e2e test suites — was largely AI-written, in a loop of: make a change, run the real test suite (and a real browser check for UI-affecting work), fix what's wrong, repeat.
- Every change was reviewed before being accepted; a green test suite was treated as necessary. For UI work, pages were also exercised manually in the browser.

## Known limitations

- `apps/api` is deployed on Render's free tier, which spins the instance down after 15 minutes of inactivity — the first request after idling can take 30–50s to wake it back up. The committed seed snapshot (see below) means that once awake, it's instantly serving real data rather than also having to crawl.
- The daily incremental sync (`SYNC_CRON_SCHEDULE`) is unreliable on Render's free tier.
- Search and the country schedule are still live TVMaze proxies (through `apps/api`), not backed by the synced catalog — by design, since TVMaze's fuzzy search and daily schedule aren't things worth reimplementing or bulk-crawling (see the [Backend](#backend-appsapi) section).

## Possible improvement points

1. Global logging/monitoring integration (eg. Datadog)
2. Move `apps/api` to a host with a persistent disk and no idle-based sleep (e.g. a paid Render tier, Fly.io with a volume) so the daily incremental sync actually persists across restarts instead of reverting to the committed seed (see Known limitations)
