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
- Collection → `Wine`
- Following → `Users`
- Wishlist → `Bookmark`

Each button shows icon + label stacked vertically (`flex-col items-center gap-0.5`).

## FAB Adjustment

The floating `+` add-wine button shifts upward on mobile to sit above the bottom nav:
- Mobile: `bottom-24`
- Desktop: `bottom-6`
- Achieved with: `bottom-24 sm:bottom-6`

## Content Padding

Bump `pb-20` on the root container to `pb-36 sm:pb-20` so content is not hidden behind the bottom nav on mobile.

## Wishlist Tab

Remove the `disabled` prop and `opacity-40 cursor-not-allowed` styling from the Wishlist tab. The tab renders `null` for content — this is acceptable until the Wishlist feature is built out.

## What Does Not Change

- Desktop tab bar markup and styling
- Tab state management (`activeTab` state, `setActiveTab`)
- All other Dashboard layout and features
