# Design: Add to Wishlist from + Button

**Date:** 2026-03-26
**Status:** Approved

## Summary

When the user taps the floating `+` button, a small popup menu appears with two options: "Add to Collection" and "Add to Wishlist". Selecting either opens the existing `WineForm` modal pre-configured for that flow. The wishlist flow is identical to the collection flow except the rating field is hidden and a different server action is called.

---

## 1. Popup Menu (Dashboard)

- `isAddOpen: boolean` state is replaced with `addMode: "collection" | "wishlist" | null`
- `null` = everything closed; any other value = form open in that mode
- Tapping `+` renders a small animated popup above the button with two pill options
- Tapping a pill sets `addMode` and opens the form
- Tapping the backdrop or `+` again dismisses the popup
- Animation: `framer-motion` `AnimatePresence`, scale + opacity originating from the bottom-right, matching existing modal patterns

New i18n keys:
- `dashboard.addToCollection` — "Add to Collection" / "Ajouter à la collection"
- `dashboard.addToWishlist` — "Add to Wishlist" / "Ajouter à la liste de souhaits"

---

## 2. WineForm Changes

New prop: `mode: "collection" | "wishlist"` (defaults to `"collection"` — all existing usages unaffected).

**When `mode === "wishlist"`:**
- Rating field is not rendered
- Submit button reads "Add to Wishlist" (new i18n key `wineForm.saveWishlist`)
- Submit enabled when `name.trim() && description.trim()` (no rating required)
- On submit, calls `addToWishlistManual(formData)` instead of `addWine`

**When `mode === "collection"` (unchanged):**
- Rating field shown, submit enabled when `name && description && rating > 0`
- Calls `addWine(formData)`

New i18n keys:
- `wineForm.saveWishlist` — "Add to Wishlist" / "Ajouter à la liste"
- `wineForm.savingWishlist` — "Adding..." / "Ajout..."

---

## 3. New Server Action: `addToWishlistManual`

Location: `app/actions.ts`

Accepts `FormData` with `name`, `description`, `image`.

Steps:
1. Auth check via `getCurrentUser()`
2. Upload + compress image using the same sharp pipeline as `addWine`
3. Create `WishlistItem` with `addedByUsername` set to the current user's own username
4. `revalidatePath("/")`

No schema changes required. `WishlistItem.imagePath` is already `String?`.
The existing `addToWishlist(wineId)` action is untouched.

---

## Out of Scope

- No changes to the wishlist display, removal, or move-to-collection flows
- No changes to any other entry points to `WineForm`
