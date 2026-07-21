# ShowBrowse — Copilot Instructions

## Project Overview

ShowBrowse is a Netflix-style TV show browser built in an Nx monorepo with clean architecture. Data comes from the [TVMaze REST API](https://api.tvmaze.com) (no auth, no API key).

## Monorepo Structure

```
packages/
  shows/              # Pure TS — entities, use cases, API client, mapper, service
    src/
      entities/       # show.entity.ts — Show, ShowDetail, CastMember interfaces
      use-cases/      # Factory functions: createGetShowsUseCase, createGetShowDetailUseCase, etc.
      services/       # IShowService interface + implementation (with TTL cache)
      api/            # TVMaze API client (fetch only, no axios)
      mappers/        # TVMaze response → domain entity mapping
      index.ts        # Single public API surface — only import from here

apps/
  web/                # Vue 3 presentation layer
    src/
      di/             # shows.plugin.ts (Vue plugin), injection-keys.ts (typed keys + injectRequired)
      composables/    # useMovies, useMovieDetail, useMovieSearch, useCountryShows, useGenreGroups
      components/     # HeroBanner, NavBar, ShowCarousel, ShowThumbnail, ShowThumbnailGrid
      views/          # ShowList, ShowDetail, Genre, PopularList
      router/         # index.ts — Vue Router, history mode
```

## Architecture Rules

- `packages/shows` has **zero framework dependencies** — no Vue, no Vite imports.
- `apps/web` never imports TVMaze types or raw API shapes directly; it only uses types exported from `@show-browse/shows`.
- Business logic belongs in use cases inside `packages/shows`, not in composables or components.
- New features that touch data fetching require changes in `packages/shows` first, then wired through the plugin.

## Dependency Injection

Dependencies flow via Vue's `provide/inject`, wired in `apps/web/src/di/shows.plugin.ts`:

```
showsPlugin (Vue plugin)
  → createShowApiClient(baseUrl)
  → createShowService(apiClient)             // has 5-min TTL in-memory cache
  → createGet*UseCase(service)               // one factory per use case
  → app.provide(SHOWS_USE_CASES_KEY, useCases)
  → app.provide(SEARCH_STATE_KEY, searchState)
  → app.provide(COUNTRY_STATE_KEY, countryState)
```

Composables call `injectRequired(KEY, 'name')` — **never** `inject()` directly. `injectRequired` throws at runtime with a clear message if the plugin is missing, and narrows the return type to `T` (not `T | undefined`), avoiding repetitive null checks.

Do **not** create module-level singletons (e.g. `const service = createShowService()` at the top of a file). All instances are created inside the plugin and provided through Vue's DI.

## Use Case Pattern

All use cases are **factory functions**, not classes:

```ts
// ✅ correct
export function createGetShowsUseCase(service: IShowService): GetShowsUseCase {
  return {
    async execute(page = 1) {
      if (page < 1) throw new Error('Page number must be greater than 0');
      return service.getShows(page);
    },
  };
}
```

Use case factories live in `packages/shows/src/use-cases/` and are exported from `packages/shows/src/index.ts`.

## Coding Conventions

- **TypeScript strict mode** everywhere — `"strict": true` in all tsconfigs.
- **`<script setup>`** syntax for all Vue SFCs.
- **Tailwind CSS v4** with `@theme` variables. Netflix palette: `#E50914` (red), `#141414` (bg), `#1f1f1f` (surface), `#2a2a2a` (elevated). No custom CSS files — use utilities only.
- **No axios** — use native `fetch` in the API client.
- Route names use PascalCase strings: `'ShowList'`, `'ShowDetail'`, `'Genre'`, `'PopularList'`.
- The detail route is `/shows/:id`.
- `hasMore` pagination: TVMaze returns 250 shows per full page. `hasMore = result.length >= 250`.

## Testing Conventions

- Tests are **co-located** with the source file they test (`foo.ts` → `foo.spec.ts` in the same folder).
- `packages/shows` tests run in **node** environment (no DOM needed).
- `apps/web` composable tests use `@vue/test-utils` `mount()` and need jsdom — add `// @vitest-environment jsdom` at the top of each file.
- Mock the `IShowService` interface, not the HTTP layer.
- Use case tests: one spec file per use case (`get-shows.use-case.spec.ts`, etc.).

## Commands

```bash
npm install                                     # install deps
npx nx serve web                                # dev server → http://localhost:4200
npx nx build web                                # production build → dist/apps/web
npx nx test web                                 # run web tests once
npx vitest run packages/shows/src               # run shows package tests
npx vitest run apps/web/src/composables         # run composable tests
npx vitest run                                  # run all tests
npx tsc --noEmit -p apps/web/tsconfig.json      # type-check the web app
```

## Key Files

| File                                                    | Purpose                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `packages/shows/src/index.ts`                           | Only public import surface for the shows package                                |
| `packages/shows/src/entities/show.entity.ts`            | `Show`, `ShowDetail`, `CastMember` interfaces                                   |
| `packages/shows/src/services/show-service.interface.ts` | `IShowService` — the contract the UI depends on                                 |
| `apps/web/src/di/shows.plugin.ts`                       | Wires all infrastructure; validates env vars in production                      |
| `apps/web/src/di/injection-keys.ts`                     | Typed `InjectionKey` symbols + `injectRequired<T>()`                            |
| `apps/web/vite.config.mts`                              | Vite config with explicit alias for `@show-browse/shows`                        |
| `tsconfig.base.json`                                    | Root tsconfig — path alias `@show-browse/shows` → `packages/shows/src/index.ts` |
