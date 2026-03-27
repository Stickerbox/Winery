# Edit Button Label + Collapsible Tasting Notes — Design Spec

**Date:** 2026-03-27

## Overview

Two small UI improvements:
1. Add a text label next to the pencil icon on the Edit button in WineModal.
2. Make the Tasting Notes (description) field in WineForm collapsible and collapsed by default, so the Personal Notes section is immediately visible.

---

## Change 1: Edit Button Label

**File:** `components/WineModal.tsx`

The Edit button currently renders as an icon-only square button (`size="icon"`). Change it to a standard button with the pencil icon on the left and the word "Edit" to the right.

- Remove `size="icon"` from the Button props
- Add `{t.wineModal.edit}` as text after `<Pencil className="h-4 w-4" />`
- Remove `aria-label` (redundant once visible text is present)
- Add `gap-2` to className for icon-text spacing

The `t.wineModal.edit` key already exists in both `en.ts` ("Edit") and `fr.ts` ("Modifier"). No i18n changes needed.

---

## Change 2: Collapsible Tasting Notes in WineForm

**File:** `components/WineForm.tsx`

The description/tasting notes textarea becomes a collapsible section — collapsed by default so the Personal Notes field is immediately visible when the review phase appears.

### State

Add `isDescriptionOpen` boolean state, initialised to `false`.

### Toggle header

Replace the plain `<label>` for the description field with a clickable row containing:
- The existing label text (`{t.wineForm.descriptionLabel}`)
- A `ChevronRight` icon (collapsed) or `ChevronDown` icon (expanded) from lucide-react, on the right side of the row

Clicking anywhere on the row toggles `isDescriptionOpen`.

### Animated content

Wrap the `<Textarea>` in `AnimatePresence` + `motion.div` using the existing spring animation pattern in the file:
```
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: "auto" }}
exit={{ opacity: 0, height: 0 }}
transition={{ type: "spring", stiffness: 300, damping: 30 }}
```
Add `overflow: hidden` on the motion.div to prevent content peeking during animation.

### Scope

`WineForm` only. This covers all "add wine" contexts (collection, wishlist, move-to-collection). WineModal edit mode is unaffected — the description field there is always visible since it's an existing wine being edited.

### No change to validation

The description field remains `required` in the form. The collapsible state is purely presentational — it does not change what is submitted or validated. If a user submits without opening the section, the empty description will still be caught by the existing Save button disabled guard (`!description.trim()`).

---

## Out of Scope

- Collapsing tasting notes in WineModal edit mode
- Persisting the collapsed/expanded state across sessions
- Making Personal Notes collapsible
