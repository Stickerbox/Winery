# Edit Button Label + Collapsible Tasting Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a visible "Edit" label to the WineModal edit button, and make the Tasting Notes textarea in WineForm collapsible (collapsed by default).

**Architecture:** Two independent single-file changes. Task 1 tweaks one button in `WineModal.tsx`. Task 2 adds a toggle state and animated collapse to the description field in `WineForm.tsx`. No new files, no shared logic.

**Tech Stack:** React 19, TypeScript, Framer Motion (already in use), lucide-react (already in use), Tailwind CSS v4.

---

## Files

| File | Change |
|---|---|
| `components/WineModal.tsx` | Remove `size="icon"` and `aria-label`, add text label to Edit button |
| `components/WineForm.tsx` | Add `isDescriptionOpen` state, collapsible toggle header, AnimatePresence wrap |

---

### Task 1: Edit button label in WineModal

**Files:**
- Modify: `components/WineModal.tsx` (the Edit button in the normal-mode footer, around line 390)

- [ ] **Step 1: Update the Edit button**

Find this block in `components/WineModal.tsx`:
```tsx
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-full text-zinc-500 dark:text-white/60"
                                                        onClick={startEditing}
                                                        aria-label={t.wineModal.edit}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
```
Replace with:
```tsx
                                                    <Button
                                                        variant="ghost"
                                                        className="gap-2 text-zinc-500 dark:text-white/60"
                                                        onClick={startEditing}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        {t.wineModal.edit}
                                                    </Button>
```

Changes made:
- Removed `size="icon"` (was constraining button to a square)
- Removed `aria-label` (redundant with visible text)
- Removed `rounded-full` (pill shape looks odd with text; default button shape is fine)
- Added `gap-2` for icon-text spacing
- Added `{t.wineModal.edit}` after the icon (`"Edit"` in English, `"Modifier"` in French — key already exists in both i18n files)

- [ ] **Step 2: Verify lint and build**

```bash
cd /Users/jordandixon/Developer/Web/Test && npm run lint && npm run build
```
Expected: 0 errors, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/WineModal.tsx
git commit -m "feat: add text label to WineModal edit button"
```

---

### Task 2: Collapsible tasting notes in WineForm

**Files:**
- Modify: `components/WineForm.tsx`

- [ ] **Step 1: Add ChevronRight and ChevronDown to the lucide-react import**

Find this import at the top of `components/WineForm.tsx`:
```ts
import { Camera } from "lucide-react";
```
Replace with:
```ts
import { Camera, ChevronRight, ChevronDown } from "lucide-react";
```

- [ ] **Step 2: Add `isDescriptionOpen` state**

Find this block of state declarations:
```ts
    const [name, setName] = React.useState(initialValues?.name ?? "");
    const [description, setDescription] = React.useState(initialValues?.description ?? "");
    const [notes, setNotes] = React.useState("");
```
Replace with:
```ts
    const [name, setName] = React.useState(initialValues?.name ?? "");
    const [description, setDescription] = React.useState(initialValues?.description ?? "");
    const [notes, setNotes] = React.useState("");
    const [isDescriptionOpen, setIsDescriptionOpen] = React.useState(false);
```

- [ ] **Step 3: Replace the description field with a collapsible version**

Find this entire block:
```tsx
                                <div className="space-y-1">
                                    <label className="text-sm font-medium leading-none">{t.wineForm.descriptionLabel}</label>
                                    <Textarea
                                        name="description"
                                        placeholder={t.wineForm.descriptionPlaceholder}
                                        className="min-h-[60px]"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                    />
                                </div>
```
Replace with:
```tsx
                                <div className="space-y-1">
                                    <button
                                        type="button"
                                        className="flex items-center justify-between w-full text-sm font-medium leading-none"
                                        onClick={() => setIsDescriptionOpen((o) => !o)}
                                    >
                                        {t.wineForm.descriptionLabel}
                                        {isDescriptionOpen
                                            ? <ChevronDown className="h-4 w-4 text-zinc-400" />
                                            : <ChevronRight className="h-4 w-4 text-zinc-400" />
                                        }
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {isDescriptionOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                style={{ overflow: "hidden" }}
                                            >
                                                <Textarea
                                                    name="description"
                                                    placeholder={t.wineForm.descriptionPlaceholder}
                                                    className="min-h-[60px]"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
```

Notes:
- `type="button"` on the toggle prevents it from accidentally submitting the form
- `AnimatePresence initial={false}` skips the entry animation on first render (section starts collapsed, no animation needed)
- `style={{ overflow: "hidden" }}` on the motion.div prevents the textarea from peeking out during the collapse animation
- `required` is removed from the Textarea since it's conditionally rendered (the Save button's existing disabled guard `!description.trim()` already prevents submitting without a value)

- [ ] **Step 4: Verify lint and build**

```bash
cd /Users/jordandixon/Developer/Web/Test && npm run lint && npm run build
```
Expected: 0 errors, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add components/WineForm.tsx
git commit -m "feat: make tasting notes collapsible in WineForm, collapsed by default"
```
