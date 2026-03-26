# Add to Wishlist from + Button — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the user taps the floating `+` button, a picker popup appears letting them choose "Add to Collection" (existing flow) or "Add to Wishlist" (same photo flow, no rating field).

**Architecture:** Add a `mode` prop to `WineForm` that controls whether the rating field is shown and which server action is called. Replace Dashboard's `isAddOpen` boolean with an `addMode` state that also drives a new picker popup. Add a new `addToWishlistManual` server action. Extract shared image upload logic into a helper to avoid triplicating it.

**Tech Stack:** Next.js App Router, React, Prisma (SQLite), Framer Motion, Tailwind CSS v4, TypeScript

---

## File Map

| File | Change |
|---|---|
| `lib/i18n/en.ts` | Add 4 new string keys |
| `lib/i18n/fr.ts` | Add matching French translations |
| `app/actions.ts` | Extract `uploadWineImage` helper; add `addToWishlistManual` action |
| `components/WineForm.tsx` | Add `mode` prop; conditionalize rating + submit label + submit action |
| `components/Dashboard.tsx` | Replace `isAddOpen` with `addMode` + `isPickerOpen`; add picker popup UI; pass `mode` to `WineForm` |

---

## Task 1: Add i18n keys

**Files:**
- Modify: `lib/i18n/en.ts`
- Modify: `lib/i18n/fr.ts`

- [ ] **Step 1: Add keys to `lib/i18n/en.ts`**

Add to the `dashboard` section:
```ts
addToCollection: "Add to Collection",
addToWishlist: "Add to Wishlist",
```

Add to the `wineForm` section:
```ts
saveWishlist: "Add to Wishlist",
savingWishlist: "Adding...",
```

The full updated `en.ts`:
```ts
export const en = {
  common: {
    delete: "Delete",
    share: "Share",
    copied: "Copied!",
    rating: "Rating",
    cancel: "Cancel",
  },
  dashboard: {
    welcome: "Welcome, {username}",
    sortNewest: "Newest",
    sortOldest: "Oldest",
    sortRatingHigh: "Rating ↓",
    sortRatingLow: "Rating ↑",
    searchPlaceholder: "Search wines...",
    searchTitle: "Search",
    logoutTitle: "Logout",
    addWineTitle: "Add Wine",
    shareTitle: "Share Profile",
    tabCollection: "Collection",
    tabFollowing: "Following",
    tabWishlist: "Wishlist",
    addToCollection: "Add to Collection",
    addToWishlist: "Add to Wishlist",
  },
  wineForm: {
    takePhoto: "Take a photo of your wine",
    analyzing: "Identifying wine...",
    nameLabel: "Name",
    namePlaceholder: "e.g. Château Margaux",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Tasting notes, vintage, etc.",
    ratingLabel: "Rating",
    saving: "Adding Wine...",
    save: "Save to Collection",
    ratingRequired: "Please select a rating",
    saveFailed: "Failed to add wine",
    imageRequired: "Please take or upload a photo first",
    saveWishlist: "Add to Wishlist",
    savingWishlist: "Adding...",
  },
  wineModal: {
    tastingNotes: "Tasting Notes",
    deleteConfirm: "Delete this wine?",
    deleteConfirmAction: "Yes, delete",
    deleting: "Deleting…",
    deleteFailed: "Failed to delete wine",
    goToSAQ: "Go to SAQ",
    prevWine: "Previous wine",
    nextWine: "Next wine",
  },
  wineGrid: {
    emptyTitle: "No wines added yet.",
    emptySubtitle: "Click the + button to add your first bottle.",
  },
  login: {
    description: "Enter your username to access your personal wine collection",
    usernamePlaceholder: "Username",
    submit: "Start Collecting",
  },
  share: {
    sharedBy: "Shared by {username}",
    added: "Added {date}",
    viewCollection: "View your collection",
    addToMine: "Add to my wines",
    loginToAdd: "Log in to add to your wines",
  },
  profile: {
    follow: "Follow",
    unfollow: "Unfollow",
    wineCount: "{count} wines",
    copyLink: "Copy Profile Link",
  },
  feed: {
    empty: "Follow some users to see their wines here.",
    by: "by {username}",
  },
  wishlist: {
    addToWishlist: "Add to Wishlist",
    wishlisted: "Wishlisted",
    removeFromWishlist: "Remove from Wishlist",
    moveToCollection: "Move to Collection",
    empty: "Your wishlist is empty. Browse the Following tab to save wines.",
    by: "by {username}",
  },
};
```

- [ ] **Step 2: Add matching keys to `lib/i18n/fr.ts`**

Add to the `dashboard` section:
```ts
addToCollection: "Ajouter à la collection",
addToWishlist: "Ajouter à la liste de souhaits",
```

Add to the `wineForm` section:
```ts
saveWishlist: "Ajouter à la liste",
savingWishlist: "Ajout...",
```

The full updated `fr.ts`:
```ts
import type { en } from "./en";

export const fr = {
  common: {
    delete: "Supprimer",
    share: "Partager",
    copied: "Copié !",
    rating: "Note",
    cancel: "Annuler",
  },
  dashboard: {
    welcome: "Bienvenue, {username}",
    sortNewest: "Récent",
    sortOldest: "Ancien",
    sortRatingHigh: "Note ↓",
    sortRatingLow: "Note ↑",
    searchPlaceholder: "Rechercher des vins...",
    searchTitle: "Rechercher",
    logoutTitle: "Déconnexion",
    addWineTitle: "Ajouter un vin",
    shareTitle: "Partager le profil",
    tabCollection: "Collection",
    tabFollowing: "Abonnements",
    tabWishlist: "Liste de souhaits",
    addToCollection: "Ajouter à la collection",
    addToWishlist: "Ajouter à la liste de souhaits",
  },
  wineForm: {
    takePhoto: "Prenez une photo de votre vin",
    analyzing: "Identification du vin...",
    nameLabel: "Nom",
    namePlaceholder: "ex. Château Margaux",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Notes de dégustation, millésime, etc.",
    ratingLabel: "Note",
    saving: "Ajout en cours...",
    save: "Sauvegarder dans la collection",
    ratingRequired: "Veuillez sélectionner une note",
    saveFailed: "Échec de l'ajout du vin",
    imageRequired: "Veuillez d'abord prendre ou télécharger une photo",
    saveWishlist: "Ajouter à la liste",
    savingWishlist: "Ajout...",
  },
  wineModal: {
    tastingNotes: "Notes de dégustation",
    deleteConfirm: "Supprimer ce vin ?",
    deleteConfirmAction: "Oui, supprimer",
    deleting: "Suppression…",
    deleteFailed: "Échec de la suppression",
    goToSAQ: "Aller sur SAQ",
    prevWine: "Vin précédent",
    nextWine: "Vin suivant",
  },
  wineGrid: {
    emptyTitle: "Aucun vin ajouté pour l'instant.",
    emptySubtitle: "Cliquez sur le bouton + pour ajouter votre première bouteille.",
  },
  login: {
    description: "Entrez votre nom d'utilisateur pour accéder à votre collection de vins",
    usernamePlaceholder: "Nom d'utilisateur",
    submit: "Commencer à collecter",
  },
  share: {
    sharedBy: "Partagé par {username}",
    added: "Ajouté le {date}",
    viewCollection: "Voir votre collection",
    addToMine: "Ajouter à mes vins",
    loginToAdd: "Connectez-vous pour ajouter à vos vins",
  },
  profile: {
    follow: "Suivre",
    unfollow: "Ne plus suivre",
    wineCount: "{count} vins",
    copyLink: "Copier le lien du profil",
  },
  feed: {
    empty: "Suivez des utilisateurs pour voir leurs vins ici.",
    by: "par {username}",
  },
  wishlist: {
    addToWishlist: "Ajouter à la liste de souhaits",
    wishlisted: "Ajouté",
    removeFromWishlist: "Retirer de la liste de souhaits",
    moveToCollection: "Ajouter à la collection",
    empty: "Votre liste de souhaits est vide. Parcourez l'onglet Abonnements pour sauvegarder des vins.",
    by: "par {username}",
  },
} satisfies typeof en;
```

- [ ] **Step 3: Verify TypeScript is happy**

```bash
npx tsc --noEmit
```

Expected: no errors related to i18n files (`fr.ts` uses `satisfies typeof en` so missing keys will error here).

- [ ] **Step 4: Commit**

```bash
git add lib/i18n/en.ts lib/i18n/fr.ts
git commit -m "feat: add i18n keys for wishlist add flow"
```

---

## Task 2: Extract image upload helper and add `addToWishlistManual` action

**Files:**
- Modify: `app/actions.ts`

The image upload logic (sharp compress + write to `public/uploads/`) is currently duplicated between `addWine` and `moveToCollection`. Adding a third copy for `addToWishlistManual` would be a DRY violation. Extract it first, then add the new action.

- [ ] **Step 1: Extract `uploadWineImage` helper inside `app/actions.ts`**

Add this private helper function above `addWine` (after the imports):

```ts
async function uploadWineImage(image: File): Promise<string> {
    const buffer = Buffer.from(await image.arrayBuffer());
    const filename = `${randomUUID()}.jpg`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    try {
        await fs.access(uploadDir);
    } catch {
        await fs.mkdir(uploadDir, { recursive: true });
    }

    const compressed = await sharp(buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

    await fs.writeFile(path.join(uploadDir, filename), compressed);
    return `/uploads/${filename}`;
}
```

- [ ] **Step 2: Refactor `addWine` to use `uploadWineImage`**

Replace the image upload block inside `addWine` with a call to the helper. The full updated `addWine`:

```ts
export async function addWine(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const rating = parseInt(formData.get("rating") as string);
    const image = formData.get("image") as File;

    if (!name || !description || !rating || !image) {
        throw new Error("Missing required fields");
    }

    const imagePath = await uploadWineImage(image);

    await prisma.wine.create({
        data: {
            name,
            description,
            rating,
            imagePath,
            userId: user.id,
        },
    });

    revalidatePath("/");
}
```

- [ ] **Step 3: Refactor `moveToCollection` to use `uploadWineImage`**

Replace the image upload block inside `moveToCollection`. The full updated function:

```ts
export async function moveToCollection(itemId: number, formData: FormData) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

    const item = await prisma.wishlistItem.findUnique({ where: { id: itemId } });
    if (!item || item.userId !== currentUser.id) throw new Error("Not found");

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const rating = parseInt(formData.get("rating") as string);
    const image = formData.get("image") as File;

    if (!name || !description || !rating || !image) {
        throw new Error("Missing required fields");
    }

    let imagePath: string | null = null;

    try {
        imagePath = await uploadWineImage(image);

        await prisma.$transaction([
            prisma.wine.create({
                data: { name, description, rating, imagePath, userId: currentUser.id },
            }),
            prisma.wishlistItem.delete({ where: { id: itemId } }),
        ]);
    } catch (e) {
        if (imagePath) {
            await fs.unlink(path.join(process.cwd(), "public", imagePath)).catch(() => {});
        }
        throw e;
    }

    revalidatePath("/");
}
```

- [ ] **Step 4: Add `addToWishlistManual` server action**

Add after `addWine`:

```ts
export async function addToWishlistManual(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const image = formData.get("image") as File;

    if (!name || !description || !image) {
        throw new Error("Missing required fields");
    }

    const imagePath = await uploadWineImage(image);

    try {
        await prisma.wishlistItem.create({
            data: {
                userId: user.id,
                name,
                description,
                imagePath,
                addedByUsername: user.username,
            },
        });
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            // Already on wishlist — no-op
            return;
        }
        throw e;
    }

    revalidatePath("/");
}
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/actions.ts
git commit -m "feat: add addToWishlistManual action, extract uploadWineImage helper"
```

---

## Task 3: Update `WineForm` with `mode` prop

**Files:**
- Modify: `components/WineForm.tsx`

- [ ] **Step 1: Add `mode` to props interface and import `addToWishlistManual`**

Update the import line and interface:

```ts
import { addWine, analyzeWineImage, addToWishlistManual } from "@/app/actions";
```

Update `WineFormProps`:

```ts
interface WineFormProps {
    onSuccess?: () => void;
    initialValues?: { name: string; description: string };
    skipAnalysis?: boolean;
    onSubmit?: (formData: FormData) => Promise<void>;
    mode?: "collection" | "wishlist";
}
```

Update the function signature:

```ts
export function WineForm({ onSuccess, initialValues, skipAnalysis, onSubmit, mode = "collection" }: WineFormProps) {
```

- [ ] **Step 2: Update `handleSubmit` to respect `mode`**

Replace the existing `handleSubmit` function:

```ts
const handleSubmit = async (formData: FormData) => {
    if (!compressedFileRef.current) {
        alert(t.wineForm.imageRequired);
        return;
    }
    if (mode !== "wishlist" && rating === 0) {
        alert(t.wineForm.ratingRequired);
        return;
    }
    if (mode !== "wishlist") {
        formData.set("rating", rating.toString());
    }

    startTransition(async () => {
        try {
            if (onSubmit) {
                await onSubmit(formData);
            } else if (mode === "wishlist") {
                await addToWishlistManual(formData);
            } else {
                await addWine(formData);
            }
            setRating(0);
            setImagePreview(null);
            setName(initialValues?.name ?? "");
            setDescription(initialValues?.description ?? "");
            setPhase(initialValues ? "review" : "capture");
            compressedFileRef.current = null;
            if (fileInputRef.current) fileInputRef.current.value = "";
            onSuccess?.();
        } catch (error) {
            console.error(error);
            alert(t.wineForm.saveFailed);
        }
    });
};
```

- [ ] **Step 3: Update the review phase JSX**

Replace the `motion.div` containing the review fields (the entire `AnimatePresence` block starting at line ~150). Key changes: hide rating when `mode === "wishlist"`, update disabled condition, update button label.

```tsx
<AnimatePresence>
    {phase === "review" && (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
            className="space-y-3"
        >
            <div className="space-y-1">
                <label className="text-sm font-medium leading-none">{t.wineForm.nameLabel}</label>
                <Input
                    name="name"
                    placeholder={t.wineForm.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>

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

            {mode !== "wishlist" && (
                <div className="space-y-1">
                    <label className="text-sm font-medium leading-none">{t.wineForm.ratingLabel}</label>
                    <div className="flex justify-center py-1">
                        <RatingStar rating={rating} onRatingChange={setRating} className="gap-2" />
                    </div>
                </div>
            )}

            <Button
                type="submit"
                className="w-full"
                disabled={
                    isPending ||
                    !name.trim() ||
                    !description.trim() ||
                    (mode !== "wishlist" && rating === 0)
                }
            >
                {mode === "wishlist"
                    ? isPending ? t.wineForm.savingWishlist : t.wineForm.saveWishlist
                    : isPending ? t.wineForm.saving : t.wineForm.save}
            </Button>
        </motion.div>
    )}
</AnimatePresence>
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Start dev server and manually verify both form modes work**

```bash
npm run dev
```

Open http://localhost:3000. Temporarily hard-code `mode="wishlist"` on the `<WineForm>` in Dashboard to verify:
- Rating field is hidden
- Button reads "Add to Wishlist" (or "Ajouter à la liste" in French)
- Button stays disabled until name and description are filled
- Submitting creates a wishlist item and closes the modal

Then revert the hard-coded mode — it will be wired up in Task 4.

- [ ] **Step 6: Commit**

```bash
git add components/WineForm.tsx
git commit -m "feat: add mode prop to WineForm for wishlist flow"
```

---

## Task 4: Add picker popup to Dashboard

**Files:**
- Modify: `components/Dashboard.tsx`

- [ ] **Step 1: Replace `isAddOpen` state with `addMode` and `isPickerOpen`**

Remove:
```ts
const [isAddOpen, setIsAddOpen] = React.useState(false);
```

Add:
```ts
const [isPickerOpen, setIsPickerOpen] = React.useState(false);
const [addMode, setAddMode] = React.useState<"collection" | "wishlist" | null>(null);
```

- [ ] **Step 2: Update the floating `+` button**

Replace the existing `+` button (currently `onClick={() => setIsAddOpen(true)}`):

```tsx
{/* Floating Add Button */}
<button
    onClick={() => setIsPickerOpen((prev) => !prev)}
    className="fixed bottom-32 sm:bottom-6 right-6 z-30 h-14 w-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-2xl font-light"
    title={t.dashboard.addWineTitle}
>
    <Plus className="h-6 w-6" />
</button>
```

- [ ] **Step 3: Add the picker popup**

Add the picker popup block immediately **before** the existing `{/* Add Wine Modal */}` block:

```tsx
{/* Add Picker Popup */}
<AnimatePresence>
    {isPickerOpen && (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-30"
                onClick={() => setIsPickerOpen(false)}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 8 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-48 sm:bottom-24 right-6 z-40 flex flex-col gap-2 items-end"
            >
                <button
                    onClick={() => { setIsPickerOpen(false); setAddMode("collection"); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-zinc-800 shadow-lg text-sm font-medium text-zinc-800 dark:text-white hover:bg-violet-50 dark:hover:bg-violet-950 border border-white/30 dark:border-white/20 transition-colors whitespace-nowrap"
                >
                    🍷 {t.dashboard.addToCollection}
                </button>
                <button
                    onClick={() => { setIsPickerOpen(false); setAddMode("wishlist"); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-zinc-800 shadow-lg text-sm font-medium text-zinc-800 dark:text-white hover:bg-violet-50 dark:hover:bg-violet-950 border border-white/30 dark:border-white/20 transition-colors whitespace-nowrap"
                >
                    🔖 {t.dashboard.addToWishlist}
                </button>
            </motion.div>
        </>
    )}
</AnimatePresence>
```

- [ ] **Step 4: Update the Add Wine Modal to use `addMode`**

Replace the existing `{/* Add Wine Modal */}` block. Change `isAddOpen` → `addMode !== null`, and pass `mode` + updated `onSuccess`:

```tsx
{/* Add Wine Modal */}
<AnimatePresence>
    {addMode !== null && (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                onClick={() => setAddMode(null)}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
                <div className="w-full max-w-sm pointer-events-auto relative max-h-[90vh] overflow-y-auto rounded-2xl">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute -top-12 right-0 text-white hover:bg-white/20 rounded-full"
                        onClick={() => setAddMode(null)}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                    <WineForm mode={addMode} onSuccess={() => setAddMode(null)} />
                </div>
            </motion.div>
        </>
    )}
</AnimatePresence>
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors. If there are errors about unused `isAddOpen`, confirm all references have been replaced.

- [ ] **Step 6: Manual end-to-end verification**

Start the dev server if not running:
```bash
npm run dev
```

Check all of the following:

**Picker popup:**
- Tapping `+` shows the picker with two options
- Tapping backdrop dismisses the picker without opening the form
- Tapping `+` again while picker is open dismisses it (toggle)

**Add to Collection flow:**
- Tap `+` → "Add to Collection" → form opens
- Take photo → AI analyzes → review phase shows name, description, AND rating
- Button reads "Save to Collection" and is disabled until name, description, and rating are all filled
- Submit adds wine to collection, modal closes

**Add to Wishlist flow:**
- Tap `+` → "Add to Wishlist" → form opens
- Take photo → AI analyzes → review phase shows name and description only (no rating stars)
- Button reads "Add to Wishlist" and is disabled until name and description are filled
- Submit adds item to wishlist, modal closes, item appears in Wishlist tab

**French locale:**
- If browser is set to French, all new strings appear in French

- [ ] **Step 7: Commit**

```bash
git add components/Dashboard.tsx
git commit -m "feat: add picker popup to + button for collection vs wishlist flow"
```
