# Shared By Tag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user adds a shared wine to their collection, carry the original sharer's username into the new record and display it as a pill tag in WineModal beneath the date.

**Architecture:** Two-file change. `addSharedWine` in `actions.ts` already fetches the wine but doesn't include the user relation or write `sharedByUsername` — add both. `WineModal` conditionally renders a styled pill below the date row using the existing `t.share.sharedBy` translation key.

**Tech Stack:** Next.js App Router, Prisma (SQLite), Tailwind CSS v4, Framer Motion, `@prisma/client` Wine type

---

## File Map

| File | Change |
|------|--------|
| `app/actions.ts` | Modify `addSharedWine`: include user relation, guard on null user, write `sharedByUsername` |
| `components/WineModal.tsx` | Add conditional pill tag below date row, above SAQ link |

---

### Task 1: Carry `sharedByUsername` through `addSharedWine`

**Files:**
- Modify: `app/actions.ts` — `addSharedWine` function (lines 126–146)

**Context:** `addSharedWine` finds a wine by share token and copies it to the current user's collection. It currently doesn't fetch the user relation, so `wine.user` is undefined. `Wine.sharedByUsername String?` already exists in the Prisma schema — no migration needed.

- [ ] **Step 1: Replace the `findUnique` call on line 130 to include the user relation**

In `app/actions.ts`, replace:
```ts
const wine = await prisma.wine.findUnique({ where: { shareToken: token } });
```
with:
```ts
const wine = await prisma.wine.findUnique({
    where: { shareToken: token },
    include: { user: true },
});
```

- [ ] **Step 2: Add a null guard for `wine.user` after the existing `if (!wine)` check**

After the line `if (!wine) throw new Error("Wine not found");`, add:
```ts
if (!wine.user) throw new Error("Sharer not found");
```

- [ ] **Step 3: Pass `sharedByUsername` when creating the new wine record**

In the same function, change the `prisma.wine.create` call from:
```ts
await prisma.wine.create({
    data: {
        name: wine.name,
        description: wine.description,
        rating: wine.rating,
        imagePath: wine.imagePath,
        userId: user.id,
    },
});
```
to:
```ts
await prisma.wine.create({
    data: {
        name: wine.name,
        description: wine.description,
        rating: wine.rating,
        imagePath: wine.imagePath,
        userId: user.id,
        sharedByUsername: wine.user.username,
    },
});
```

- [ ] **Step 4: Verify the app still builds**

```bash
npm run build
```
Expected: build succeeds with no type errors. Prisma's generated client already knows about `sharedByUsername` — no regeneration needed.

- [ ] **Step 5: Commit**

```bash
git add app/actions.ts
git commit -m "feat: carry sharedByUsername when adding a shared wine"
```

---

### Task 2: Display "Shared by X" pill in WineModal

**Files:**
- Modify: `components/WineModal.tsx` — info panel, lines 81–95

**Context:** The info panel's inner `<div>` (starting line 77) contains three siblings in order: the wine name heading (line 78), the date row `<div>` (lines 81–84), and the SAQ `<a>` link (lines 85–94). The pill must be inserted as a fourth sibling between the date row and the SAQ link — i.e., after line 84's closing `</div>` and before line 85's `<a href={saqUrl}>`. The `wine` prop is typed as `Wine` from `@prisma/client`, which includes `sharedByUsername: string | null`. The translation key `t.share.sharedBy` equals `"Shared by {username}"` (en) / `"Partagé par {username}"` (fr) and already exists in both locale files. `useTranslations()` is already called at the top of this component.

- [ ] **Step 1: Insert the pill between the date row and the SAQ link**

In `components/WineModal.tsx`, find this block (lines 81–94):
```tsx
<div className="flex items-center text-zinc-500 dark:text-zinc-400 text-sm">
    <Calendar className="h-4 w-4 mr-1" />
    {new Date(wine.createdAt).toLocaleDateString()}
</div>
<a
    href={saqUrl}
    ...
```

Insert the pill between the closing `</div>` of the date row and the opening `<a>` of the SAQ link:
```tsx
<div className="flex items-center text-zinc-500 dark:text-zinc-400 text-sm">
    <Calendar className="h-4 w-4 mr-1" />
    {new Date(wine.createdAt).toLocaleDateString()}
</div>
{wine.sharedByUsername && (
    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 ring-1 ring-violet-200 dark:ring-violet-700/50">
        {t.share.sharedBy.replace("{username}", wine.sharedByUsername)}
    </span>
)}
<a
    href={saqUrl}
    ...
```

- [ ] **Step 2: Verify the build**

```bash
npm run build
```
Expected: no type errors. `wine.sharedByUsername` is `string | null` — the `&&` guard makes it safe. TypeScript will narrow it to `string` inside the block.

- [ ] **Step 3: Manual smoke test**

1. Run `npm run dev`
2. Log in as User A, add a wine, open the wine, click Share, copy the share link
3. Log out, log in as User B, visit the share link, click "Add to my wines" — redirected to dashboard
4. Click the newly added wine card — the modal should show a violet rounded pill reading "Shared by [User A's username]" directly beneath the date
5. Open any wine User B added themselves — no pill appears

- [ ] **Step 4: Commit**

```bash
git add components/WineModal.tsx
git commit -m "feat: show shared-by pill in WineModal for shared wines"
```
