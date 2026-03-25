# Delete Confirmation Dialog — Design Spec

**Date:** 2026-03-24
**Status:** Approved

## Overview

Add a confirmation step before a wine is permanently deleted. Currently, clicking Delete in `WineModal` fires `deleteWine()` immediately. This spec introduces a Framer Motion confirmation dialog that appears over the existing modal, requiring explicit confirmation before the deletion proceeds.

## Approach

Framer Motion overlay — built inline inside `WineModal` using `AnimatePresence`. No new dependencies. Consistent with the app's existing animation patterns.

## State & Flow

- Add `confirmingDelete: boolean` state to `WineModal` (default `false`).
- Add `deleting: boolean` state to `WineModal` (default `false`) to track in-flight deletion.
- Clicking the Delete button sets `confirmingDelete = true`. No deletion occurs at this point.
- The confirmation dialog renders conditionally via `AnimatePresence`.
  - **Confirm** → sets `deleting = true`, disables the Confirm button, calls existing `handleDelete()` logic (calls `deleteWine`, closes modal, fires `onDelete`).
  - **Cancel** → sets `confirmingDelete = false`, dialog dismisses. Only available when `deleting` is `false`.
- Clicking the confirmation overlay (behind the card) cancels the confirmation (sets `confirmingDelete = false`) — it does **not** close the whole modal. The outer modal backdrop click is blocked while the confirmation dialog is open.
- Pressing Escape while the confirmation dialog is open cancels the confirmation and returns to the open modal (does not close the modal).

## Visual Structure

A small centered card (`max-w-sm`) animates in using Framer Motion `scale` + `opacity` transitions. It sits at `z-[60]` (Tailwind arbitrary value) above the existing modal (which is at `z-50`). A dark semi-transparent overlay behind the card further dims the existing modal content, also at `z-[60]`.

Card contents:
- Heading: "Delete this wine?" (translated per active language)
- Two buttons side by side:
  - **Cancel** — ghost variant, dismisses dialog. Disabled while `deleting` is `true`.
  - **Confirm delete** — destructive red variant, confirms deletion. Disabled while `deleting` is `true`.

## Internationalisation

Three new translation keys added to both `lib/i18n/en.ts` and `lib/i18n/fr.ts` (add only if not already present):

| Key | English | French |
|-----|---------|--------|
| `wineModal.deleteConfirm` | "Delete this wine?" | "Supprimer ce vin ?" |
| `wineModal.deleteConfirmAction` | "Yes, delete" | "Oui, supprimer" |
| `common.cancel` | "Cancel" | "Annuler" |

The `fr.ts` file uses `satisfies typeof en` so TypeScript will enforce that both files stay in sync.

Note: `wineModal.deleteConfirmAction` is intentionally distinct from `common.delete` to avoid two identically-labelled buttons in the same interaction flow (accessibility and UX clarity).

## Files Changed

| File | Change |
|------|--------|
| `components/WineModal.tsx` | Add `confirmingDelete` and `deleting` state; guard delete button; render confirmation dialog via `AnimatePresence` (add `AnimatePresence` to `framer-motion` import); block outer backdrop click while confirmation is open |
| `lib/i18n/en.ts` | Add `wineModal.deleteConfirm`, `wineModal.deleteConfirmAction`, and `common.cancel` |
| `lib/i18n/fr.ts` | Add `wineModal.deleteConfirm`, `wineModal.deleteConfirmAction`, and `common.cancel` |

## Out of Scope

- Undo / soft-delete
- Any changes to `app/actions.ts` or the Prisma schema
- New components or new dependencies
