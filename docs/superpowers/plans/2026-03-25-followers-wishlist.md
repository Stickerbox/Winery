# Followers, Wishlist & Profile Share Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the wishlist feature (add wines from following feed, manage in a dedicated tab, move to collection), profile share link (copy button in Dashboard header and on own profile page), leveraging the already-built follow/profile infrastructure.

**Architecture:** New `WishlistItem` Prisma model stores snapshots of followed users' wines (no rating). Server actions handle wishlist CRUD plus a `moveToCollection` action. `WineForm` gains `initialValues`, `skipAnalysis`, and `onSubmit` props to support the "Move to Collection" flow. `WishlistGrid` is a new component. `FollowingFeed`, `Dashboard`, `ProfileView`, and `page.tsx` are extended minimally.

**Tech Stack:** Next.js 15 App Router, Prisma + SQLite, Tailwind CSS v4, Framer Motion, lucide-react, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-25-followers-wishlist-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `WishlistItem` model + `User.wishlist` relation |
| `lib/i18n/en.ts` | Modify | Add `wishlist.*`, `profile.copyLink`, `dashboard.shareTitle` |
| `lib/i18n/fr.ts` | Modify | Same additions in French (must update simultaneously — `satisfies typeof en`) |
| `app/actions.ts` | Modify | Add `addToWishlist`, `removeFromWishlist`, `getWishlist`, `moveToCollection` |
| `components/WineForm.tsx` | Modify | Add `initialValues`, `skipAnalysis`, `onSubmit` props; fix state machine for pre-fill |
| `components/WishlistGrid.tsx` | Create | Card grid for wishlist items with Remove + Move to Collection |
| `components/FollowingFeed.tsx` | Modify | Add bookmark button per card; accept `wishlistedKeys: Set<string>` prop |
| `app/page.tsx` | Modify | Add `getWishlist()` to `Promise.all`; pass `wishlistItems` to `Dashboard` |
| `components/Dashboard.tsx` | Modify | Accept `wishlistItems`; compute `wishlistedKeys`; render `WishlistGrid`; add share button |
| `components/ProfileView.tsx` | Modify | Add copy-link button when viewing own profile |

---

## Task 1: Prisma Schema + Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update schema**

Open `prisma/schema.prisma`. Add `wishlist WishlistItem[]` to the `User` model and append the `WishlistItem` model at the end of the file:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  createdAt DateTime @default(now())
  wines     Wine[]
  following Follow[] @relation("UserFollowers")
  followers Follow[] @relation("UserFollowing")
  wishlist  WishlistItem[]
}

model WishlistItem {
  id              Int      @id @default(autoincrement())
  userId          Int
  user            User     @relation(fields: [userId], references: [id])
  name            String
  description     String
  imagePath       String?
  addedByUsername String
  createdAt       DateTime @default(now())

  @@unique([userId, name, addedByUsername])
}
```

Notes:
- `imagePath` is nullable — the snapshot references the original owner's file, which may be deleted later. `WishlistGrid` must handle `null` with a placeholder.
- Unique constraint on `[userId, name, addedByUsername]` prevents duplicate wishlist adds.

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add-wishlist
npx prisma generate
```

Expected output: `✔ Generated Prisma Client` with no errors.

- [ ] **Step 3: Verify schema compiles**

```bash
npm run build 2>&1 | head -20
```

Expected: No Prisma-related errors. TypeScript errors in other files at this stage are acceptable — they'll be fixed in later tasks.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add WishlistItem prisma model and migration"
```

---

## Task 2: i18n Additions

**Files:**
- Modify: `lib/i18n/en.ts`
- Modify: `lib/i18n/fr.ts`

**Important:** `fr.ts` ends with `} satisfies typeof en;` — both files must be updated together or the TypeScript build will fail.

- [ ] **Step 1: Update `lib/i18n/en.ts`**

Add `copyLink` to the `profile` block (after `wineCount`):
```ts
  profile: {
    follow: "Follow",
    unfollow: "Unfollow",
    wineCount: "{count} wines",
    copyLink: "Copy Profile Link",
  },
```

Add `shareTitle` to the `dashboard` block (after `addWineTitle`):
```ts
    addWineTitle: "Add Wine",
    shareTitle: "Share Profile",
```

Add a new `wishlist` namespace after the `feed` block (before the closing `};`):
```ts
  wishlist: {
    addToWishlist: "Add to Wishlist",
    wishlisted: "Wishlisted",
    removeFromWishlist: "Remove",
    moveToCollection: "Move to Collection",
    empty: "Your wishlist is empty. Browse the Following tab to save wines.",
    by: "by {username}",
  },
```

- [ ] **Step 2: Update `lib/i18n/fr.ts`**

Add `copyLink` to the `profile` block:
```ts
  profile: {
    follow: "Suivre",
    unfollow: "Ne plus suivre",
    wineCount: "{count} vins",
    copyLink: "Copier le lien du profil",
  },
```

Add `shareTitle` to the `dashboard` block (after `addWineTitle`):
```ts
    addWineTitle: "Ajouter un vin",
    shareTitle: "Partager le profil",
```

Add a new `wishlist` namespace after the `feed` block:
```ts
  wishlist: {
    addToWishlist: "Ajouter à la liste de souhaits",
    wishlisted: "Ajouté",
    removeFromWishlist: "Supprimer",
    moveToCollection: "Ajouter à la collection",
    empty: "Votre liste de souhaits est vide. Parcourez l'onglet Abonnements pour sauvegarder des vins.",
    by: "par {username}",
  },
```

- [ ] **Step 3: Verify both files compile**

```bash
npm run lint
```

Expected: no type errors. If `fr.ts` errors about missing keys, check both files are in sync.

- [ ] **Step 4: Commit**

```bash
git add lib/i18n/en.ts lib/i18n/fr.ts
git commit -m "feat: add wishlist and profile share i18n keys (en + fr)"
```

---

## Task 3: Server Actions — Wishlist CRUD

**Files:**
- Modify: `app/actions.ts`

Add four new exported server actions after the existing `unfollowUser` action (around line 232). All mutating actions must call `revalidatePath("/")`.

- [ ] **Step 1: Add `addToWishlist`**

```ts
export async function addToWishlist(wineId: number, addedByUsername: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

    const wine = await prisma.wine.findUnique({ where: { id: wineId } });
    if (!wine) throw new Error("Wine not found");

    try {
        await prisma.wishlistItem.create({
            data: {
                userId: currentUser.id,
                name: wine.name,
                description: wine.description,
                imagePath: wine.imagePath,
                addedByUsername,
            },
        });
    } catch {
        // Unique constraint violation — already wishlisted, treat as no-op
    }
    revalidatePath("/");
}
```

- [ ] **Step 2: Add `removeFromWishlist`**

```ts
export async function removeFromWishlist(itemId: number) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

    // deleteMany used for owner check — does NOT delete image files;
    // imagePath is a snapshot of the original owner's file.
    await prisma.wishlistItem.deleteMany({
        where: { id: itemId, userId: currentUser.id },
    });
    revalidatePath("/");
}
```

- [ ] **Step 3: Add `getWishlist`**

```ts
export async function getWishlist() {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];

    return await prisma.wishlistItem.findMany({
        where: { userId: currentUser.id },
        orderBy: { createdAt: "desc" },
    });
}
```

- [ ] **Step 4: Add `moveToCollection`**

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

    // Write image first (outside transaction — same pattern as addWine)
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
    const imagePath = `/uploads/${filename}`;

    // Atomically create Wine + delete WishlistItem
    await prisma.$transaction([
        prisma.wine.create({
            data: { name, description, rating, imagePath, userId: currentUser.id },
        }),
        prisma.wishlistItem.delete({ where: { id: itemId } }),
    ]);

    revalidatePath("/");
}
```

- [ ] **Step 5: Verify lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/actions.ts
git commit -m "feat: add wishlist server actions (addToWishlist, removeFromWishlist, getWishlist, moveToCollection)"
```

---

## Task 4: WineForm — Pre-fill, Skip Analysis, Custom Submit

**Files:**
- Modify: `components/WineForm.tsx`

Three additions: new props + updated phase/state initialization, skip-analysis path in `handleImageChange`, and custom submit override.

- [ ] **Step 1: Update the props interface and function signature**

Replace line 18 (`export function WineForm({ onSuccess }: { onSuccess?: () => void }) {`) with:

```ts
interface WineFormProps {
    onSuccess?: () => void;
    initialValues?: { name: string; description: string };
    skipAnalysis?: boolean;
    onSubmit?: (formData: FormData) => Promise<void>;
}

export function WineForm({ onSuccess, initialValues, skipAnalysis, onSubmit }: WineFormProps) {
```

- [ ] **Step 2: Update state initialization to use `initialValues`**

Replace lines 20–24 (the `useState` declarations):

```ts
    const [phase, setPhase] = React.useState<Phase>(initialValues ? "review" : "capture");
    const [rating, setRating] = React.useState(0);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [name, setName] = React.useState(initialValues?.name ?? "");
    const [description, setDescription] = React.useState(initialValues?.description ?? "");
```

- [ ] **Step 3: Update `handleImageChange` to skip analysis when `skipAnalysis` is true**

Replace the block starting at `setPhase("analyzing");` through the closing `}` of the try/catch (lines 48–59) with:

```ts
        if (skipAnalysis) {
            setPhase("review");
        } else {
            setPhase("analyzing");
            try {
                const fd = new FormData();
                fd.append("image", compressedFileRef.current);
                const result = await analyzeWineImage(fd);
                setName(result.name);
                setDescription(result.description);
            } catch (err) {
                console.error("Wine analysis failed:", err);
            } finally {
                setPhase("review");
            }
        }
```

- [ ] **Step 4: Update `handleSubmit` to use `onSubmit` override when provided**

Replace the `startTransition` block (lines 69–85) with:

```ts
    startTransition(async () => {
        try {
            if (onSubmit) {
                await onSubmit(formData);
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
```

- [ ] **Step 5: Fix the image area click guard and height animation**

On line 92, change:
```ts
animate={{ height: phase === "capture" ? 240 : 144 }}
```
to:
```ts
animate={{ height: !imagePreview ? 240 : 144 }}
```

On line 98, change:
```ts
onClick={() => phase === "capture" && fileInputRef.current?.click()}
```
to:
```ts
onClick={() => !imagePreview && fileInputRef.current?.click()}
```

This ensures that when opened in `"review"` phase with no image yet (the "Move to Collection" case), the upload area is clickable at full height.

- [ ] **Step 6: Verify lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/WineForm.tsx
git commit -m "feat: add initialValues/skipAnalysis/onSubmit props to WineForm"
```

---

## Task 5: WishlistGrid Component

**Files:**
- Create: `components/WishlistGrid.tsx`

Displays wishlist items in a card grid. Each card has Remove (trash icon) and "Move to Collection" buttons. Clicking "Move to Collection" opens the `WineForm` in a modal (same modal pattern as Dashboard), pre-filled and with `skipAnalysis`.

- [ ] **Step 1: Create `components/WishlistGrid.tsx`**

```tsx
"use client";

import * as React from "react";
import { WishlistItem } from "@prisma/client";
import { Trash2, BookmarkPlus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { removeFromWishlist, moveToCollection } from "@/app/actions";
import { WineForm } from "@/components/WineForm";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/components/LanguageContext";

interface WishlistGridProps {
    items: WishlistItem[];
}

export function WishlistGrid({ items }: WishlistGridProps) {
    const [movingItem, setMovingItem] = React.useState<WishlistItem | null>(null);
    const { t } = useTranslations();

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-center px-4">
                <p className="text-lg">{t.wishlist.empty}</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {items.map((item) => (
                    <div key={item.id} className="flex flex-col">
                        <div className="relative rounded-xl overflow-hidden bg-white/10 border border-white/20 aspect-[4/5]">
                            {item.imagePath ? (
                                <img
                                    src={item.imagePath}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                                    <BookmarkPlus className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                <p className="font-bold text-sm leading-tight line-clamp-2">{item.name}</p>
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 px-1">
                            {t.wishlist.by.replace("{username}", item.addedByUsername)}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 px-1 mt-0.5 line-clamp-2">
                            {item.description}
                        </p>
                        <div className="flex gap-2 mt-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 h-8 w-8"
                                title={t.wishlist.removeFromWishlist}
                                onClick={() => removeFromWishlist(item.id)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1 text-xs h-8 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950"
                                onClick={() => setMovingItem(item)}
                            >
                                {t.wishlist.moveToCollection}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Move to Collection Modal — same pattern as Dashboard's add-wine modal */}
            <AnimatePresence>
                {movingItem && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                            onClick={() => setMovingItem(null)}
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
                                    onClick={() => setMovingItem(null)}
                                >
                                    <X className="h-6 w-6" />
                                </Button>
                                <WineForm
                                    initialValues={{ name: movingItem.name, description: movingItem.description }}
                                    skipAnalysis={true}
                                    onSubmit={async (formData) => {
                                        await moveToCollection(movingItem.id, formData);
                                    }}
                                    onSuccess={() => setMovingItem(null)}
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
```

- [ ] **Step 2: Verify lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/WishlistGrid.tsx
git commit -m "feat: add WishlistGrid component with remove and move-to-collection"
```

---

## Task 6: FollowingFeed — Wishlist Bookmark Button

**Files:**
- Modify: `components/FollowingFeed.tsx`

Add a bookmark toggle button below each wine card. The button is one-way (add only — once wishlisted it stays filled; removing is done from the Wishlist tab).

- [ ] **Step 1: Rewrite `components/FollowingFeed.tsx`**

The composite key format is `${wine.name}::${wine.user.username}` — matching the `WishlistItem` unique constraint fields.

```tsx
"use client";

import * as React from "react";
import { Wine } from "@prisma/client";
import { WineCard } from "@/components/WineCard";
import { WineModal } from "@/components/WineModal";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "@/components/LanguageContext";
import { addToWishlist } from "@/app/actions";
import { Bookmark } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type FeedWine = Wine & { user: { username: string } };

interface FollowingFeedProps {
    wines: FeedWine[];
    wishlistedKeys: Set<string>;
}

export function FollowingFeed({ wines, wishlistedKeys }: FollowingFeedProps) {
    const [selectedWine, setSelectedWine] = React.useState<FeedWine | null>(null);
    const [localWishlisted, setLocalWishlisted] = React.useState<Set<string>>(new Set(wishlistedKeys));
    const { t } = useTranslations();

    // Sync if parent's wishlistedKeys changes (e.g. after server revalidation)
    React.useEffect(() => {
        setLocalWishlisted(new Set(wishlistedKeys));
    }, [wishlistedKeys]);

    async function handleWishlist(wine: FeedWine) {
        const key = `${wine.name}::${wine.user.username}`;
        if (localWishlisted.has(key)) return; // already wishlisted — no toggle
        setLocalWishlisted((prev) => new Set([...prev, key])); // optimistic
        try {
            await addToWishlist(wine.id, wine.user.username);
        } catch {
            // revert on failure
            setLocalWishlisted((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    }

    if (wines.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-center px-4">
                <p className="text-lg">{t.feed.empty}</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {wines.map((wine) => {
                    const key = `${wine.name}::${wine.user.username}`;
                    const isWishlisted = localWishlisted.has(key);
                    return (
                        <div key={wine.id}>
                            <WineCard
                                wine={wine}
                                onClick={() => setSelectedWine(wine)}
                                readonly
                            />
                            <div className="flex items-center justify-between mt-1 px-1">
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    <Link
                                        href={`/u/${wine.user.username}`}
                                        className="hover:underline hover:text-violet-600"
                                    >
                                        {t.feed.by.replace("{username}", wine.user.username)}
                                    </Link>
                                </p>
                                <button
                                    onClick={() => handleWishlist(wine)}
                                    title={isWishlisted ? t.wishlist.wishlisted : t.wishlist.addToWishlist}
                                    className={cn(
                                        "p-1 rounded transition-colors",
                                        isWishlisted
                                            ? "text-violet-600 dark:text-violet-400"
                                            : "text-zinc-400 hover:text-violet-500 dark:text-zinc-500 dark:hover:text-violet-400"
                                    )}
                                >
                                    <Bookmark className={cn("h-4 w-4", isWishlisted && "fill-current")} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            <AnimatePresence>
                {selectedWine && (
                    <WineModal
                        wine={selectedWine}
                        onClose={() => setSelectedWine(null)}
                        readonly
                    />
                )}
            </AnimatePresence>
        </>
    );
}
```

- [ ] **Step 2: Verify lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/FollowingFeed.tsx
git commit -m "feat: add wishlist bookmark button to FollowingFeed"
```

---

## Task 7: Dashboard + page.tsx Wiring

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/Dashboard.tsx`

- [ ] **Step 1: Update `app/page.tsx`**

Replace the entire file with:

```ts
import { getWines, getFollowingFeed, getWishlist } from "./actions";
import { getCurrentUser } from "./auth-actions";
import { Dashboard } from "@/components/Dashboard";
import { redirect } from "next/navigation";

export default async function Home() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const [wines, feedWines, wishlistItems] = await Promise.all([
        getWines(),
        getFollowingFeed(),
        getWishlist(),
    ]);

    return <Dashboard wines={wines} user={user} feedWines={feedWines} wishlistItems={wishlistItems} />;
}
```

- [ ] **Step 2: Update imports in `components/Dashboard.tsx`**

Update the lucide-react import line to add `Check` and rename `Link` import to avoid collision with Next.js `Link`:

```ts
import { Plus, X, LogOut, Search, Wine as WineIcon, Users, Bookmark, Check, Link as LinkIcon } from "lucide-react";
```

Add two new imports after the existing component imports:

```ts
import { WishlistGrid } from "@/components/WishlistGrid";
import { WishlistItem } from "@prisma/client";
```

- [ ] **Step 3: Update `DashboardProps` and function signature**

Replace:
```ts
interface DashboardProps {
    wines: Wine[];
    user: User;
    feedWines: FeedWine[];
}

export function Dashboard({ wines, user, feedWines }: DashboardProps) {
```

With:
```ts
interface DashboardProps {
    wines: Wine[];
    user: User;
    feedWines: FeedWine[];
    wishlistItems: WishlistItem[];
}

export function Dashboard({ wines, user, feedWines, wishlistItems }: DashboardProps) {
```

- [ ] **Step 4: Add `wishlistedKeys` and `copied` state inside the component body**

After the existing `React.useState` / `React.useRef` declarations, add:

```ts
    const [copied, setCopied] = React.useState(false);

    const wishlistedKeys = React.useMemo(
        () => new Set(wishlistItems.map((i) => `${i.name}::${i.addedByUsername}`)),
        [wishlistItems]
    );

    function handleCopyProfileLink() {
        const url = `${window.location.origin}/u/${user.username}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {});
    }
```

- [ ] **Step 5: Add share button to the header**

In the header's button row (near the logout form), add the share button before the logout form:

```tsx
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            onClick={handleCopyProfileLink}
                            title={t.dashboard.shareTitle}
                        >
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <LinkIcon className="h-4 w-4" />}
                        </Button>
```

- [ ] **Step 6: Update the tab content renders**

Replace:
```tsx
                {activeTab === "following" && <FollowingFeed wines={feedWines} />}
                {activeTab === "wishlist" && null}
```

With:
```tsx
                {activeTab === "following" && <FollowingFeed wines={feedWines} wishlistedKeys={wishlistedKeys} />}
                {activeTab === "wishlist" && <WishlistGrid items={wishlistItems} />}
```

- [ ] **Step 7: Verify lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add app/page.tsx components/Dashboard.tsx
git commit -m "feat: wire wishlist tab and share button in Dashboard"
```

---

## Task 8: ProfileView — Copy-Link for Own Profile

**Files:**
- Modify: `components/ProfileView.tsx`

- [ ] **Step 1: Update imports**

Add to the import section:
```ts
import { Check, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
```

- [ ] **Step 2: Add `copied` state and handler inside the component**

After `const [selectedWine, ...]`, add:

```ts
    const [copied, setCopied] = React.useState(false);
    const isOwnProfile = currentUserId === profile.id;

    function handleCopyLink() {
        const url = `${window.location.origin}/u/${profile.username}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {});
    }
```

- [ ] **Step 3: Update the header action area**

Replace:
```tsx
                    {showFollowButton && (
                        <FollowButton
                            userId={profile.id}
                            initialIsFollowing={initialIsFollowing}
                        />
                    )}
```

With:
```tsx
                    <div className="flex items-center gap-2">
                        {isOwnProfile && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                                onClick={handleCopyLink}
                                title={t.profile.copyLink}
                            >
                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <LinkIcon className="h-4 w-4" />}
                            </Button>
                        )}
                        {showFollowButton && (
                            <FollowButton
                                userId={profile.id}
                                initialIsFollowing={initialIsFollowing}
                            />
                        )}
                    </div>
```

- [ ] **Step 4: Verify full build**

```bash
npm run lint && npm run build
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add components/ProfileView.tsx
git commit -m "feat: add copy-link button to own profile view"
```

---

## Task 9: Manual End-to-End Verification

No automated test framework is configured. Verify each feature manually.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Navigate to `http://localhost:3000`.

- [ ] **Step 2: Verify Following tab + wishlist button**

1. Log in and follow another user (via `/u/[username]`)
2. Go to the Following tab — their wines should appear with a bookmark icon below each card
3. Tap the bookmark — icon fills and turns violet
4. Tap again — stays filled (add-only, no toggle)

- [ ] **Step 3: Verify Wishlist tab**

1. Switch to the Wishlist tab — wishlisted wine(s) should appear
2. Cards show image (or placeholder if image is missing), name, description, "by username"
3. Trash icon removes the item from the wishlist
4. "Move to Collection" opens the WineForm pre-filled with name/description
5. Upload a new photo — no analyzing spinner appears (skipAnalysis works)
6. Set a rating and submit — item disappears from Wishlist, appears in Collection tab

- [ ] **Step 4: Verify share button in Dashboard header**

1. Click the link icon in the Dashboard header
2. Icon briefly shows a green checkmark
3. Paste clipboard — should be `http://localhost:3000/u/[your-username]`

- [ ] **Step 5: Verify share button on own profile**

1. Navigate to `/u/[your-username]`
2. A link icon button appears next to your username
3. Click it — green checkmark briefly, clipboard contains the profile URL
4. Navigate to another user's profile — link icon is NOT shown; Follow/Unfollow button IS shown

- [ ] **Step 6: Final commit (if any fixups needed)**

```bash
git add -p
git commit -m "fix: address any issues found during manual verification"
```
