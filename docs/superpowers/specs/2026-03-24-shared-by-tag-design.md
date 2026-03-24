# Shared By Tag — Design Spec

**Date:** 2026-03-24

## Summary

When a user adds a wine from a share link, the originating sharer's username is carried over to the new wine record. The WineModal displays a "Shared by X" pill tag beneath the date when this field is present, and shows nothing when the user created the wine themselves.

## Data Layer

**File:** `app/actions.ts` — `addSharedWine`

- Add `include: { user: true }` to the `prisma.wine.findUnique` call
- Pass `sharedByUsername: wine.user.username` when calling `prisma.wine.create`
- No schema migration required — `Wine.sharedByUsername String?` already exists

## UI Layer

**File:** `components/WineModal.tsx`

- Below the existing date row (Calendar icon + date), render a pill tag when `wine.sharedByUsername` is non-null
- Tag style: `inline-flex`, `rounded-full`, `text-xs`, violet accent colors consistent with the app theme
- Text: reuses `t.share.sharedBy` (`"Shared by {username}"`) with `{username}` replaced at render time
- Hidden entirely (no empty space) when `sharedByUsername` is null

## Constraints

- WineCard does NOT show "Shared by X" — only visible on modal open
- No new translation keys required
- No schema changes required
