# Followers, Profile Sharing & Wishlist — Design Spec

**Date:** 2026-03-25
**Project:** VinoVault

---

## Overview

Three interconnected features:
1. Follow button on user profiles (already partially built — verify & surface)
2. Share your profile via a copyable link
3. View a merged feed of followed users' wines with the ability to wishlist items; manage wishlist with a "Move to Collection" flow

---

## 1. Current State

The following already exists and is wired up:
- `Follow` Prisma model with `followerId` / `followingId` and a unique constraint
- `followUser`, `unfollowUser`, `getIsFollowing`, `getUserProfile`, `getFollowingFeed` server actions
- `/u/[username]` route rendering `ProfileView` with `FollowButton`
- Dashboard "Following" tab rendering `FollowingFeed` (merged wines from all followed users)
- i18n keys: `profile.follow`, `profile.unfollow`, `feed.empty`, `feed.by`

**Gap:** No navigation links to profiles from the dashboard, no wishlist model/UI, no share affordance.

---

## 2. Data Layer

### Setup step

After updating the schema, run:
```bash
npx prisma migrate dev --name add-wishlist
npx prisma generate
```

### Updated `User` model

Add the back-reference relation to the existing `User` model block:
```prisma
model User {
  // existing fields unchanged...
  wishlist   WishlistItem[]
}
```

### New Prisma model: `WishlistItem`

```prisma
model WishlistItem {
  id              Int      @id @default(autoincrement())
  userId          Int
  user            User     @relation(fields: [userId], references: [id])
  name            String
  description     String
  imagePath       String?  // nullable — snapshot of original wine's path, may become stale if original is deleted
  addedByUsername String
  createdAt       DateTime @default(now())

  @@unique([userId, name, addedByUsername])
}
```

- No `rating` field — wishlist items are unrated by design
- `addedByUsername` is a snapshot string (denormalized) so attribution survives if the original wine is deleted
- `imagePath` is nullable because the original file may be deleted; `WishlistGrid` must handle a null/missing image gracefully (show a placeholder)
- Unique constraint on `[userId, name, addedByUsername]` prevents duplicate adds (more robust than using `imagePath` since path can be null)

### New Server Actions (`app/actions.ts`)

All mutating actions must call `revalidatePath("/")` on success.

| Action | Signature | Description |
|---|---|---|
| `addToWishlist` | `(wineId: number, addedByUsername: string)` | Creates a `WishlistItem` snapshot from the wine. Accepts `addedByUsername` as a second argument to avoid a redundant DB join (callers already have this from `getFollowingFeed`'s `wine.user.username`). No-ops silently on unique constraint violation. Calls `revalidatePath("/")` on success. |
| `removeFromWishlist` | `(itemId: number)` | Deletes the `WishlistItem` if it belongs to the current user. **Does not delete any image file** — the `imagePath` is a snapshot pointing to the original wine's file, which the original owner still owns. Calls `revalidatePath("/")`. |
| `getWishlist` | `() => WishlistItem[]` | Returns all `WishlistItem` rows for the current user, ordered by `createdAt desc`. |
| `moveToCollection` | `(itemId: number, formData: FormData)` | Validates all required fields (name, description, imagePath/file, rating) before proceeding. Writes the uploaded image file to `public/uploads/` first (outside the transaction — same pattern as `addWine`). Then runs a Prisma transaction to create a `Wine` and delete the `WishlistItem`. If the transaction fails after the file is written, the file becomes an orphan (acceptable edge case — same behavior as `addWine`). Calls `revalidatePath("/")` after success. |

---

## 3. Following Feed (`FollowingFeed`)

- Each wine card gets a **bookmark icon button** ("Add to Wishlist")
- `FollowingFeed` receives a `wishlistedKeys: Set<string>` prop. Each key is `${name}::${addedByUsername}` — matching the unique constraint used on the model. This allows the button to show the correct initial state without a round-trip.
- **The `Set<string>` is constructed in `Dashboard`** from the `wishlistItems` array: `new Set(wishlistItems.map(i => \`${i.name}::${i.addedByUsername}\`))`, then passed as `wishlistedKeys` to `<FollowingFeed>`.
- Tapping the button calls `addToWishlist(wine.id, wine.user.username)` with optimistic UI: button immediately flips to "Wishlisted" (filled bookmark)
- If already wishlisted, button appears active/filled on initial render

---

## 4. Wishlist Tab

### `WishlistGrid` component

- Mirrors the card pattern of `WineGrid` / `WineCard`
- Each card shows: wine image (or a placeholder if `imagePath` is null/missing), name, description (no stars), `addedByUsername` attribution line
- Two actions per card:
  - **Remove** (trash icon) — calls `removeFromWishlist(item.id)`
  - **Move to Collection** — opens `WineForm` modal

### "Move to Collection" flow

1. User clicks "Move to Collection" on a wishlist card
2. `WineForm` opens with the following new props:
   - `initialValues?: { name: string; description: string }` — pre-populates form fields
   - `skipAnalysis?: boolean` — when `true`, skips the `analyzeWineImage` call
   - `onSubmit?: (formData: FormData) => Promise<void>` — overrides the default `addWine` submit path; if provided, the form calls this instead of `addWine`. The caller (`WishlistGrid`) closes over `itemId` to pass it to `moveToCollection`.
3. **`WineForm` state machine changes** when `initialValues` is provided:
   - `phase` initializes to `"review"` instead of `"capture"`
   - `name` and `description` state initialize from `initialValues`
   - The image capture area's `onClick` handler must allow file selection even in `"review"` phase when no image has been taken yet (i.e., remove the `phase === "capture"` guard on the click handler, or use `!imagePreview` as the condition instead)
   - The height animation should treat `!imagePreview` as the "capture" height, not the `phase` value, so the upload area renders at full size until an image is chosen
4. When `skipAnalysis={true}`, the `handleImageChange` handler skips the `analyzeWineImage` call entirely — it only sets the image preview state
5. User takes/uploads a new photo and selects a rating (both required for submission)
6. On submit, the form calls the provided `onSubmit` prop (which invokes `moveToCollection(itemId, formData)`)
7. On success: a new `Wine` is created in the user's collection; the `WishlistItem` is deleted; dashboard re-renders via `revalidatePath`

### Dashboard wiring

- `app/page.tsx` adds `getWishlist()` to `Promise.all`
- `Dashboard` receives `wishlistItems: WishlistItem[]` prop
- `Dashboard` computes `wishlistedKeys` from `wishlistItems` and passes it to `<FollowingFeed>`
- Wishlist tab (currently `null`) renders `<WishlistGrid items={wishlistItems} />`

---

## 5. Profile Share Link

Two locations:

### Dashboard header
- Small share/link icon button next to the logout button
- Uses i18n key `dashboard.shareTitle` for the button's `title` / aria-label (consistent with `dashboard.searchTitle`, `dashboard.logoutTitle` pattern)
- On click: copies `window.location.origin + /u/${user.username}` to clipboard
- Shows "Copied!" text for 2 seconds then reverts — implemented as local `useState<boolean>` + `setTimeout(fn, 2000)` inside the button component

### ProfileView (own profile only)
- When `currentUserId === profile.id`, a copy-link button appears next to the username
- Same clipboard + 2-second "Copied!" tooltip behavior (local `useState` + `setTimeout`)
- Uses i18n key `profile.copyLink`

---

## 6. i18n Additions

Add to **both** `lib/i18n/en.ts` and `lib/i18n/fr.ts`. Note: `fr.ts` uses `satisfies typeof en`, so both files must be updated together or the build will fail.

New namespace — `en.ts`:
```ts
wishlist: {
  addToWishlist: "Add to Wishlist",
  wishlisted: "Wishlisted",
  removeFromWishlist: "Remove",
  moveToCollection: "Move to Collection",
  empty: "Your wishlist is empty. Browse the Following tab to save wines.",
  by: "by {username}",
},
```

New namespace — `fr.ts`:
```ts
wishlist: {
  addToWishlist: "Ajouter à la liste de souhaits",
  wishlisted: "Ajouté",
  removeFromWishlist: "Supprimer",
  moveToCollection: "Ajouter à la collection",
  empty: "Votre liste de souhaits est vide. Parcourez l'onglet Abonnements pour sauvegarder des vins.",
  by: "par {username}",
},
```

Additions to existing namespaces (both `en.ts` and `fr.ts`):
```ts
// en.ts
profile: {
  // existing: follow, unfollow, wineCount
  copyLink: "Copy Profile Link",
},
dashboard: {
  // existing: welcome, sort*, searchPlaceholder, searchTitle, logoutTitle, addWineTitle, tab*
  shareTitle: "Share Profile",
},

// fr.ts
profile: {
  copyLink: "Copier le lien du profil",
},
dashboard: {
  shareTitle: "Partager le profil",
},
```

---

## 7. Component Inventory

| Component | Status | Changes |
|---|---|---|
| `FollowButton` | Exists | None |
| `ProfileView` | Exists | Add copy-link button when viewing own profile (`currentUserId === profile.id`) |
| `FollowingFeed` | Exists | Add bookmark button per card; accept `wishlistedKeys: Set<string>` prop |
| `WineForm` | Exists | Add `initialValues?`, `skipAnalysis?`, `onSubmit?` props; when `initialValues` provided: initialize `phase` to `"review"`, pre-populate `name`/`description`, fix `onClick` guard to use `!imagePreview` instead of `phase === "capture"`, use `!imagePreview` for height animation; when `skipAnalysis` true: skip `analyzeWineImage` in `handleImageChange` |
| `WishlistGrid` | New | Card grid for wishlist items; handles null `imagePath` with placeholder; closes over `itemId` when invoking `moveToCollection` via `WineForm`'s `onSubmit` prop |
| `Dashboard` | Exists | Receive `wishlistItems` prop; compute `wishlistedKeys` Set; pass to `FollowingFeed`; render `WishlistGrid` in wishlist tab; add share icon button to header |

---

## 8. Out of Scope

- Notifications when someone follows you
- Public/private profile settings
- Pagination on the following feed or wishlist
- Wishlist item comments or notes
- Image re-hosting at wishlist-add time (wishlist items reference the original owner's image path; in a multi-server production deployment this would require copying the file — deferred)
