# Public Profiles & Follow System — Design Spec (Phase 1)

**Date:** 2026-03-24
**Status:** Approved
**Phase:** 1 of 2 (Phase 2 = Wishlist)

## Overview

Add public user profiles and a unidirectional follow system to VinoVault. Any user's wine collection is publicly browsable via `/u/[username]` — no login required. Logged-in users can follow others; followed users' wines appear in a new "Following" feed tab on the dashboard. Phase 2 (Wishlist) builds on top of this.

## Data Architecture

One new Prisma model added to `prisma/schema.prisma`:

```prisma
model Follow {
  id          Int      @id @default(autoincrement())
  followerId  Int
  followingId Int
  follower    User     @relation("UserFollowers", fields: [followerId], references: [id])
  following   User     @relation("UserFollowing", fields: [followingId], references: [id])
  createdAt   DateTime @default(now())

  @@unique([followerId, followingId])
}
```

`User` gains two new relation fields:
```prisma
following  Follow[] @relation("UserFollowers")
followers  Follow[] @relation("UserFollowing")
```

No other schema changes in Phase 1.

## Server Actions

Five new functions added to `app/actions.ts`:

| Function | Auth required | Description |
|----------|--------------|-------------|
| `getUserProfile(username: string)` | No | Fetches `User` + their `Wine[]`. Returns `null` if username not found. |
| `getIsFollowing(userId: number)` | No (returns `false` if not logged in) | Returns `true` if the current user follows the given userId. |
| `followUser(userId: number)` | Yes | Creates a `Follow` record. Guards: must be logged in, cannot follow yourself, duplicate follow is a no-op (catch unique constraint). Calls `revalidatePath("/")`. The `FollowButton` client component handles optimistic UI locally, so no revalidation of `/u/[username]` is needed. |
| `unfollowUser(userId: number)` | Yes | Deletes the `Follow` record. No-op if not following. Calls `revalidatePath("/")`. |
| `getFollowingFeed()` | Yes (returns `[]` if not logged in) | Returns wines from all users the current user follows, ordered by `createdAt desc`. Each wine includes the owner's `username` via a Prisma `include`. |

## Public Profile Page

**Route:** `app/u/[username]/page.tsx` (server component)

- Calls `getUserProfile(username)`. Returns Next.js `notFound()` if `null`.
- Calls `getCurrentUser()` and `getIsFollowing(profile.id)` server-side to determine follow state.
- Passes the fetched data as props to a new `ProfileView` client component which handles all interactive state.

**`components/ProfileView.tsx`** (new client component, `"use client"`)

- Receives `profile: User & { wines: Wine[] }`, `currentUserId: number | null`, `initialIsFollowing: boolean` as props.
- Manages `selectedWine: Wine | null` state for the modal.
- Renders `WineModal` with `readonly={true}` and without `onDelete` when a wine is selected.
- `readonly={true}` always applies on the profile page regardless of whether the viewer is the profile owner. The profile page is a read-only view for everyone.
- Renders:
  - Username heading + wine count (see i18n: `profile.wineCount`)
  - `FollowButton` — only rendered if `currentUserId` is non-null AND is not the profile owner's id
  - Read-only wine grid using existing `WineGrid` + `WineCard` with `readonly={true}`

## `readonly` Prop on WineCard / WineModal

`WineCard` and `WineModal` receive a new optional `readonly?: boolean` prop (default `false`). `WineGrid` threads it through to `WineCard`.

When `readonly={true}`:
- Delete button hidden in `WineModal`
- Share button hidden in `WineModal`
- The entire footer `div` (the container holding Delete and Share) is hidden — not just the buttons — so no empty container renders
- `onDelete` is not passed to `WineModal` (left `undefined`) in all readonly contexts
- WineCard still opens the modal on click (for viewing details)

## Dashboard Tabs

`Dashboard.tsx` gains a tab bar with three tabs: **Collection**, **Following**, **Wishlist**.

- **Collection** tab: existing wine grid (unchanged behaviour)
- **Following** tab: renders the `FollowingFeed` component, receiving `feedWines` as a prop fetched by the root server component (`app/page.tsx`) via `getFollowingFeed()`
- **Wishlist** tab: visible but disabled with a "Coming soon" placeholder until Phase 2

Tab state is managed with `React.useState` in `Dashboard.tsx` (already `"use client"`).

## FollowingFeed Component

New client component: `components/FollowingFeed.tsx`

- Receives `wines` as a prop (fetched server-side by `app/page.tsx` via `getFollowingFeed()` and passed down through `Dashboard`). Does not call server actions directly.
- Renders wines in the same card style as the collection grid with `readonly={true}`, each with a byline showing the poster's username as a link to `/u/[username]` using the `feed.by` i18n key.
- Empty state when `wines.length === 0`: shows `feed.empty` string plus a brief note suggesting users can be found by visiting `/u/[username]` URLs shared by others.

## FollowButton Component

New client component: `components/FollowButton.tsx`

- Props: `userId: number`, `initialIsFollowing: boolean`
- Local `isFollowing` state initialised from `initialIsFollowing`
- Optimistic toggle: flips local state immediately on click, then calls `followUser` or `unfollowUser`
- Button is disabled while the server action is in-flight (prevents double-tap / duplicate follow attempts)
- On error: reverts local state to previous value
- Renders as a single button: violet filled for "Follow", ghost for "Unfollow"

## Internationalisation

All new strings added to both `lib/i18n/en.ts` and `lib/i18n/fr.ts` (enforced by `satisfies typeof en`).

String interpolation uses the same `str.replace("{placeholder}", value)` pattern already used in the codebase.

`profile.wineCount` always uses the plural form (e.g. "1 wines") for simplicity in Phase 1 — singular/plural handling is out of scope.

| Key | English | French |
|-----|---------|--------|
| `profile.follow` | "Follow" | "Suivre" |
| `profile.unfollow` | "Unfollow" | "Ne plus suivre" |
| `profile.wineCount` | "{count} wines" | "{count} vins" |
| `dashboard.tabCollection` | "Collection" | "Collection" |
| `dashboard.tabFollowing` | "Following" | "Abonnements" |
| `dashboard.tabWishlist` | "Wishlist" | "Liste de souhaits" |
| `feed.empty` | "Follow some users to see their wines here." | "Suivez des utilisateurs pour voir leurs vins ici." |
| `feed.by` | "by {username}" | "par {username}" |

## Files Changed

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `Follow` model and relations on `User` |
| `app/actions.ts` | Add 5 new server actions |
| `app/page.tsx` | Call `getFollowingFeed()` and pass result to `Dashboard` |
| `app/u/[username]/page.tsx` | New public profile page (server component — fetches data, renders `ProfileView`) |
| `components/ProfileView.tsx` | New client component — interactive profile shell (modal state, follow button, wine grid) |
| `components/FollowButton.tsx` | New client component |
| `components/FollowingFeed.tsx` | New client component |
| `components/Dashboard.tsx` | Add tab bar; accept and pass `feedWines` prop |
| `components/WineGrid.tsx` | Thread `readonly` prop through to `WineCard` |
| `components/WineCard.tsx` | Accept and pass `readonly` prop to `WineModal` |
| `components/WineModal.tsx` | Hide delete/share when `readonly={true}`; `onDelete` omitted in readonly contexts |
| `lib/i18n/en.ts` | Add 8 new translation keys |
| `lib/i18n/fr.ts` | Add 8 new translation keys |

## Out of Scope (Phase 1)

- Wishlist (Phase 2)
- Notifications
- Blocking users
- Private accounts / privacy toggle
- Follower/following counts on profile
- Pagination of feed or profile wines
- Singular/plural wine count on profile
