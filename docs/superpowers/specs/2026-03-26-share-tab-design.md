# Share Profile Tab Bar Button — Design Spec

**Date:** 2026-03-26

## Summary

Move the "Share Profile" action out of the header and into the tab bar area as a standalone circle icon button. The three navigation tabs get rounder pill styling. Clicking Share invokes the native system share sheet (`navigator.share`), falling back to clipboard copy.

---

## Changes

### 1. Remove existing share button from header

The `LinkIcon` / `Check` copy-link button in `Dashboard.tsx`'s header (`components/Dashboard.tsx:120-128`) is removed. The `copied` state and `handleCopyProfileLink` function are replaced by a new `handleShareProfile` function that uses `navigator.share`.

### 2. Share handler

```
handleShareProfile():
  url = window.location.origin + "/u/" + user.username
  if navigator.share:
    navigator.share({ title: user.username, url })
  else if navigator.clipboard:
    clipboard.writeText(url)
```

No separate `copied` state needed — the native share sheet handles its own feedback.

### 3. Mobile bottom nav — tab styling

Current: `rounded-xl` on each tab button.
New: `rounded-full` — pill shape, closer to a circle.

### 4. Mobile bottom nav — share circle button

A new `<button>` rendered as a sibling after the `<nav>` element (not inside it). Positioned at the same vertical level via the same `fixed bottom-4` context.

- Position: `fixed bottom-4 right-4` — sits at the trailing edge, same row as the nav
- Size: `h-14 w-14 rounded-full`
- Style: `bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/30 dark:border-white/20 shadow-[var(--glass-shadow)]`
- Icon: `Share2` from `lucide-react`, `h-5 w-5`
- Color: `text-zinc-500` (matches inactive tab color)
- Visibility: `flex sm:hidden` (mobile only)
- No text label

The mobile nav `right-4` stays as-is; the share button occupies the same `right-4` slot, so the nav must not extend full-width into that space. The nav uses `left-4` with enough `right` margin to not overlap: change nav's `right-4` to `right-20` to leave room for the share button.

### 5. Desktop tab bar — tab label styling

The desktop tab text labels (Collection, Following, Wishlist) should be larger and heavier than the current defaults:

- `font-size: 30px` (use Tailwind `text-[30px]` or equivalent)
- `font-weight: 500` (use `font-medium`, which is already applied — bump to `font-semibold` or use `font-[500]` explicitly)

### 6. Desktop tab bar — share circle button

A `<button>` appended after the 3 tab buttons in the desktop tab row (`hidden sm:flex` bar).

- Size: `h-8 w-8 rounded-full`
- Style: `ml-auto` to push to the right end of the tab row; same frosted-glass tokens as the mobile share button
- Icon: `Share2`, `h-4 w-4`
- Color: `text-zinc-500 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white`

### 7. Remove unused imports

Remove `LinkIcon`, `Check` from the `lucide-react` import in `Dashboard.tsx`. Add `Share2`.

---

## Files Changed

- `components/Dashboard.tsx` — all changes

---

## Out of Scope

- `ProfileView.tsx` share button (separate context, not touched)
- i18n changes (existing `shareTitle` key remains, no new keys needed)
