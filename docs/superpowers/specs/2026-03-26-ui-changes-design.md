---
title: UI Changes — March 2026
date: 2026-03-26
status: approved
---

# UI Changes — March 2026

Five focused UI improvements across the FollowingFeed, WishlistGrid, ProfileView, background styling, and wine grid date grouping.

---

## 1. "Add to Wishlist" Pill on Image

**File:** `components/FollowingFeed.tsx`

**Change:** Move the wishlist bookmark button from below the `WineCard` to an always-visible pill overlaid at the bottom-center of the card image.

**Implementation:**
- Wrap the `<WineCard>` in a `relative` container div
- Add an absolutely-positioned pill at `bottom-2 left-1/2 -translate-x-1/2`
- Pill styles: `px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs flex items-center gap-1.5 whitespace-nowrap`
- Contents: `<Bookmark>` icon (h-3.5 w-3.5) + "Wishlist" label
- When wishlisted: icon fills (`fill-current`), pill background shifts to `bg-violet-600/60`
- Remove the existing below-card wishlist button row; keep only the `by {username}` attribution line below the card

---

## 2. Wishlist Card — Clickable + "Move to Collection" Pill

**Files:** `components/WishlistGrid.tsx`, `components/WishlistModal.tsx` (new)

### 2a. New `WishlistModal` component
A lightweight read-only modal for wishlist items. `WishlistItem` has no `rating`, so a dedicated modal is cleaner than forcing `WineModal` to accept optional fields.

**Structure:**
- Same backdrop + centered panel pattern as `WineModal`
- Shows: full-bleed image, wine name (large bold), description (muted text), close button
- No editing, no navigation arrows
- Triggered by clicking the card image area

### 2b. Card layout changes in `WishlistGrid`
- Make the image/card area clickable (`cursor-pointer`, `onClick={() => setSelectedItem(item)}`)
- Remove the description text (`item.description`) shown below the card
- Replace the current "Move to Collection" ghost text button with a pill:
  - Style: `rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5 bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 hover:bg-violet-100`
  - Contents: `<Plus>` icon (h-3.5 w-3.5) on the left + "Move to Collection" label
- Keep the red trash `Bookmark` remove button (icon-only, rounded-full)

---

## 3. Profile Page — Username/Wine Count Below Header

**File:** `components/ProfileView.tsx`

### 3a. Sticky header (minimal)
Keep only: VinoVault back link (left), copy-link icon button + follow button (right). Remove username and wine count from the header entirely.

### 3b. Profile identity block (below header, in `<main>`)
Add a centered identity section at the top of `<main>`, before `<WineGrid>`:

```
[username — text-3xl font-bold, centered]
[wine count — text-sm text-zinc-500, centered]
[Follow button — centered, rounded-full pill, mt-2]  ← only if showFollowButton
```

- Container: `text-center py-6 px-4`
- Follow button: ensure `rounded-full` pill shape (update `FollowButton` or override className)

---

## 4. Background Gradient Fix

**File:** `app/globals.css`

Add `background-attachment: fixed` to both the light-mode and dark-mode `html` gradient rules. This pins the gradient to the viewport so it does not terminate when page content exceeds viewport height, preventing the white browser background from showing through at the bottom on scroll.

```css
html {
  min-height: 100%;
  background: linear-gradient(135deg, #f5e6e8 0%, #ede0f0 50%, #dde0f5 100%);
  background-attachment: fixed;
}

/* dark mode */
html {
  background: linear-gradient(135deg, #1a0a0f 0%, #2d0a1e 40%, #1e0d3a 100%);
  background-attachment: fixed;
}
```

---

## 5. Date Section Headers — Collection, Following, Profile

**Files:** `lib/utils.ts`, `components/WineGrid.tsx`, `components/FollowingFeed.tsx`

### 5a. Utility: `groupWinesByMonth`
Add to `lib/utils.ts`:

```ts
export function groupWinesByMonth<T extends { createdAt: Date | string }>(
  wines: T[]
): { label: string; wines: T[] }[]
```

- Groups wines into buckets by `MMMM YYYY` label (e.g. "March 2026")
- Sorts buckets newest-first (most recent month at top)
- Wines within each bucket retain their existing order

### 5b. `WineGrid` — grouped rendering
- Replace the flat `wines.map(...)` with a loop over `groupWinesByMonth(wines)`
- Each group renders: a section header `<h2>` followed by a sub-grid
- Section header style: `text-2xl font-bold text-zinc-400 dark:text-zinc-500 px-4 pt-6 pb-2`
- Sub-grid uses the same `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4` layout

### 5c. `FollowingFeed` — grouped rendering
- Same grouping pattern applied to the `wines` array
- Each group renders a section header then its wine cards (with the wishlist pill overlay per change #1)

### 5d. Profile page
- Uses `WineGrid` — inherits date grouping automatically. No extra changes needed.

---

## Files Changed Summary

| File | Change |
|------|--------|
| `components/FollowingFeed.tsx` | Wishlist pill on image; date section headers |
| `components/WishlistGrid.tsx` | Clickable card; pill button; remove description |
| `components/WishlistModal.tsx` | New — lightweight read-only wishlist item modal |
| `components/ProfileView.tsx` | Username/count below header; follow button pill |
| `components/WineGrid.tsx` | Date section headers |
| `app/globals.css` | `background-attachment: fixed` |
| `lib/utils.ts` | `groupWinesByMonth` utility |
