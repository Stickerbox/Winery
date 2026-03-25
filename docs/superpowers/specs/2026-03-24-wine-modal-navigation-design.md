# Wine Modal Navigation Design

**Date:** 2026-03-24
**Status:** Approved

## Overview

Allow users to navigate between wine cards from within the open modal using left/right arrow buttons, keyboard arrow keys, and touch swipe gestures — without closing and reopening the modal.

## Architecture

Navigation state lives in `Dashboard`, which already owns `filteredWines` and `selectedWine`. The modal receives callbacks and boundary flags; it does not need to know about the full wine list.

### Dashboard changes

- Derive `selectedIndex = filteredWines.findIndex(w => w.id === selectedWine?.id)`
- If `selectedIndex === -1` (wine no longer in filtered list), disable navigation: `hasPrev = false`, `hasNext = false`
- Pass four new props to `WineModal`:
  - `hasPrev: boolean` — `selectedIndex > 0`
  - `hasNext: boolean` — `selectedIndex !== -1 && selectedIndex < filteredWines.length - 1`
  - `onPrev: () => void` — sets `selectedWine` to `filteredWines[selectedIndex - 1]`
  - `onNext: () => void` — sets `selectedWine` to `filteredWines[selectedIndex + 1]`
- **Do not add a `key` prop to the `<WineModal>` element** inside the `AnimatePresence` block. `AnimatePresence` is keyed on `selectedWine` presence — as long as it stays non-null during navigation, `WineModal` stays mounted. A `key={selectedWine.id}` would remount on every navigation.
- The existing `onDelete` prop is not affected. `Dashboard` currently passes no `onDelete` (it is a no-op). Leave unchanged.
- After a successful delete, `handleDelete` calls `onClose()` → `selectedWine = null`. The modal dismisses, so the user cannot navigate to a stale deleted entry.

### WineModal changes

**New props:**

```ts
hasPrev: boolean
hasNext: boolean
onPrev: () => void
onNext: () => void
```

**Arrow button placement:**

The modal card's outer `motion.div` uses `overflow-hidden`, so arrow buttons rendered as its children with negative translate would be clipped. Render them as **siblings** of that `motion.div` inside the same `fixed inset-0 pointer-events-none` container. Give each button `pointer-events-auto`:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
  {/* Left arrow */}
  <button
    className="pointer-events-auto hidden md:flex ..."
    aria-label={t.wineModal.prevWine}
    disabled={!hasPrev}
    onClick={onPrev}
  />
  {/* Modal card — unchanged max-w-2xl */}
  <motion.div layoutId={...} className="w-full max-w-2xl ...">
    ...
  </motion.div>
  {/* Right arrow */}
  <button
    className="pointer-events-auto hidden md:flex ..."
    aria-label={t.wineModal.nextWine}
    disabled={!hasNext}
    onClick={onNext}
  />
</div>
```

- Desktop only (`hidden md:flex`) — on mobile, navigation is via swipe
- When a single wine exists, both arrows are disabled but still rendered (keeps layout stable)
- Style as semi-transparent circular ghost buttons matching the existing close button
- `disabled` state: reduced opacity

**Keyboard navigation:**

Keep the existing `useEffect` (lines 26–36 of `WineModal.tsx`) unchanged — it handles `Escape` to cancel the delete confirm dialog. Add a second, separate `useEffect` for navigation keys:

```ts
React.useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (confirmingDelete) return;
    if (e.key === "ArrowLeft" && hasPrev) onPrev();
    if (e.key === "ArrowRight" && hasNext) onNext();
    if (e.key === "Escape") onClose(); // ← new behavior: Escape closes modal
  }
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [hasPrev, hasNext, onPrev, onNext, onClose, confirmingDelete]);
```

Note: **`Escape` → `onClose()` is new behavior** not present in the current codebase. The existing effect only handles Escape when `confirmingDelete` is true. This new handler also closes the modal via Escape when `confirmingDelete` is false.

**Touch swipe:**

`useSwipeable` returns both event handlers and a `ref` callback. Spreading it onto the `motion.div` that carries `layoutId` would conflict with Framer Motion's internal ref system. Instead, spread the swipe handlers onto the **outer fixed container div** (which has no layoutId and no ref conflict):

```ts
const swipeHandlers = useSwipeable({
  onSwipedLeft: () => { if (hasNext && !confirmingDelete) onNext(); },
  onSwipedRight: () => { if (hasPrev && !confirmingDelete) onPrev(); },
  preventScrollOnSwipe: true,
});

// Applied to the outermost wrapper, not the motion.div:
<div {...swipeHandlers} className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
```

`preventScrollOnSwipe: true` prevents the swipe handler from intercepting vertical scroll inside the `overflow-y-auto` details panel.

**State reset on navigation:**

```ts
React.useEffect(() => {
  setConfirmingDelete(false);
  setDeleting(false);
  setDeleteError(null);
  setCopied(false);
}, [wine.id]);
```

**Backdrop during navigation:**

The backdrop `motion.div` (top of `WineModal`'s fragment) has no `key` and stays mounted across navigation. This is correct — it should not fade out/in between wines. Do not key it on `wine.id`.

## Animation

**Open/close (shared layout — layoutId):**

The outermost `motion.div` inside `WineModal` (currently line 77, the `max-w-2xl` modal card) uses `layoutId={\`wine-${wine.id}\`}`. During navigation, `wine.id` changes, which would cause FM to animate the modal frame toward the new card's grid position.

Fix: capture the wine id at mount time with a ref and use it for `layoutId`:

```ts
const openedForWineId = useRef(wine.id);
// No update logic. WineModal unmounts on close (Dashboard's AnimatePresence),
// so this ref is always initialized to the opening wine's id on each open.
```

Apply only to the outermost `motion.div` (the `max-w-2xl` modal card, currently line 77):

```tsx
<motion.div
  layoutId={`wine-${openedForWineId.current}`}
  ...
>
```

For wines navigated to, their cards in the grid have a `layoutId` that matches nothing in the modal — FM silently ignores unmatched layoutIds. No spurious animation occurs.

Do NOT use a timer to toggle `layoutId` to `undefined` — this produces frame snaps.

**Content transition during navigation:**

The outer `motion.div` is `flex flex-col md:flex-row` with the image panel and details panel as direct flex children. Wrapping them in an extra `div` would break the flex layout. Instead, key **each panel separately**:

```tsx
<motion.div layoutId={`wine-${openedForWineId.current}`} className="... flex flex-col md:flex-row ...">
  <motion.div key={`img-${wine.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
    className="relative w-full md:w-1/2 h-64 md:h-auto ...">
    {/* image */}
  </motion.div>
  <motion.div key={`content-${wine.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
    className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto">
    {/* details */}
  </motion.div>
</motion.div>
```

No `AnimatePresence` wrapper needed — only enter fades, no exit animations. Neither inner `motion.div` carries a `layoutId`, so no conflict with the outer layout animation.

## i18n

Add the following keys to both `lib/i18n/en.ts` and `lib/i18n/fr.ts` under `wineModal`:

| Key | EN | FR |
|-----|----|----|
| `prevWine` | `"Previous wine"` | `"Vin précédent"` |
| `nextWine` | `"Next wine"` | `"Vin suivant"` |

Used as `aria-label` on the arrow buttons.

## Dependencies

- **`react-swipeable`** — small, focused touch gesture library. Handles threshold tuning, diagonal swipe rejection, and passive event listeners correctly.
- Install: `npm install react-swipeable`
- `react-swipeable` v7+ requires React 16.8+; verify against the project's React version.

## Affected Files

- `components/Dashboard.tsx` — derive index, pass nav props to `WineModal`
- `components/WineModal.tsx` — arrow buttons, keyboard nav, swipe, animation, state reset
- `lib/i18n/en.ts` — add `prevWine`, `nextWine` keys
- `lib/i18n/fr.ts` — add `prevWine`, `nextWine` keys
- `package.json` / `package-lock.json` — `react-swipeable` install

## Out of Scope

- Preloading adjacent wine images
- Animated slide direction (left vs right) based on navigation direction
- URL updates on navigation
- Showing arrow buttons on mobile (swipe covers this use case)
