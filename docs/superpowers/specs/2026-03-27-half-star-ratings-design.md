# Half-Star Ratings

**Date:** 2026-03-27
**Status:** Approved

## Summary

Allow users to rate wines in 0.5 increments (1.0–5.0) instead of whole integers only. Requires a database schema change and a UI update to the `RatingStar` component.

## Database

- Change `rating Int` to `rating Float` in `prisma/schema.prisma`
- Create a Prisma migration — SQLite preserves existing integer values as floats automatically
- In `actions.ts`, replace `parseInt(formData.get("rating"))` with `parseFloat(...)` in both places (addWine and moveWishlistItemToCollection)

## RatingStar Component

Each star renders two invisible half-width buttons absolutely positioned over the star graphic:

- Left button → sets/previews `index + 0.5`
- Right button → sets/previews `index + 1.0`

The star graphic uses two overlapping lucide `Star` SVGs:
- Left half: clipped to 50% width, filled yellow when `value >= index + 0.5`
- Right half: clipped to right 50%, filled yellow when `value >= index + 1.0`

This avoids SVG gradient complexity and reuses the existing `Star` icon.

**Desktop:** hovering either half previews the value via `hoverRating` state.
**Mobile:** tapping either half commits the value directly.

The component's public interface is unchanged — `rating: number` and `onRatingChange: (rating: number) => void` work identically; callers just pass `3.5` instead of `3`.

## Validation

- `WineForm.tsx`: `rating === 0` guard is unchanged — 0 is falsy, any valid rating (0.5–5.0) is truthy
- `actions.ts`: `!rating` check is unchanged for the same reason
- `readonly` mode disables both half-buttons per star, same behavior as today
- No changes needed to `WineCard`, `WineModal`, or `share/[token]/page.tsx`

## Files Changed

| File | Change |
|---|---|
| `prisma/schema.prisma` | `rating Int` → `rating Float` |
| `app/actions.ts` | `parseInt` → `parseFloat` (2 places) |
| `components/ui/RatingStar.tsx` | Split hit zones, half-fill rendering |
