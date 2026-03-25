# Delete Confirmation Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Framer Motion confirmation dialog to `WineModal` so users must explicitly confirm before a wine is permanently deleted.

**Architecture:** A `confirmingDelete` boolean state gates the delete action. When true, a Framer Motion overlay card renders above the existing modal (via `AnimatePresence`). Clicking Confirm triggers deletion with a `deleting` boolean that disables both buttons while the server action is in flight. Clicking Cancel or the backdrop (or pressing Escape) dismisses the confirmation without deleting.

**Tech Stack:** React 19, Framer Motion 12, Tailwind CSS v4, Next.js App Router, TypeScript

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `lib/i18n/en.ts` | Modify | Add `wineModal.deleteConfirm`, `wineModal.deleteConfirmAction`, `common.cancel` |
| `lib/i18n/fr.ts` | Modify | Same three keys in French |
| `components/WineModal.tsx` | Modify | Add state, `AnimatePresence` import, confirmation dialog UI, backdrop guard |

---

### Task 1: Add i18n keys (English)

**Files:**
- Modify: `lib/i18n/en.ts`

- [ ] **Step 1: Add `common.cancel` to `en.ts`**

Open `lib/i18n/en.ts`. In the `common` object, add after `rating`:

```ts
cancel: "Cancel",
```

The `common` block should now read:
```ts
common: {
    delete: "Delete",
    share: "Share",
    copied: "Copied!",
    rating: "Rating",
    cancel: "Cancel",
},
```

- [ ] **Step 2: Add `deleteConfirm` and `deleteConfirmAction` to `wineModal` in `en.ts`**

In the `wineModal` object, add:
```ts
wineModal: {
    tastingNotes: "Tasting Notes",
    deleteConfirm: "Delete this wine?",
    deleteConfirmAction: "Yes, delete",
},
```

- [ ] **Step 3: Verify TypeScript is happy**

```bash
npx tsc --noEmit
```

Expected: no errors. If errors appear, check for trailing commas and object structure.

- [ ] **Step 4: Commit**

```bash
git add lib/i18n/en.ts
git commit -m "feat: add delete confirmation i18n keys (en)"
```

---

### Task 2: Add i18n keys (French)

**Files:**
- Modify: `lib/i18n/fr.ts`

- [ ] **Step 1: Add `common.cancel` to `fr.ts`**

Open `lib/i18n/fr.ts`. In the `common` object, add after `rating`:

```ts
cancel: "Annuler",
```

- [ ] **Step 2: Add `deleteConfirm` and `deleteConfirmAction` to `wineModal` in `fr.ts`**

```ts
wineModal: {
    tastingNotes: "Notes de dégustation",
    deleteConfirm: "Supprimer ce vin ?",
    deleteConfirmAction: "Oui, supprimer",
},
```

- [ ] **Step 3: Verify TypeScript is happy**

`fr.ts` uses `satisfies typeof en` — if any key is missing or misspelled, TypeScript will error.

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/i18n/fr.ts
git commit -m "feat: add delete confirmation i18n keys (fr)"
```

---

### Task 3: Add confirmation dialog to WineModal

**Files:**
- Modify: `components/WineModal.tsx`

- [ ] **Step 1: Add `AnimatePresence` to the framer-motion import**

Current import on line 8:
```ts
import { motion } from "framer-motion";
```

Change to:
```ts
import { motion, AnimatePresence } from "framer-motion";
```

- [ ] **Step 2: Add `confirmingDelete` and `deleting` state**

Inside `WineModal`, after the existing `const [copied, setCopied]` line, add:

```ts
const [confirmingDelete, setConfirmingDelete] = React.useState(false);
const [deleting, setDeleting] = React.useState(false);
```

- [ ] **Step 3: Add Escape key handler**

After the state declarations, add a `useEffect` that listens for Escape while the confirmation is open:

```ts
React.useEffect(() => {
    if (!confirmingDelete) return;
    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape" && !deleting) {
            setConfirmingDelete(false);
        }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
}, [confirmingDelete, deleting]);
```

- [ ] **Step 4: Update `handleDelete` to set `deleting` state**

Current `handleDelete`:
```ts
async function handleDelete() {
    await deleteWine(wine.id);
    onClose();
    onDelete?.();
}
```

Replace with:
```ts
async function handleDelete() {
    setDeleting(true);
    await deleteWine(wine.id);
    onClose();
    onDelete?.();
}
```

- [ ] **Step 5: Guard the outer backdrop click**

The outer backdrop `motion.div` currently has `onClick={onClose}`. When the confirmation dialog is open, clicking the backdrop should do nothing (the confirmation's own backdrop handles the click).

Change:
```tsx
onClick={onClose}
```
to:
```tsx
onClick={confirmingDelete ? undefined : onClose}
```

- [ ] **Step 6: Change the Delete button to open the confirmation instead of deleting**

Current delete button (around line 141):
```tsx
onClick={handleDelete}
```

Change to:
```tsx
onClick={() => setConfirmingDelete(true)}
```

- [ ] **Step 7: Add the confirmation dialog**

At the very end of the returned JSX, just before the closing `</>`, add the `AnimatePresence` block:

```tsx
<AnimatePresence>
    {confirmingDelete && (
        <>
            <motion.div
                key="confirm-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-[60]"
                onClick={() => {
                    if (!deleting) setConfirmingDelete(false);
                }}
            />
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                    key="confirm-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl pointer-events-auto"
                >
                    <p className="text-zinc-900 dark:text-white font-semibold text-lg mb-6">
                        {t.wineModal.deleteConfirm}
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => setConfirmingDelete(false)}
                            disabled={deleting}
                        >
                            {t.common.cancel}
                        </Button>
                        <Button
                            className="bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? "..." : t.wineModal.deleteConfirmAction}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </>
    )}
</AnimatePresence>
```

- [ ] **Step 8: Verify TypeScript and lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: no errors.

- [ ] **Step 9: Manual smoke test**

Start the dev server: `npm run dev`

1. Open the app, log in, open a wine's modal.
2. Click Delete — confirm the confirmation dialog animates in.
3. Click Cancel — confirm the dialog dismisses and the modal stays open.
4. Click Delete again, press Escape — confirm the dialog dismisses.
5. Click Delete again, click the confirmation backdrop — confirm the dialog dismisses.
6. Click Delete, click "Yes, delete" — confirm the wine is deleted and the modal closes.
7. Switch language to French, repeat step 6 — confirm all strings appear in French.

- [ ] **Step 10: Commit**

```bash
git add components/WineModal.tsx
git commit -m "feat: add delete confirmation dialog to WineModal"
```
