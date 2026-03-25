# Delete Confirmation Dialog — Design Spec

**Date:** 2026-03-24
**Status:** Approved

## Overview

Add a confirmation step before a wine is permanently deleted. Currently, clicking Delete in `WineModal` fires `deleteWine()` immediately. This spec introduces a Framer Motion confirmation dialog that appears over the existing modal, requiring explicit confirmation before the deletion proceeds.

## Approach

Framer Motion overlay — built inline inside `WineModal` using `AnimatePresence`. No new dependencies. Consistent with the app's existing animation patterns.

## State & Flow

- Add `confirmingDelete: boolean` state to `WineModal` (default `false`).
- Clicking the Delete button sets `confirmingDelete = true`. No deletion occurs at this point.
- The confirmation dialog renders conditionally via `AnimatePresence`.
  - **Confirm** → calls existing `handleDelete()` logic (calls `deleteWine`, closes modal, fires `onDelete`).
  - **Cancel** → sets `confirmingDelete = false`, dialog dismisses.

## Visual Structure

A small centered card (`max-w-sm`) animates in using Framer Motion `scale` + `opacity` transitions. It sits at `z-60` above the existing modal (which is at `z-50`). A dark semi-transparent overlay behind the card further dims the existing modal content.

Card contents:
- Heading: "Delete this wine?" (translated per active language)
- Two buttons side by side:
  - **Cancel** — ghost variant, dismisses dialog
  - **Delete** — destructive red variant, confirms deletion

## Internationalisation

Two new translation keys added to both `lib/i18n/en.ts` and `lib/i18n/fr.ts`:

| Key | English | French |
|-----|---------|--------|
| `wineModal.deleteConfirm` | "Delete this wine?" | "Supprimer ce vin ?" |
| `common.cancel` | "Cancel" | "Annuler" |

The `fr.ts` file uses `satisfies typeof en` so TypeScript will enforce that both files stay in sync.

## Files Changed

| File | Change |
|------|--------|
| `components/WineModal.tsx` | Add `confirmingDelete` state, guard delete button, render confirmation dialog via `AnimatePresence` |
| `lib/i18n/en.ts` | Add `wineModal.deleteConfirm` and `common.cancel` |
| `lib/i18n/fr.ts` | Add `wineModal.deleteConfirm` and `common.cancel` |

## Out of Scope

- Undo / soft-delete
- Any changes to `app/actions.ts` or the Prisma schema
- New components or new dependencies
