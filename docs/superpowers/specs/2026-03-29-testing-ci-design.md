# Testing & CI Design

**Date:** 2026-03-29
**Scope:** Add Vitest unit tests for lib utilities and server actions, plus a GitHub Actions CI workflow.

---

## Goals

- Fast-running unit tests that fail loudly on regressions
- Cover pure utility functions and server action business logic (auth guards, DB interactions)
- CI that runs lint → type-check → test → build on every push and PR to `main`

## Test Infrastructure

**Runner:** Vitest with `node` environment (no jsdom — no component tests in scope).

**Config:** `vitest.config.ts` at project root, with `@/` path alias matching `tsconfig.json`.

**Prisma mocking:** `lib/__mocks__/@prisma/client.ts` exports a typed deep mock via `vitest-mock-extended`. Imported automatically by Vitest's module resolution when tests `vi.mock('@prisma/client')`. Each test sets return values with `mockResolvedValue`.

**Next.js mocking:** `next/headers` (used by auth cookie reads) mocked inline per test with `vi.mock('next/headers')`.

**New dev dependencies:**
- `vitest` — test runner
- `@vitest/coverage-v8` — coverage reporting (optional, available via `npm run coverage`)
- `vitest-mock-extended` — typed Prisma deep mocks

## Test Files

### `lib/utils.test.ts`
Pure unit tests, no mocks:
- `cn()` — merges classes, resolves Tailwind conflicts, ignores falsy values
- `groupWinesByMonth()` — groups by month/year, sorts newest-first, handles empty array, handles wines spanning multiple months

### `lib/i18n/index.test.ts`
Pure unit tests, no mocks:
- `getT()` — returns French translations for `"fr"`, English for anything else (including unknown values)
- `detectServerLang()` — detects `fr` from `Accept-Language` header variants, falls back to `en` for null/undefined/unrecognized
- `detectClientLang()` — returns `"en"` when `navigator` is undefined (SSR guard), detects `fr` from `navigator.language`

### `app/actions.test.ts`
Prisma and `next/headers` mocked:
- `getWines()` — returns wines for authenticated user; throws `"Unauthorized"` when no session
- `addSharedWine()` — copies wine to current user's collection; throws when token not found
- `followUser()` / `unfollowUser()` — creates/deletes Follow records; throws when unauthorized
- `generateShareToken()` — creates UUID token; if token already exists, returns existing (idempotent)
- `addToWishlist()` — saves wine to wishlist; throws when unauthorized
- `deleteWine()` — deletes wine record; throws when unauthorized

## Co-location Convention

Test files live next to the code they test:
```
lib/utils.ts              → lib/utils.test.ts
lib/i18n/index.ts         → lib/i18n/index.test.ts
app/actions.ts            → app/actions.test.ts
lib/__mocks__/            → shared Prisma mock
```

## npm Scripts

```json
"test": "vitest run",
"test:watch": "vitest",
"coverage": "vitest run --coverage"
```

## GitHub Actions CI

**File:** `.github/workflows/ci.yml`
**Triggers:** `push` and `pull_request` targeting `main`
**Node version:** 20 (LTS)

**Steps:**
1. `actions/checkout@v4`
2. `actions/setup-node@v4` with Node 20 and `npm ci` cache
3. `npm ci`
4. `npx prisma generate` — required before TypeScript can resolve Prisma types
5. `npm run lint`
6. `npx tsc --noEmit` — type-check without emitting files
7. `npm test` — Vitest in run mode (no watch)
8. `npm run build` — production build

**Environment:** `DATABASE_URL=file:./dev.db` set as an env var in the workflow. No real DB needed since all Prisma calls are mocked in tests; this satisfies Prisma's env requirement for `prisma generate` and `build`.

## Out of Scope

- React component tests (no jsdom/React Testing Library)
- E2E tests (no Playwright/Cypress)
- Integration tests against a real database
- AI image analysis action (`analyzeWineImage`) — requires live Anthropic API key
