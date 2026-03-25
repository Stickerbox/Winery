# Mobile Bottom Navigation Bar

**Date:** 2026-03-25
**Status:** Approved

## Overview

Move the Collection / Following / Wishlist tab navigation to a floating bottom bar on mobile devices. On desktop, the existing top tab bar remains unchanged.

## Scope

Changes are confined to `components/Dashboard.tsx`. No new files or components needed.

## Desktop (unchanged)

The existing tab bar stays as-is — full-width underline style rendered at the top of `<main>`. Add `hidden sm:flex` so it is hidden on mobile.

## Mobile Bottom Nav

**Positioning:** `fixed bottom-4 left-4 right-4` — spans full viewport width minus 16px padding on each side.

**Shape:** `rounded-2xl` — floating pill/card appearance, not full-width edge-to-edge.

**Style:** Frosted-glass matching the app header: `bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-lg`.

**Visibility:** `flex sm:hidden` — only visible on mobile.

**Tab layout:** Each of the three tab buttons gets `flex-1` so they divide the bar width equally regardless of label length.

**Active tab indicator:** Inner pill highlight — `bg-violet-100 dark:bg-violet-900/40 text-violet-600 rounded-xl`. Inactive tabs are `text-zinc-500`.

**Icons** (lucide-react, already available):
- Collection → `Wine` (aliased as `WineIcon` — see Icon Import Alias section)
- Following → `Users`
- Wishlist → `Bookmark`

Icons render at `h-5 w-5`.

Each button shows icon + label stacked vertically (`flex-col items-center gap-0.5`). Labels use the existing translation keys already in scope: `t.dashboard.tabCollection`, `t.dashboard.tabFollowing`, `t.dashboard.tabWishlist`.

**z-index:** The bottom nav sits at `z-20`. This places it below the FAB (`z-30`), the modal overlay (`z-40`), and the modal itself (`z-50`). When the Add Wine modal is open, the bottom nav is covered by the backdrop — correct behaviour.

## Icon Import Alias

`lucide-react` exports a `Wine` icon, but `Dashboard.tsx` already imports `Wine` (the Prisma model type) from `@prisma/client`. To avoid a naming collision, alias the lucide icon on import:

```ts
import { Wine as WineIcon, Users, Bookmark } from "lucide-react";
```

Use `<WineIcon />` for the Collection tab icon.

## FAB Adjustment

The floating `+` add-wine button shifts upward on mobile to sit above the bottom nav. The bottom nav bar renders at approximately 56px tall with a `bottom-4` (16px) offset, placing its top edge ~72px from the viewport bottom. `bottom-24` (96px) provides ~24px of clearance above it — a deliberate value, not a guess. Adjust if the rendered height differs.

- Mobile: `bottom-24`
- Desktop: `bottom-6`
- Achieved with: `bottom-24 sm:bottom-6`

## Content Padding

Bump `pb-20` on the root `<div>` container to `pb-36 sm:pb-20` so content (including the `LanguageToggle` rendered at the bottom of `<main>`) is not hidden behind the bottom nav on mobile. The `LanguageToggle` wrapper has its own `pb-6` which is additive; `pb-36` on the root container is sufficient to push all content clear of the nav bar. The value is intentionally generous (144px vs ~72px nav height) to account for varying rendered heights and safe-area insets on mobile browsers.

## Wishlist Tab

Remove the `disabled` prop and `opacity-40 cursor-not-allowed` styling from the Wishlist tab in the desktop tab bar.

Also replace the conditional `onClick` guard `onClick={() => tab !== "wishlist" && setActiveTab(tab)}` with a plain `onClick={() => setActiveTab(tab)}` call for all three tabs. The tab renders `null` for content — this is acceptable until the Wishlist feature is built out.

## What Does Not Change

- Tab state management (`activeTab` state, `setActiveTab`)
- All other Dashboard layout and features outside the tab bar and FAB
