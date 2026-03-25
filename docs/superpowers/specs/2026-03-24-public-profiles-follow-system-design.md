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

`User` gains two relation fields:
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
| `followUser(userId: number)` | Yes | Creates a `Follow` record. Guards: must be logged in, cannot follow yourself, duplicate follow is a no-op. Calls `revalidatePath("/")`. |
| `unfollowUser(userId: number)` | Yes | Deletes the `Follow` record. No-op if not following. Calls `revalidatePath("/")`. |
| `getFollowingFeed()` | Yes (returns `[]` if not logged in) | Returns wines from all users the current user follows, ordered by `createdAt desc`. Each wine includes the owner's `username` via a Prisma `include`. |

## Public Profile Page

**Route:** `app/u/[username]/page.tsx` (new server component)

- Calls `getUserProfile(username)`. Returns Next.js `notFound()` if `null`.
- Calls `getCurrentUser()` and `getIsFollowing(profile.id)` server-side to determine follow state.
- Renders:
  - Username heading + wine count
  - Follow/Unfollow button — only shown if viewer is logged in AND is not the profile owner. Uses a client component (`FollowButton`) to handle the follow/unfollow action with optimistic UI.
  - Read-only wine grid using existing `WineGrid` + `WineCard` with `readonly={true}`

## `readonly` Prop on WineCard / WineModal

`WineCard` and `WineModal` receive a new optional `readonly?: boolean` prop (default `false`).

When `readonly={true}`:
- Delete button hidden in `WineModal`
- Share button hidden in `WineModal`
- WineCard still opens the modal on click (for viewing details)

This prop is passed through `WineGrid` → `WineCard` → `WineModal`.

## Dashboard Tabs

`Dashboard.tsx` gains a tab bar with three tabs: **Collection**, **Following**, **Wishlist**.

- **Collection** tab: existing wine grid (unchanged behaviour)
- **Following** tab: renders the `FollowingFeed` component
- **Wishlist** tab: visible but disabled/empty with a "Coming soon" placeholder until Phase 2

Tab state is managed with `React.useState` in `Dashboard.tsx` (client component, already `"use client"`).

## FollowingFeed Component

New client component: `components/FollowingFeed.tsx`

- Fetches feed via `getFollowingFeed()` (called from the parent server component and passed as a prop, or fetched directly)
- Renders wines in the same card style as the collection grid, each with a byline showing the poster's username as a link to `/u/[username]`
- `readonly={true}` on all cards (no delete/share)
- Empty state: "Follow some users to see their wines here." / "Suivez des utilisateurs pour voir leurs vins ici."

## FollowButton Component

New client component: `components/FollowButton.tsx`

- Props: `userId: number`, `initialIsFollowing: boolean`
- Optimistic toggle: flips displayed state immediately on click, then calls `followUser` or `unfollowUser`
- On error: reverts to previous state
- Renders as a single button styled to match the app (violet for Follow, ghost for Unfollow)

## Internationalisation

All new strings added to both `lib/i18n/en.ts` and `lib/i18n/fr.ts`:

| Key | English | French |
|-----|---------|--------|
| `profile.follow` | "Follow" | "Suivre" |
| `profile.unfollow` | "Unfollow" | "Ne plus suivre" |
| `profile.wines` | "{count} wines" | "{count} vins" |
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
| `app/u/[username]/page.tsx` | New public profile page |
| `components/FollowButton.tsx` | New client component |
| `components/FollowingFeed.tsx` | New client component |
| `components/Dashboard.tsx` | Add tab bar (Collection / Following / Wishlist) |
| `components/WineGrid.tsx` | Thread `readonly` prop through to `WineCard` |
| `components/WineCard.tsx` | Accept and pass `readonly` prop to `WineModal` |
| `components/WineModal.tsx` | Hide delete/share when `readonly={true}` |
| `lib/i18n/en.ts` | Add 8 new translation keys |
| `lib/i18n/fr.ts` | Add 8 new translation keys |

## Out of Scope (Phase 1)

- Wishlist (Phase 2)
- Notifications
- Blocking users
- Private accounts / privacy toggle
- Follower/following counts on profile
- Pagination of feed or profile wines
