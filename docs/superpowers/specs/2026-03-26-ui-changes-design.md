---
title: UI Changes — March 2026
date: 2026-03-26
status: approved
---

# UI Changes — March 2026

Five focused UI improvements across the FollowingFeed, WishlistGrid, ProfileView, background styling, and wine grid date grouping.

---

## 1. "Add to Wishlist" Pill on WineModal Image

**Files:** `components/WineModal.tsx`, `components/FollowingFeed.tsx`, `components/ProfileView.tsx`, profile page server component

**Change:** When viewing another user's wine in the modal, show a pill at the bottom-center of the image panel to add/remove from wishlist. No changes to the card grid in FollowingFeed.

### WineModal prop additions
Add two optional props:
- `isWishlisted?: boolean`
- `onWishlistToggle?: () => void`

The pill renders only when **both** `readonly=true` and `onWishlistToggle` is provided.

**Pill position:** absolutely positioned within the image `<div>`, `bottom-4 left-1/2 -translate-x-1/2`

**Pill styles:**
- Not wishlisted: `px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm text-white text-sm flex items-center gap-1.5 whitespace-nowrap hover:bg-black/60 transition-colors`
- Contents: `<Plus>` icon (h-4 w-4) + `t.wishlist.addToWishlist`
- Wishlisted: background shifts to `bg-violet-600/70`, contents: `<Check>` icon + `t.wishlist.removeFromWishlist`

**Translation keys used:** `t.wishlist.addToWishlist`, `t.wishlist.removeFromWishlist` — both already exist. Update `removeFromWishlist` in both locale files from the terse "Remove" / "Supprimer" to a full label:
- `en`: `"Remove from Wishlist"`
- `fr`: `"Retirer de la liste de souhaits"`

### FollowingFeed wiring
`FollowingFeed` already manages `localWishlisted` state and `handleWishlist(wine)`. When opening the modal, pass:
- `isWishlisted={localWishlisted.has(key)}`
- `onWishlistToggle={() => handleWishlist(wine)}`

Keep the existing below-card attribution line (`by {username}`). Remove the below-card bookmark icon button since the action moves into the modal.

### ProfileView wiring
`ProfileView` currently receives no wishlist data. Changes needed:
- Profile page server component fetches `wishlistItems` for the current user (same query used in Dashboard) and passes them to `ProfileView`
- `ProfileView` accepts a new `wishlistItems: WishlistItem[]` prop (optional, empty array default)
- Computes `wishlistedKeys` set from that prop
- Passes `isWishlisted` and `onWishlistToggle` (calling `addToWishlist` / `removeFromWishlist`) to `WineModal`
- If `currentUserId === null` (logged-out visitor), omit both props so no pill appears

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
  wines: T[],
  locale: string
): { label: string; wines: T[] }[]
```

- Groups wines into buckets keyed by `YYYY-MM` for sorting, with a locale-aware display label generated via `new Date(...).toLocaleDateString(locale, { month: 'long', year: 'numeric' })` — e.g. "March 2026" in English, "mars 2026" in French
- Accepts a `locale` string (pass the `lang` value from `useTranslations()` — `"en"` or `"fr"`)
- Sorts buckets newest-first (most recent month at top)
- Wines within each bucket retain their existing order

### 5b. `WineGrid` — grouped rendering
- Accept `lang` via `useTranslations()`
- Replace the flat `wines.map(...)` with a loop over `groupWinesByMonth(wines, lang)`
- Each group renders: a section header `<h2>` followed by a sub-grid
- Section header style: `text-2xl font-bold text-zinc-400 dark:text-zinc-500 px-4 pt-6 pb-2`
- Sub-grid uses the same `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4` layout

### 5c. `FollowingFeed` — grouped rendering
- Same grouping pattern applied to the `wines` array, passing `lang` from `useTranslations()`
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
| `lib/i18n/en.ts` | Update `wishlist.removeFromWishlist` to full label |
| `lib/i18n/fr.ts` | Update `wishlist.removeFromWishlist` to full French label |
