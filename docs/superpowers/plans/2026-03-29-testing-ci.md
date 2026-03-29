# Testing & CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Vitest unit tests covering lib utilities and server actions, plus a GitHub Actions CI workflow that runs lint → type-check → test → build.

**Architecture:** Extract a Prisma singleton to `lib/prisma.ts` so tests can mock it via Vitest's `__mocks__` convention. Server action tests mock `getCurrentUser` directly (cleaner than mocking `next/headers` cookie reads). Pure utility tests need no mocks at all.

**Tech Stack:** Vitest, vitest-mock-extended, @vitest/coverage-v8, GitHub Actions

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `lib/prisma.ts` | Create | Singleton `prisma` export — enables mocking |
| `lib/__mocks__/prisma.ts` | Create | Deep-mocked Prisma client, auto-used by `vi.mock('@/lib/prisma')` |
| `app/actions.ts` | Modify | Import `prisma` from `@/lib/prisma` instead of `new PrismaClient()` |
| `app/auth-actions.ts` | Modify | Import `prisma` from `@/lib/prisma` instead of `new PrismaClient()` |
| `vitest.config.ts` | Create | Vitest config: node environment + `@/` path alias |
| `package.json` | Modify | Add test/coverage scripts; install dev deps |
| `lib/utils.test.ts` | Create | Tests for `cn` and `groupWinesByMonth` |
| `lib/i18n/index.test.ts` | Create | Tests for `getT`, `detectServerLang`, `detectClientLang` |
| `app/actions.test.ts` | Create | Tests for server actions with Prisma mocked |
| `.github/workflows/ci.yml` | Create | CI: lint → type-check → test → build |

---

### Task 1: Install dev dependencies and configure Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest and related packages**

```bash
npm install --save-dev vitest @vitest/coverage-v8 vitest-mock-extended
```

Expected: packages added to `devDependencies` in `package.json`, `package-lock.json` updated.

- [ ] **Step 2: Add test scripts to package.json**

In `package.json`, update the `"scripts"` block:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest",
  "coverage": "vitest run --coverage"
}
```

- [ ] **Step 3: Create vitest.config.ts at the project root**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 4: Verify Vitest starts without errors**

```bash
npm test
```

Expected: exits cleanly. May print `No test files found, exiting with code 0` — that's fine.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "feat: install vitest and configure test runner"
```

---

### Task 2: Extract Prisma singleton

**Files:**
- Create: `lib/prisma.ts`
- Modify: `app/actions.ts`
- Modify: `app/auth-actions.ts`

Both files currently call `new PrismaClient()` directly at module level. Extracting a singleton makes it possible to replace the instance in tests.

- [ ] **Step 1: Create lib/prisma.ts**

```ts
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
```

- [ ] **Step 2: Update app/actions.ts — replace the PrismaClient import and instantiation**

Find this block at the top of `app/actions.ts`:

```ts
import { PrismaClient, Prisma, Wine } from "@prisma/client";
```

Replace with:

```ts
import { Prisma, Wine } from "@prisma/client";
import { prisma } from "@/lib/prisma";
```

Then remove line 14:

```ts
const prisma = new PrismaClient();
```

- [ ] **Step 3: Update app/auth-actions.ts — replace the PrismaClient import and instantiation**

Find this line at the top of `app/auth-actions.ts`:

```ts
import { PrismaClient } from "@prisma/client";
```

Replace with:

```ts
import { prisma } from "@/lib/prisma";
```

Then remove line 7:

```ts
const prisma = new PrismaClient();
```

- [ ] **Step 4: Verify the build still passes**

```bash
npx prisma generate && npm run build
```

Expected: build succeeds with no TypeScript errors. Fix any type errors before continuing.

- [ ] **Step 5: Commit**

```bash
git add lib/prisma.ts app/actions.ts app/auth-actions.ts
git commit -m "refactor: extract Prisma singleton to lib/prisma.ts"
```

---

### Task 3: Create the Prisma mock

**Files:**
- Create: `lib/__mocks__/prisma.ts`

When a test calls `vi.mock('@/lib/prisma')` with no factory, Vitest automatically uses the adjacent `__mocks__` file. This exports a deep mock of the full Prisma client — every method is a `vi.fn()` that can be configured per test.

- [ ] **Step 1: Create lib/__mocks__/prisma.ts**

```ts
import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'vitest-mock-extended';

export const prisma = mockDeep<PrismaClient>();
```

- [ ] **Step 2: Commit**

```bash
git add "lib/__mocks__/prisma.ts"
git commit -m "test: add Prisma deep mock"
```

---

### Task 4: Write lib/utils.test.ts

**Files:**
- Create: `lib/utils.test.ts`

- [ ] **Step 1: Create lib/utils.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { cn, groupWinesByMonth } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('resolves Tailwind conflicts keeping the last value', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('ignores falsy values', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
  });

  it('returns empty string with no arguments', () => {
    expect(cn()).toBe('');
  });
});

describe('groupWinesByMonth', () => {
  it('returns empty array for empty input', () => {
    expect(groupWinesByMonth([], 'en-US')).toEqual([]);
  });

  it('groups wines in the same month into one bucket', () => {
    const wines = [
      { createdAt: new Date('2024-03-10'), name: 'A' },
      { createdAt: new Date('2024-03-20'), name: 'B' },
    ];
    const result = groupWinesByMonth(wines, 'en-US');
    expect(result).toHaveLength(1);
    expect(result[0].wines).toHaveLength(2);
  });

  it('groups wines in different months into separate buckets', () => {
    const wines = [
      { createdAt: new Date('2024-01-01'), name: 'A' },
      { createdAt: new Date('2024-03-01'), name: 'B' },
    ];
    const result = groupWinesByMonth(wines, 'en-US');
    expect(result).toHaveLength(2);
  });

  it('sorts buckets newest-first', () => {
    const wines = [
      { createdAt: new Date('2024-01-01'), name: 'A' },
      { createdAt: new Date('2024-03-01'), name: 'B' },
    ];
    const result = groupWinesByMonth(wines, 'en-US');
    expect(result[0].wines[0].name).toBe('B'); // March first
    expect(result[1].wines[0].name).toBe('A'); // January second
  });

  it('accepts string dates', () => {
    const wines = [{ createdAt: '2024-06-15', name: 'C' }];
    const result = groupWinesByMonth(wines, 'en-US');
    expect(result).toHaveLength(1);
    expect(result[0].wines[0].name).toBe('C');
  });
});
```

- [ ] **Step 2: Run and verify**

```bash
npm test lib/utils.test.ts
```

Expected:
```
 ✓ lib/utils.test.ts (9)
   ✓ cn (4)
   ✓ groupWinesByMonth (5)

 Test Files  1 passed (1)
 Tests       9 passed (9)
```

- [ ] **Step 3: Commit**

```bash
git add lib/utils.test.ts
git commit -m "test: add unit tests for cn and groupWinesByMonth"
```

---

### Task 5: Write lib/i18n/index.test.ts

**Files:**
- Create: `lib/i18n/index.test.ts`

- [ ] **Step 1: Create lib/i18n/index.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { getT, detectServerLang, detectClientLang } from './index';

describe('getT', () => {
  it('returns French translations for "fr"', () => {
    const fr = getT('fr');
    const en = getT('en');
    // The objects should be distinct (different translation sets)
    expect(fr).not.toBe(en);
  });

  it('returns an object for "en"', () => {
    const t = getT('en');
    expect(t).toBeDefined();
    expect(typeof t).toBe('object');
  });

  it('falls back to English for an unknown locale', () => {
    expect(getT('de')).toBe(getT('en'));
  });

  it('falls back to English for an empty string', () => {
    expect(getT('')).toBe(getT('en'));
  });
});

describe('detectServerLang', () => {
  it('returns "fr" for a full French Accept-Language header', () => {
    expect(detectServerLang('fr-FR,fr;q=0.9,en;q=0.8')).toBe('fr');
  });

  it('returns "fr" for a bare "fr" value', () => {
    expect(detectServerLang('fr')).toBe('fr');
  });

  it('returns "en" for an English Accept-Language header', () => {
    expect(detectServerLang('en-US,en;q=0.9')).toBe('en');
  });

  it('returns "en" for null', () => {
    expect(detectServerLang(null)).toBe('en');
  });

  it('returns "en" for undefined', () => {
    expect(detectServerLang(undefined)).toBe('en');
  });

  it('returns "en" for an empty string', () => {
    expect(detectServerLang('')).toBe('en');
  });
});

describe('detectClientLang', () => {
  it('returns "en" when navigator is undefined (node / SSR environment)', () => {
    // vitest runs in node — navigator is not defined by default
    expect(detectClientLang()).toBe('en');
  });

  it('returns "fr" when navigator.language starts with "fr"', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'fr-FR' },
      configurable: true,
      writable: true,
    });
    expect(detectClientLang()).toBe('fr');
    Object.defineProperty(globalThis, 'navigator', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it('returns "en" when navigator.language is "en-US"', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'en-US' },
      configurable: true,
      writable: true,
    });
    expect(detectClientLang()).toBe('en');
    Object.defineProperty(globalThis, 'navigator', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });
});
```

- [ ] **Step 2: Run and verify**

```bash
npm test lib/i18n/index.test.ts
```

Expected:
```
 ✓ lib/i18n/index.test.ts (13)
   ✓ getT (4)
   ✓ detectServerLang (6)
   ✓ detectClientLang (3)

 Test Files  1 passed (1)
 Tests       13 passed (13)
```

- [ ] **Step 3: Commit**

```bash
git add lib/i18n/index.test.ts
git commit -m "test: add unit tests for i18n utilities"
```

---

### Task 6: Write app/actions.test.ts

**Files:**
- Create: `app/actions.test.ts`

**Mocking strategy:**
- `@/lib/prisma` — replaced by `lib/__mocks__/prisma.ts` (deep mock)
- `./auth-actions` — `getCurrentUser` replaced by `vi.fn()` (avoids needing to mock `next/headers` cookies)
- `next/cache` — `revalidatePath` replaced by `vi.fn()` (no-op)
- `next/navigation` — `redirect` replaced by `vi.fn()` (in real Next.js, `redirect` throws; the mock prevents that)

- [ ] **Step 1: Create app/actions.test.ts**

```ts
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { mockReset } from 'vitest-mock-extended';
import type { DeepMockProxy } from 'vitest-mock-extended';
import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

// vi.mock calls are hoisted to the top of the file by Vitest before any imports run.
// This means the mocks are in place before actions.ts is imported and its module-level
// code executes — so next/cache, next/navigation, and auth-actions are already mocked.
vi.mock('@/lib/prisma');
vi.mock('./auth-actions', () => ({ getCurrentUser: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth-actions';
import {
  getWines,
  deleteWine,
  addSharedWine,
  generateShareToken,
  followUser,
  unfollowUser,
  addToWishlist,
} from './actions';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const getCurrentUserMock = getCurrentUser as ReturnType<typeof vi.fn>;

// Shared fixtures
const mockUser = { id: 1, username: 'alice', createdAt: new Date() };
const mockWine = {
  id: 1,
  name: 'Merlot',
  description: 'Full bodied',
  rating: 4,
  notes: null,
  imagePath: '/uploads/test.jpg',
  userId: 1,
  shareToken: null,
  sharedByUsername: null,
  createdAt: new Date(),
};

beforeEach(() => {
  mockReset(prismaMock);
  vi.resetAllMocks();
  getCurrentUserMock.mockResolvedValue(null); // default: not authenticated
});

// ---------------------------------------------------------------------------
// getWines
// ---------------------------------------------------------------------------

describe('getWines', () => {
  it('returns empty array when not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    expect(await getWines()).toEqual([]);
  });

  it('returns wines for the authenticated user', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findMany.mockResolvedValue([mockWine]);

    const result = await getWines();

    expect(result).toEqual([mockWine]);
    expect(prismaMock.wine.findMany).toHaveBeenCalledWith({
      where: { userId: mockUser.id },
      orderBy: { createdAt: 'desc' },
    });
  });
});

// ---------------------------------------------------------------------------
// deleteWine
// ---------------------------------------------------------------------------

describe('deleteWine', () => {
  it('throws Unauthorized when not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    await expect(deleteWine(1)).rejects.toThrow('Unauthorized');
  });

  it('throws Not found when the wine does not exist', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue(null);
    await expect(deleteWine(99)).rejects.toThrow('Not found');
  });

  it('throws Not found when the wine belongs to another user', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue({ ...mockWine, userId: 999 });
    await expect(deleteWine(1)).rejects.toThrow('Not found');
  });

  it('deletes the wine when the user owns it', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue(mockWine);
    prismaMock.wine.count.mockResolvedValue(0);
    prismaMock.wine.delete.mockResolvedValue(mockWine);

    await deleteWine(1);

    expect(prismaMock.wine.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});

// ---------------------------------------------------------------------------
// generateShareToken
// ---------------------------------------------------------------------------

describe('generateShareToken', () => {
  it('throws Unauthorized when not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    await expect(generateShareToken(1)).rejects.toThrow('Unauthorized');
  });

  it('returns the existing token without creating a new one', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue({ ...mockWine, shareToken: 'existing-uuid' });

    const token = await generateShareToken(1);

    expect(token).toBe('existing-uuid');
    expect(prismaMock.wine.update).not.toHaveBeenCalled();
  });

  it('generates and returns a UUID token when none exists', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue({ ...mockWine, shareToken: null });
    // The return value of wine.update is not used by the action — it returns
    // the locally-generated UUID. Mock it to avoid an "unresolved promise" warning.
    prismaMock.wine.update.mockResolvedValue({ ...mockWine, shareToken: 'ignored' });

    const token = await generateShareToken(1);

    // The token comes from randomUUID() — verify it looks like a UUID
    expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(prismaMock.wine.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { shareToken: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/) },
    });
  });
});

// ---------------------------------------------------------------------------
// addSharedWine
// ---------------------------------------------------------------------------

describe('addSharedWine', () => {
  it('throws Unauthorized when not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    await expect(addSharedWine('token')).rejects.toThrow('Unauthorized');
  });

  it('throws Wine not found when the token does not match any wine', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue(null);
    await expect(addSharedWine('bad-token')).rejects.toThrow('Wine not found');
  });

  it('throws Already in your collection when the wine is yours', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue({
      ...mockWine,
      userId: mockUser.id,
      shareToken: 'token',
      user: { id: mockUser.id, username: 'alice', createdAt: new Date() },
    });
    await expect(addSharedWine('token')).rejects.toThrow('Already in your collection');
  });

  it('copies the wine into the current user collection', async () => {
    const otherUser = { id: 2, username: 'bob', createdAt: new Date() };
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue({
      ...mockWine,
      id: 5,
      name: 'Pinot',
      userId: otherUser.id,
      shareToken: 'token',
      user: otherUser,
    });
    prismaMock.wine.create.mockResolvedValue({ ...mockWine, id: 6 });

    await addSharedWine('token');

    expect(prismaMock.wine.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Pinot',
        userId: mockUser.id,
        sharedByUsername: 'bob',
      }),
    });
  });
});

// ---------------------------------------------------------------------------
// followUser / unfollowUser
// ---------------------------------------------------------------------------

describe('followUser', () => {
  it('throws Unauthorized when not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    await expect(followUser(2)).rejects.toThrow('Unauthorized');
  });

  it('throws Cannot follow yourself', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    await expect(followUser(mockUser.id)).rejects.toThrow('Cannot follow yourself');
  });

  it('creates a Follow record', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.follow.create.mockResolvedValue({
      id: 1,
      followerId: mockUser.id,
      followingId: 2,
      createdAt: new Date(),
    });

    await followUser(2);

    expect(prismaMock.follow.create).toHaveBeenCalledWith({
      data: { followerId: mockUser.id, followingId: 2 },
    });
  });
});

describe('unfollowUser', () => {
  it('throws Unauthorized when not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    await expect(unfollowUser(2)).rejects.toThrow('Unauthorized');
  });

  it('deletes the Follow record', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.follow.deleteMany.mockResolvedValue({ count: 1 });

    await unfollowUser(2);

    expect(prismaMock.follow.deleteMany).toHaveBeenCalledWith({
      where: { followerId: mockUser.id, followingId: 2 },
    });
  });
});

// ---------------------------------------------------------------------------
// addToWishlist
// ---------------------------------------------------------------------------

describe('addToWishlist', () => {
  const otherUserWine = { ...mockWine, id: 10, userId: 2 };
  const owner = { id: 2, username: 'bob', createdAt: new Date() };

  it('throws Unauthorized when not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    await expect(addToWishlist(10)).rejects.toThrow('Unauthorized');
  });

  it('throws Wine not found when the wine does not exist', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue(null);
    await expect(addToWishlist(999)).rejects.toThrow('Wine not found');
  });

  it('creates a WishlistItem', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue(otherUserWine);
    prismaMock.user.findUnique.mockResolvedValue(owner);
    prismaMock.wishlistItem.create.mockResolvedValue({
      id: 1,
      userId: mockUser.id,
      name: otherUserWine.name,
      description: otherUserWine.description,
      imagePath: otherUserWine.imagePath,
      addedByUsername: owner.username,
      createdAt: new Date(),
    });

    await addToWishlist(10);

    expect(prismaMock.wishlistItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: mockUser.id,
        name: otherUserWine.name,
        addedByUsername: owner.username,
      }),
    });
  });

  it('silently ignores a P2002 duplicate constraint error', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue(otherUserWine);
    prismaMock.user.findUnique.mockResolvedValue(owner);
    prismaMock.wishlistItem.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
        meta: {},
      })
    );

    // Should resolve without throwing — duplicate is a no-op
    await expect(addToWishlist(10)).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests and verify**

```bash
npm test app/actions.test.ts
```

Expected:
```
 ✓ app/actions.test.ts (22)
   ✓ getWines (2)
   ✓ deleteWine (4)
   ✓ generateShareToken (3)
   ✓ addSharedWine (4)
   ✓ followUser (3)
   ✓ unfollowUser (2)
   ✓ addToWishlist (4)

 Test Files  1 passed (1)
 Tests       22 passed (22)
```

- [ ] **Step 3: Run the full test suite**

```bash
npm test
```

Expected:
```
 ✓ lib/utils.test.ts (9)
 ✓ lib/i18n/index.test.ts (13)
 ✓ app/actions.test.ts (22)

 Test Files  3 passed (3)
 Tests       44 passed (44)
```

- [ ] **Step 4: Commit**

```bash
git add app/actions.test.ts
git commit -m "test: add unit tests for server actions"
```

---

### Task 7: Create GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflows directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create .github/workflows/ci.yml**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest

    env:
      DATABASE_URL: file:./dev.db

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Lint
        run: npm run lint

      - name: Type-check
        run: npx tsc --noEmit

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
```

`DATABASE_URL` is set as a job-level env var. No real database is needed — Prisma calls are mocked in tests, and `prisma generate` + `next build` only need the env var to be present (not an actual DB file).

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow (lint, type-check, test, build)"
git push
```

- [ ] **Step 4: Verify CI passes on GitHub**

Open the repository → Actions tab → confirm the `CI` workflow runs and all steps pass green.
