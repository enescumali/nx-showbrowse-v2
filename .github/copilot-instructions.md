# ShowBrowse — Copilot Instructions

## Project Overview

ShowBrowse is a TV show browser/dashboard built as an Nx monorepo spanning **three** projects. `apps/web` never talks to TVMaze directly — it talks to `apps/api`, our own backend-for-frontend, which periodically crawls TVMaze's full show index ([tvmaze.com/api](https://www.tvmaze.com/api)) into memory so genre-grouping, global rating sort, and real pagination can all be correct at once (TVMaze's own `/shows` index paginates but has no genre-aware endpoint and no total page count).

## Monorepo Structure

```
packages/
  shows/                # Pure TS — zero framework dependencies
    src/
      types/            # show.types.ts — Show, ShowDetail, CastMember
                         # (this package's OWN types — never TVMaze's, never apps/api's internal ones)
      api/
        bff-api-client.interface.ts  # IBFFApiClient contract + CatalogQuery/Page, GenreGroup, GenreSummary
        bff-api.client.ts            # fetch-based client — validates every response with Zod (schemas.ts)
        schemas.ts                  # Zod schemas mirroring types/ — the runtime validation gate
      use-cases/         # createGetCatalogPageUseCase, createSearchShowsUseCase, etc.
                         # plain factories returning a callable async function, not classes
      utils/             # group-shows-by-genre.ts — client-side grouping for apps/web's Today page
      index.ts           # single public export surface — only import from here

apps/
  api/                  # Node/Express backend-for-frontend (its own project, NOT imported by packages/shows)
    src/
      tvmaze/           # apps/api's PRIVATE TVMaze integration: raw wire types, IShowApiClient,
                         # mapper (raw → domain), cached IShowService — never shared with packages/shows
      store/            # in-memory show store + group-shows-by-genre (server-side copy, independent
                         # of packages/shows's client-side one)
      ingestion/         # crawl-shows, merge-shows, rate-limiter, snapshot (read/write),
                         # seed-snapshot (loads the committed apps/api/data/seed-snapshot.json.gz
                         # fallback for instant boot on a fresh checkout/container), sync-service
      routes/            # health, genres, shows, search, schedule, admin (refresh)
      middleware/         # cors, readiness gate (503 until the store is populated)
      scheduling/         # node-cron daily incremental sync
      di/                 # container.ts — wires apiClient/store/syncService/tvMazeShowService
      config/             # env.ts — reads process.env once, computes defaults
      types/              # apps/api's own mapped Show/ShowDetail/CastMember (app-wide, used by
                         # store/ingestion/routes, not just tvmaze/)

  web/                  # Vue 3 presentation layer
    src/
      di/               # shows.plugin.ts (installs use cases via provide), injection-keys.ts
                         # (SHOWS_USE_CASES_KEY + injectRequired)
      composables/      # useShowCatalog, useShowDetail, useShowSearch, useGenreCarousels,
                         # useGenreNames, useTopRatedShows, useCountryShows, useGenreGroups,
                         # useQuickView, useTheme, useAsyncState (shared loading/error wrapper)
      components/
        show/           # Carousel, Thumbnail, ThumbnailGrid, QuickView, DetailContent
                         # (DetailContent is shared by QuickView and the full ShowDetail page —
                         # single source of markup; QuickView passes :show-cast="false")
        catalog/        # Filters, Pagination
      views/            # Homepage, Catalog, ShowDetail, Today, NotFound
      router/           # routes.ts (Home, Catalog, ShowDetail, Today, NotFound), index.ts
```

## Architecture Rules

- `packages/shows` has **zero framework dependencies** — no Vue, no Vite imports. It represents `apps/web`'s view of **`apps/api`'s HTTP contract only** — it has no business knowing that data originated from TVMaze.
- `apps/api` owns its **entire** TVMaze integration privately in `apps/api/src/tvmaze/`. It does **not** depend on `packages/shows` at all.
- `packages/shows` and `apps/api` deliberately maintain **independent, non-shared** `Show`/`ShowDetail`/`CastMember` type definitions. Do not import one's types into the other — that's an intentional boundary, not an oversight. The three read use cases with identical signatures on both sides (`getShowById`/`searchShows`/`getShowsByCountry`) share use-case factories in `packages/shows` typed only against its own `Pick<IBFFApiClient, ...>`, never against anything TVMaze-shaped.
- Because the two sides deploy **independently** (see Deployment below), a TypeScript type match at build time doesn't guarantee anything at runtime. `packages/shows/src/api/bff-api.client.ts` validates every response from `apps/api` with a Zod schema (`schemas.ts`) before returning it — this is the actual boundary where a shape drift would surface. Don't remove this in favor of a plain type assertion.
- `apps/web` never imports TVMaze types or raw wire shapes directly; it only uses types exported from `@show-browse/shows`.
- Business logic (the actual use case, e.g. "get a catalog page") belongs in `packages/shows/src/use-cases/`, not in composables or components. Composables handle reactivity/loading state only.

## Dependency Injection

`apps/web`: dependencies flow via Vue's `provide`/`inject`, wired once in `apps/web/src/di/shows.plugin.ts`:

```
showsPlugin (Vue plugin)
  → createBFFApiClient(VITE_BFF_API_BASE_URL)   // points at apps/api, never TVMaze
  → createGet*UseCase(apiClient), createSearchShowsUseCase(apiClient), etc.
  → app.provide(SHOWS_USE_CASES_KEY, { getCatalogPage, getGenreGroups, getGenreNames,
                                        getShowDetail, searchShows, getShowsByCountry })
```

Composables call `injectRequired(SHOWS_USE_CASES_KEY, 'ShowsUseCases')` — **never** `inject()` directly. `injectRequired` throws at runtime with a clear message if the plugin wasn't installed, and narrows the return type to `T` (not `T | undefined`).

Do **not** create module-level singletons. No Pinia/Vuex either — `provide`/`inject` plus a handful of composables covers this app's state-sharing needs; a store would be overhead without benefit at this scope.

`apps/api`: `apps/api/src/di/container.ts` wires `apiClient`/`store`/`syncService`/`tvMazeShowService` once in `main.ts`'s bootstrap — same "wire once, pass explicitly" philosophy, just without Vue's DI system since there's no component tree.

## Use Case Pattern

Use case factories are **plain functions returning a callable async function** — not classes, and not an object with an `.execute()` method:

```ts
// packages/shows/src/use-cases/get-catalog-page.use-case.ts
export function createGetCatalogPageUseCase(apiClient: Pick<IBFFApiClient, 'getCatalogPage'>) {
  return async function getCatalogPage(query: CatalogQuery): Promise<CatalogPage> {
    return apiClient.getCatalogPage(query);
  };
}
```

Note the narrowed `Pick<IBFFApiClient, 'getCatalogPage'>` parameter — each use case depends only on the slice of the client it actually needs, not the whole interface. Use case factories live in `packages/shows/src/use-cases/` and are exported from `packages/shows/src/index.ts`.

## Coding Conventions

- **TypeScript strict mode** everywhere.
- **`<script setup>`** syntax for all Vue SFCs.
- **Tailwind CSS v4** with CSS-variable-based theming (`apps/web/src/styles.css`) driving light/dark mode — no separate theming library, no custom CSS files beyond that.
- **No axios, no HTTP client library** — plain `fetch()` wrapped in one small helper per client (`packages/shows/src/api/bff-api.client.ts`, `apps/api/src/tvmaze/client.ts`).
- **No UI component library** — every control is a plain styled HTML element.
- Route names are PascalCase strings: `'Home'`, `'Catalog'`, `'ShowDetail'`, `'Today'`, `'NotFound'`. The detail route is `/shows/:id`.
- Pagination is real, server-computed pagination from `apps/api` (`page`/`pageSize`/`totalShows`/`totalPages` in every `/shows` response) — not a client-side `hasMore` heuristic. `apps/api` can compute a correct `totalPages` because it's crawled the entire TVMaze index; a direct-to-TVMaze client couldn't.

## Testing Conventions

- Tests are **co-located** with the source file they test (`foo.ts` → `foo.spec.ts`).
- `packages/shows` and `apps/api` tests run in **node**; `apps/web` composable/component tests need jsdom — add `// @vitest-environment jsdom` at the top of the file.
- Mock the relevant **interface** (`IBFFApiClient`, `IShowService`, `ShowsUseCases`), not the HTTP layer — except `packages/shows/src/api/bff-api.client.spec.ts`, which is the one place that legitimately mocks `fetch` itself, since it's testing the client (including Zod validation) rather than something that depends on it.
- `apps/api`'s crawl/rate-limiter/cron logic uses `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(...)`, not real waits.
- E2E (Playwright, `apps/web-e2e/`) boots a dedicated `apps/api` instance warm-started from a committed, deterministic fixture (`apps/web-e2e/fixtures/shows-snapshot.json`), never live TVMaze — this makes catalog/pagination assertions exact. It deliberately does **not** reuse an already-running dev `apps/api` instance, so a manually running one on port 4300 will make `npm run test:e2e` fail to bind — stop it first.

## Commands

```bash
npm ci                                          # install deps (whole monorepo, single root package.json)

npx nx serve api                                # apps/api dev server → http://localhost:4300 (watch mode)
npm run start:api                               # same, via the npm script
npx nx serve web                                # apps/web dev server → http://localhost:4200
npm start                                       # same, via the npm script
# Both need to be running for apps/web to show real data.

npx nx build web                                # production build → dist/apps/web
npm run test:e2e                                # Playwright e2e (starts its own apps/api + Vite server)

npx vitest run                                  # run all unit tests
npx vitest run packages/shows/src               # shows package only
npx vitest run apps/web/src/composables         # composables only
npx vitest run apps/api/src                     # backend only

npx tsc --noEmit -p apps/web/tsconfig.json      # type-check web
npx tsc --noEmit -p apps/api/tsconfig.json      # type-check api
npx tsc --noEmit -p packages/shows/tsconfig.json # type-check shows
npx nx lint web                                 # lint web
npx nx lint api                                 # lint api
```

## Deployment

`apps/web` deploys to Vercel via its own Git integration (auto-deploys every push — cheap, stateless). `apps/api` deploys to Render, but with `autoDeploy: false` in `render.yaml` — it's a stateful, memory-constrained process, so `.github/workflows/deploy.yml` triggers its deploy hook explicitly, only when `nx show projects --affected` reports `api` as affected by the push. Don't assume a change to `apps/api` will "just deploy" the way `apps/web` does — check that workflow.

## Key Files

| File                                                 | Purpose                                                                           |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `packages/shows/src/index.ts`                        | Only public import surface for the shows package                                  |
| `packages/shows/src/types/show.types.ts`             | `Show`, `ShowDetail`, `CastMember` — this package's own, independent types        |
| `packages/shows/src/api/schemas.ts`                  | Zod schemas validating every `apps/api` response at runtime                       |
| `packages/shows/src/api/bff-api-client.interface.ts` | `IBFFApiClient` — the contract use cases depend on (narrowed via `Pick`)          |
| `apps/api/src/tvmaze/mapper.ts`                      | Raw TVMaze wire format → `apps/api`'s own domain types (strips HTML from summary) |
| `apps/api/src/ingestion/seed-snapshot.ts`            | Loads the committed, gzip-compressed crawl result for instant cold boot           |
| `apps/api/src/di/container.ts`                       | Wires `apps/api`'s own dependencies (no Vue DI on this side)                      |
| `apps/web/src/di/shows.plugin.ts`                    | Wires all `apps/web` infrastructure; throws if `VITE_BFF_API_BASE_URL` is unset   |
| `apps/web/src/di/injection-keys.ts`                  | `SHOWS_USE_CASES_KEY` + `injectRequired<T>()`                                     |
| `render.yaml`                                        | Render Blueprint for `apps/api` — build/start commands, `autoDeploy: false`       |
| `.github/workflows/deploy.yml`                       | `nx affected`-gated Render deploy trigger                                         |
