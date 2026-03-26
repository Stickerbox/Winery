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

### New Prisma Model: `WishlistItem`

```prisma
model WishlistItem {
  id              Int      @id @default(autoincrement())
  userId          Int
  user            User     @relation(fields: [userId], references: [id])
  name            String
  description     String
  imagePath       String
  addedByUsername String
  createdAt       DateTime @default(now())

  @@unique([userId, name, imagePath])
}
```

- No `rating` field — wishlist items are unrated by design
- `addedByUsername` is a snapshot string (denormalized) so attribution survives if the original wine is deleted
- Unique constraint on `[userId, name, imagePath]` prevents duplicate adds
- `User` model gets a `wishlist WishlistItem[]` relation

### New Server Actions (`app/actions.ts`)

| Action | Description |
|---|---|
| `addToWishlist(wineId)` | Fetches the wine, snapshots name/description/imagePath/addedByUsername into a `WishlistItem` for the current user. No-op if already wishlisted (unique constraint). |
| `removeFromWishlist(itemId)` | Deletes `WishlistItem` if it belongs to the current user. |
| `getWishlist()` | Returns all `WishlistItem` rows for the current user, ordered by `createdAt desc`. |
| `moveToCollection(itemId, formData)` | Creates a `Wine` from formData (name, description, new photo, rating), then deletes the `WishlistItem`. Runs in a transaction. |

---

## 3. Following Feed (`FollowingFeed`)

- Each wine card gets a **bookmark icon button** ("Add to Wishlist")
- `FollowingFeed` receives a `wishlistedWineIds: Set<string>` prop (snapshot key: `name+imagePath`) so initial state renders correctly without a round-trip
- Tapping the button calls `addToWishlist(wine.id)` with optimistic UI: button immediately flips to "Wishlisted" (filled bookmark)
- If already wishlisted, button appears active/filled on initial render
- `page.tsx` adds `getWishlist()` to its `Promise.all` and passes the result down

---

## 4. Wishlist Tab

### `WishlistGrid` component

- Mirrors the card pattern of `WineGrid` / `WineCard`
- Each card shows: wine image, name, description (no stars), `addedByUsername` attribution line
- Two actions per card:
  - **Remove** (trash icon) — calls `removeFromWishlist(item.id)`
  - **Move to Collection** — opens `WineForm` modal

### "Move to Collection" flow

1. User clicks "Move to Collection" on a wishlist card
2. `WineForm` opens pre-filled with the wishlist item's `name` and `description` (both editable)
3. `WineForm` receives `skipAnalysis={true}` — uploading a photo does **not** call the Claude API
4. User takes/uploads a new photo and selects a rating (both required)
5. On submit, `moveToCollection(itemId, formData)` is called
6. On success: a new `Wine` is created in the user's collection; the `WishlistItem` is deleted

### Dashboard wiring

- `app/page.tsx` adds `getWishlist()` to `Promise.all`
- `Dashboard` receives `wishlistItems` prop
- Wishlist tab (currently `null`) renders `<WishlistGrid items={wishlistItems} />`

---

## 5. Profile Share Link

Two locations:

### Dashboard header
- Small share/link icon button next to the logout button
- On click: copies `window.location.origin + /u/${user.username}` to clipboard
- Shows a brief "Copied!" tooltip (reuses existing `common.copied` i18n key)

### ProfileView (own profile only)
- When `currentUserId === profile.id`, a copy-link button appears next to the username
- Same clipboard + tooltip behavior

---

## 6. i18n Additions (`lib/i18n/en.ts` and `fr.ts`)

```ts
wishlist: {
  addToWishlist: "Add to Wishlist",
  wishlisted: "Wishlisted",
  removeFromWishlist: "Remove",
  moveToCollection: "Move to Collection",
  empty: "Your wishlist is empty. Browse the Following tab to save wines.",
  by: "by {username}",
},
profile: {
  // existing keys preserved
  copyLink: "Copy Profile Link",
},
```

---

## 7. Component Inventory

| Component | Status | Changes |
|---|---|---|
| `FollowButton` | Exists | None |
| `ProfileView` | Exists | Add copy-link button when viewing own profile |
| `FollowingFeed` | Exists | Add bookmark button per card; accept `wishlistedIds` prop |
| `WineForm` | Exists | Add `skipAnalysis` prop + `initialValues` prop |
| `WishlistGrid` | New | Card grid for wishlist items |
| `Dashboard` | Exists | Wire wishlist tab; add share button to header |

---

## 8. Out of Scope

- Notifications when someone follows you
- Public/private profile settings
- Pagination on the following feed or wishlist
- Wishlist item comments or notes
