# Wine Modal Navigation Design

**Date:** 2026-03-24
**Status:** Approved

## Overview

Allow users to navigate between wine cards from within the open modal using left/right arrow buttons, keyboard arrow keys, and touch swipe gestures — without closing and reopening the modal.

## Architecture

Navigation state lives in `Dashboard`, which already owns `filteredWines` and `selectedWine`. The modal receives callbacks and boundary flags; it does not need to know about the full wine list.

### Dashboard changes

- Derive `selectedIndex = filteredWines.findIndex(w => w.id === selectedWine?.id)`
- Pass four new props to `WineModal`:
  - `hasPrev: boolean` — `selectedIndex > 0`
  - `hasNext: boolean` — `selectedIndex < filteredWines.length - 1`
  - `onPrev: () => void` — sets `selectedWine` to `filteredWines[selectedIndex - 1]`
  - `onNext: () => void` — sets `selectedWine` to `filteredWines[selectedIndex + 1]`

### WineModal changes

**New props:**

```ts
hasPrev: boolean
hasNext: boolean
onPrev: () => void
onNext: () => void
```

**Arrow buttons:**
- Rendered on the left and right outer edges of the modal card, vertically centered
- Styled as semi-transparent circular ghost buttons, consistent with the existing close button
- `disabled` and visually faded (reduced opacity) when at the boundary (`!hasPrev` or `!hasNext`)

**Keyboard navigation:**
- Added to the existing keyboard `useEffect` (or a dedicated one)
- `ArrowLeft` → calls `onPrev()` when `hasPrev && !confirmingDelete`
- `ArrowRight` → calls `onNext()` when `hasNext && !confirmingDelete`

**Touch swipe (react-swipeable):**
- Install `react-swipeable`
- Use `useSwipeable` hook bound to the modal card element
- Swipe left → `onNext()` when `hasNext && !confirmingDelete`
- Swipe right → `onPrev()` when `hasPrev && !confirmingDelete`
- Use swipeable's default threshold; suppress when delete confirm is open

## Animation

Two concerns: open/close shared layout animation, and content transition during navigation.

**Open/close (shared layout):**
The outer `motion.div` uses `layoutId={wine-${wine.id}}` to animate the card expanding into the modal. During navigation this layoutId changes, which would cause Framer Motion to try to animate the modal toward the new card's grid position — visually wrong.

Fix: track `isNavigating` state (set `true` on nav, cleared after ~300ms). When `isNavigating` is true, suppress `layoutId` (set to `undefined`) so FM does not trigger a shared layout animation mid-navigation. Open/close still uses the normal card-expand animation.

**Content transition during navigation:**
Wrap the modal's inner content (image panel + details panel) with `key={wine.id}` and a short `opacity` fade via Framer Motion `AnimatePresence`. This cross-fades the content when the wine changes without affecting the modal frame position.

## Dependencies

- `react-swipeable` — small, focused touch gesture library with no transitive dependencies. Handles threshold tuning, diagonal swipe rejection, and passive event listeners correctly.

## Out of Scope

- Preloading adjacent wine images
- Animated slide direction (left vs right) based on navigation direction
- URL updates on navigation
