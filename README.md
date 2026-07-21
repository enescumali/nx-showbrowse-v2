# ShowBrowse

A Netflix-style TV show browser powered by the [TVMaze API](https://www.tvmaze.com/api).

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

# Run dev server → http://localhost:4200
npm start

# Build for production
npm run build

# Run all unit tests
npm test

# Run E2E tests (starts dev server automatically)
npm run test:e2e
```

## Features

- Browse TV shows grouped by genre, each sorted by rating
- Top-rated shows hero banner on the home screen
- Filter shows by country (today's schedule)
- Search shows by name
- Full show detail page with cast
- Popular shows ranked by rating
- Vertical and horizontal lazy loading for better UI performance,
- Optimistic detail page render for smoother experience

## Architecture

The project is structured as an Nx monorepo with a strict separation between business logic and the UI layer:

```
packages/
  shows/    # Pure TypeScript — zero framework dependencies
              entities, use cases, API client, mapper, service
apps/
  web/      # Vue 3 presentation layer
              components, composables, views, router, DI plugin
```

### Why a separate `packages` layer?

The core data logic (fetching, mapping, caching) lives in `packages` (currently on has `shows`) with no Vue imports. This means it can be unit-tested without a browser, reused in a different framework, or published as an npm package without changes. The Vue app consumes it exclusively through the public API at `@show-browse/shows`.

### Why use cases instead of putting logic in composables?

Use cases (`createGetShowsUseCase`, `createSearchShowsUseCase`, etc.) are plain factory functions that express a single business operation and depend only on the `IShowService` interface. This keeps the Vue composables thin — they handle reactivity and loading state, not business rules. It also makes the logic independently testable with a mock service, without mounting any component.

### Why `provide/inject` instead of Pinia?

All dependencies are wired once in `showsPlugin` and provided top-down via Vue's built-in DI. This avoids global module-level singletons, keeps the dependency graph explicit, and makes the entire composition root swappable in tests. Pinia would add value if cross-component shared state becomes more complex, but for this scope it would be overhead without benefit.

### Why Nx?

Nx enforces hard boundaries between `packages/` and `apps/` at the linter level, so it's impossible to accidentally import TVMaze types directly into a component. It also provides a single task runner with caching for build, test and lint across both packages.

### Caching

`packages/shows/src/services/show.service.ts` implements a simple in-memory TTL cache (managed in environment variables, fallbacks to 5 minutes) per data type. This avoids redundant API calls during navigation without introducing an external dependency.

## Tech Stack

**Nx**  
**Vue 3**  
**TypeScript**
**Vite**  
**Vue Router**
**Vitest**  
**Playwright**
**Tailwind CSS v4**

## Testing

### Unit tests

Co-located with source files (`foo.ts` → `foo.spec.ts`). `packages/shows` tests run in Node; `apps/web` tests use jsdom via `@vue/test-utils`. The service interface (`IShowService`) is mocked — no HTTP calls.

```bash
npm test                           # all unit tests
npm test packages/shows/src        # shows package only
npm test apps/web/src/composables  # composables only
npm test apps/web/src/components   # components only
```

### E2E tests

Playwright tests in `apps/web-e2e/src/` spin up the Vite dev server automatically. They cover home navigation, search (URL params), show detail, popular page, genre filtering, and country filtering.

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

## Possible improvement points

1. Runtime data validation with Zod
2. Global logging/monitoring integration (eg. Datadog)
3. MSW implementation to use mock data in both tests and development process to become independent from possible expected backend changes
4. Faker implementation to generate dynamic/realistic data for testing (minor)
