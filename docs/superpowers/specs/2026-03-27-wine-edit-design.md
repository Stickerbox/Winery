# Wine Edit Feature — Design Spec

**Date:** 2026-03-27

## Overview

Allow users to edit the name, tasting notes, and rating of a wine already in their collection, directly from the WineModal. The image cannot be changed. The experience mirrors the "save for the first time" animation in WineForm.

## Server Action

Add `updateWine(id: number, data: { name: string; description: string; rating: number })` to `app/actions.ts`.

- Authenticates via `getCurrentUser()`, throws if unauthorized
- Verifies the wine belongs to the current user before updating
- Updates `name`, `description`, and `rating` on the Wine record via Prisma
- Calls `revalidatePath("/")` to refresh the server component
- Returns the updated `Wine` object so the client can update local state immediately

## WineModal Changes

### New prop

```ts
onUpdate?: (wine: Wine) => void
```

Called after a successful save with the updated wine, so the parent (Dashboard) can update `selectedWine` state immediately.

### New state

| State | Type | Purpose |
|---|---|---|
| `isEditing` | `boolean` | Whether edit mode is active |
| `editName` | `string` | Draft value for wine name |
| `editDescription` | `string` | Draft value for tasting notes |
| `editRating` | `number` | Draft value for rating |
| `isSaving` | `boolean` | Saving in progress |
| `saveError` | `string \| null` | Error message if save fails |

Draft fields are seeded from `wine` props when editing begins.

### Edit button

Added to the `!readonly` footer action bar — a pencil icon (`Pencil` from lucide-react) between Delete and Share in normal mode.

### Field transitions (edit mode active)

- **Title:** `<h2>` → `<Input>` bound to `editName`, styled to preserve heading prominence
- **Tasting notes:** `<p>` → `<Textarea>` bound to `editDescription`
- **Rating:** `<RatingStar readonly>` → `<RatingStar onRatingChange={setEditRating}>` (interactive)

### Footer in edit mode

Normal mode footer (Delete | Edit | Share) is replaced by:

- Left: Cancel button (ghost)
- Right: Save Changes button — wrapped in `AnimatePresence` + `motion.div` using the same spring animation as WineForm's review phase (`initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`, spring stiffness 300 damping 30)

### Keyboard behaviour

- When **not** editing: Escape closes the modal (existing behaviour)
- When **editing**: Escape cancels the edit and restores the original values (modal stays open)

### On save

1. Call `updateWine(wine.id, { name: editName, description: editDescription, rating: editRating })`
2. On success: exit edit mode, call `onUpdate?.(updatedWine)`
3. On error: display `saveError` message, stay in edit mode

### Reset on wine navigation

When `wine.id` changes (user swipes to next/prev wine), `isEditing` resets to `false` alongside the existing state resets.

## Dashboard Changes

Pass `onUpdate` to the existing `<WineModal>` usage:

```tsx
onUpdate={(updatedWine) => setSelectedWine(updatedWine)}
```

This updates `selectedWine` immediately so the modal reflects the new data without waiting for the server revalidation cycle.

## i18n

Add to `wineModal` section in both `en.ts` and `fr.ts`:

| Key | English | French |
|---|---|---|
| `edit` | `"Edit"` | `"Modifier"` |
| `saveChanges` | `"Save Changes"` | `"Enregistrer"` |
| `savingChanges` | `"Saving…"` | `"Enregistrement…"` |
| `editFailed` | `"Failed to save changes"` | `"Échec de l'enregistrement"` |
| `cancelEdit` | `"Cancel"` | `"Annuler"` |

`t.common.cancel` already exists — `cancelEdit` is added to `wineModal` for clarity in context.

## Out of Scope

- Image replacement (not supported)
- Editing wines in readonly mode (profile view, following feed, share page)
- Editing wishlist items (separate component)
