# Wine Modal Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to navigate between wine cards in the modal via arrow buttons (desktop), keyboard arrow keys, and swipe gestures (mobile) without closing and reopening.

**Architecture:** `Dashboard` derives navigation state from `filteredWines` and passes `hasPrev`/`hasNext`/`onPrev`/`onNext` callbacks to `WineModal`. The modal handles all input surfaces (buttons, keyboard, swipe) and manages a stable `layoutId` ref to prevent Framer Motion from animating the modal frame during navigation.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Framer Motion, Tailwind CSS v4, `react-swipeable` (new), Prisma, Lucide icons

---

## File Map

| File | Change |
|------|--------|
| `package.json` | Add `react-swipeable` dependency |
| `lib/i18n/en.ts` | Add `prevWine`, `nextWine` keys to `wineModal` |
| `lib/i18n/fr.ts` | Add `prevWine`, `nextWine` keys to `wineModal` |
| `components/Dashboard.tsx` | Derive `selectedIndex`; pass nav props to `WineModal` |
| `components/WineModal.tsx` | New props, stable layoutId ref, keyed panel fades, keyboard nav, swipe handlers, state reset, arrow buttons |

---

## Task 1: Install react-swipeable

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
cd /path/to/project && npm install react-swipeable
```

Expected output: `added 1 package` (react-swipeable has no transitive dependencies).

- [ ] **Step 2: Verify the build still passes**

```bash
npm run build
```

Expected: Build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install react-swipeable for touch gesture support"
```

---

## Task 2: Add i18n keys for arrow button labels

**Files:**
- Modify: `lib/i18n/en.ts`
- Modify: `lib/i18n/fr.ts`

- [ ] **Step 1: Add keys to `lib/i18n/en.ts`**

Find the `wineModal` object. After the `goToSAQ` line, **append** these two lines (do not replace the whole block):

```ts
    prevWine: "Previous wine",
    nextWine: "Next wine",
```

- [ ] **Step 2: Add keys to `lib/i18n/fr.ts`**

Same edit — find the `wineModal` object, append after `goToSAQ`:

```ts
    prevWine: "Vin précédent",
    nextWine: "Vin suivant",
```

- [ ] **Step 3: Verify TypeScript is happy**

```bash
npm run lint
```

Expected: No errors. The `fr.ts` file uses `satisfies typeof en`, so TypeScript will catch any missing keys.

- [ ] **Step 4: Commit**

```bash
git add lib/i18n/en.ts lib/i18n/fr.ts
git commit -m "feat: add wine modal navigation i18n keys (en + fr)"
```

---

## Task 3: Thread navigation props from Dashboard to WineModal

**Files:**
- Modify: `components/Dashboard.tsx`
- Modify: `components/WineModal.tsx` (props interface only)

This task adds the plumbing. No visual changes yet — WineModal will accept the props but not use them until Task 4+.

- [ ] **Step 1: Extend `WineModalProps` in `components/WineModal.tsx`**

Find the `WineModalProps` interface (currently lines 12–16) and add the four new props:

```ts
interface WineModalProps {
    wine: Wine;
    onClose: () => void;
    onDelete?: () => void;
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
}
```

Also destructure the new props in the function signature:

```ts
export function WineModal({ wine, onClose, onDelete, hasPrev, hasNext, onPrev, onNext }: WineModalProps) {
```

- [ ] **Step 2: Update `components/Dashboard.tsx` to derive navigation state and pass it**

In `Dashboard`, find where `selectedWine` is used. Add the index derivation just before the return statement (or near the other `useMemo`/state logic):

```ts
const selectedIndex = React.useMemo(
    () => (selectedWine ? filteredWines.findIndex((w) => w.id === selectedWine.id) : -1),
    [filteredWines, selectedWine]
);
```

Then update the `WineModal` call (currently lines 174–179) to pass the new props:

```tsx
<WineModal
    wine={selectedWine}
    onClose={() => setSelectedWine(null)}
    hasPrev={selectedIndex > 0}
    hasNext={selectedIndex !== -1 && selectedIndex < filteredWines.length - 1}
    onPrev={() => setSelectedWine(filteredWines[selectedIndex - 1])}
    onNext={() => setSelectedWine(filteredWines[selectedIndex + 1])}
/>
```

`onDelete` is not passed here — `Dashboard` currently passes no `onDelete` prop (it is optional and a no-op). Leave it absent.

**Important:** Do NOT add a `key` prop to `<WineModal>` here. The component must stay mounted across navigation.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/Dashboard.tsx components/WineModal.tsx
git commit -m "feat: thread navigation props from Dashboard to WineModal"
```

---

## Task 4: Fix layoutId animation and add content fade on navigation

**Files:**
- Modify: `components/WineModal.tsx`

Currently, `motion.div` uses `layoutId={`wine-${wine.id}`}`. When navigating, `wine.id` changes and Framer Motion tries to animate the modal toward the new card's grid position. Fix: freeze the layoutId at open time with a ref, and key each inner panel so content cross-fades.

- [ ] **Step 1: Add the `openedForWineId` ref inside `WineModal`**

Add this line directly after the existing state declarations (after the `useTranslations` line, before the first `useEffect`):

```ts
const openedForWineId = React.useRef(wine.id);
```

This ref is initialized once when the component mounts (i.e., when the modal opens). Because `Dashboard`'s `AnimatePresence` unmounts `WineModal` when `selectedWine` becomes null, the ref will always be fresh on each open.

- [ ] **Step 2: Update the outer `motion.div` to use the frozen layoutId**

Find the outer `motion.div` (currently `layoutId={`wine-${wine.id}`}`, line ~78). Change it to:

```tsx
<motion.div
    layoutId={`wine-${openedForWineId.current}`}
    className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col md:flex-row max-h-[90vh]"
>
```

- [ ] **Step 3: Key the image panel for content fade**

Find the image panel div (currently `<div className="relative w-full md:w-1/2 h-64 md:h-auto bg-zinc-100 dark:bg-zinc-800">`). Replace it with a `motion.div` keyed to `wine.id`:

```tsx
<motion.div
    key={`img-${wine.id}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.15 }}
    className="relative w-full md:w-1/2 h-64 md:h-auto bg-zinc-100 dark:bg-zinc-800"
>
    {/* existing image and mobile close button — unchanged */}
</motion.div>
```

- [ ] **Step 4: Key the content panel for content fade**

Find the content panel div (currently `<div className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto">`). Replace it with a `motion.div` keyed to `wine.id`:

```tsx
<motion.div
    key={`content-${wine.id}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.15 }}
    className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto"
>
    {/* all existing content — unchanged */}
</motion.div>
```

No `AnimatePresence` wrapper is needed here — only enter fades, no exit animations. Do not add one. Neither inner `motion.div` carries a `layoutId`, so they don't conflict with the outer layout animation.

- [ ] **Step 5: Verify the build**

```bash
npm run build
```

Expected: No errors. Open the app and verify the card-expand open animation still works correctly when first opening a wine modal.

- [ ] **Step 6: Commit**

```bash
git add components/WineModal.tsx
git commit -m "feat: stabilize layoutId on navigation and add content fade"
```

---

## Task 5: Add keyboard navigation

**Files:**
- Modify: `components/WineModal.tsx`

- [ ] **Step 1: Add the keyboard navigation `useEffect`**

The existing `useEffect` (lines 26–36) handles Escape to cancel delete confirm. Leave it unchanged. Add a second, separate `useEffect` after it:

```ts
React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
        if (confirmingDelete) return;
        if (e.key === "ArrowLeft" && hasPrev) onPrev();
        if (e.key === "ArrowRight" && hasNext) onNext();
        if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
}, [hasPrev, hasNext, onPrev, onNext, onClose, confirmingDelete]);
```

Note: `Escape → onClose()` is **new behavior** — the current codebase has no Escape-to-close handler when `confirmingDelete` is false. This adds it.

The two effects coexist safely: when `confirmingDelete` is `true`, this new effect's `if (confirmingDelete) return` guard fires first (no navigation, no close), while the original effect handles Escape to cancel the dialog. When `confirmingDelete` is `false`, the original effect's `if (!confirmingDelete) return` guard exits early, so only this new effect handles Escape. No double-firing occurs. Do not consolidate the two effects — keeping them separate preserves this clean separation.

- [ ] **Step 2: Verify the build**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 3: Manual test**

Open a wine modal. Press `Escape` — modal should close. Re-open, press `ArrowRight` — should navigate to next wine. Press `ArrowLeft` — should navigate back. At first/last wine, the respective arrow key should do nothing.

- [ ] **Step 4: Commit**

```bash
git add components/WineModal.tsx
git commit -m "feat: add keyboard arrow and Escape navigation to WineModal"
```

---

## Task 6: Add swipe gestures

**Files:**
- Modify: `components/WineModal.tsx`

- [ ] **Step 1: Import `useSwipeable`**

Add to the top of `WineModal.tsx`, after the existing imports:

```ts
import { useSwipeable } from "react-swipeable";
```

- [ ] **Step 2: Create swipe handlers inside the component**

Add this just after the `openedForWineId` ref declaration:

```ts
const swipeHandlers = useSwipeable({
    onSwipedLeft: () => { if (hasNext && !confirmingDelete) onNext(); },
    onSwipedRight: () => { if (hasPrev && !confirmingDelete) onPrev(); },
    preventScrollOnSwipe: true,
});
```

`preventScrollOnSwipe: true` prevents horizontal swipes from interfering with vertical scroll in the `overflow-y-auto` content panel.

- [ ] **Step 3: Spread swipe handlers onto the outer container div**

Find the outer positioning `div` (currently `<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">`). Spread the handlers onto it:

```tsx
<div {...swipeHandlers} className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
```

CSS `pointer-events: none` only affects pointer hit-testing for mouse events — it does **not** suppress native touch events. `react-swipeable` attaches `touchstart`/`touchmove`/`touchend` listeners which work correctly on a `pointer-events: none` element. Spreading on the container (rather than the `motion.div` with `layoutId`) avoids any interaction with Framer Motion's internal ref system.

- [ ] **Step 4: Verify the build**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 5: Manual test on mobile or using browser DevTools device emulation**

Open the modal. Swipe left — should navigate to next wine. Swipe right — should navigate to previous wine. Vertical scrolling in the description area should still work normally.

- [ ] **Step 6: Commit**

```bash
git add components/WineModal.tsx
git commit -m "feat: add swipe gesture navigation to WineModal"
```

---

## Task 7: Reset local state on navigation

**Files:**
- Modify: `components/WineModal.tsx`

Without this, the delete confirmation dialog could persist across navigated wines, and the "Copied!" share indicator could linger.

- [ ] **Step 1: Add the state-reset `useEffect`**

Add after the swipe handlers declaration:

```ts
React.useEffect(() => {
    setConfirmingDelete(false);
    setDeleting(false);
    setDeleteError(null);
    setCopied(false);
}, [wine.id]);
```

- [ ] **Step 2: Verify the build**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 3: Manual test**

Open a wine modal. Click delete, see the confirm dialog. Press `ArrowRight` to navigate. The confirm dialog should be gone on the new wine.

- [ ] **Step 4: Commit**

```bash
git add components/WineModal.tsx
git commit -m "feat: reset modal local state on navigation"
```

---

## Task 8: Add arrow buttons

**Files:**
- Modify: `components/WineModal.tsx`

- [ ] **Step 1: Add `ChevronLeft` and `ChevronRight` to the Lucide import**

Find the existing import (line 5):

```ts
import { X, Calendar, Trash2, Share2, Check, ExternalLink } from "lucide-react";
```

Replace with:

```ts
import { X, Calendar, Trash2, Share2, Check, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
```

- [ ] **Step 2: Add arrow buttons as siblings of the modal card**

After Task 6, the outer container already has `{...swipeHandlers}`. The complete structure with arrow buttons added looks like this:

```tsx
<div {...swipeHandlers} className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
    <Button
        size="icon"
        variant="ghost"
        aria-label={t.wineModal.prevWine}
        disabled={!hasPrev}
        onClick={onPrev}
        className="hidden md:flex pointer-events-auto shrink-0 rounded-full mr-2 text-white bg-black/20 hover:bg-black/40 disabled:opacity-20 disabled:cursor-not-allowed"
    >
        <ChevronLeft className="h-6 w-6" />
    </Button>

    <motion.div
        layoutId={`wine-${openedForWineId.current}`}
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col md:flex-row max-h-[90vh]"
    >
        {/* existing modal content — unchanged */}
    </motion.div>

    <Button
        size="icon"
        variant="ghost"
        aria-label={t.wineModal.nextWine}
        disabled={!hasNext}
        onClick={onNext}
        className="hidden md:flex pointer-events-auto shrink-0 rounded-full ml-2 text-white bg-black/20 hover:bg-black/40 disabled:opacity-20 disabled:cursor-not-allowed"
    >
        <ChevronRight className="h-6 w-6" />
    </Button>
</div>
```

The buttons use `hidden md:flex` (desktop only), `pointer-events-auto` (parent container is `pointer-events-none`), and `shrink-0` so they don't collapse in the flex row.

- [ ] **Step 3: Verify the build and lint**

```bash
npm run lint && npm run build
```

Expected: No errors.

- [ ] **Step 4: Manual test — full feature walkthrough**

1. Add at least 3 wines to the collection
2. Open any wine modal
3. **Desktop:** Verify left/right arrow buttons appear flanking the modal
4. Click right arrow — navigates to next wine, content fades in, modal frame stays in place
5. Click left arrow — navigates back
6. At first wine: left arrow is visually faded and unclickable
7. At last wine: right arrow is visually faded and unclickable
8. Press `ArrowLeft` / `ArrowRight` keyboard keys — same navigation behavior
9. Press `Escape` — modal closes
10. **Mobile (DevTools device emulation):** Arrow buttons hidden; swipe left/right navigates
11. Open delete confirm dialog, then press `ArrowRight` — dialog disappears on new wine
12. Verify card-expand open animation still works when first opening a modal

- [ ] **Step 5: Commit**

```bash
git add components/WineModal.tsx
git commit -m "feat: add prev/next arrow buttons to WineModal"
```
