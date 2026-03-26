# UI Changes — March 2026 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement five UI improvements: background gradient fix, i18n label updates, date section headers on wine grids, wishlist pill on WineModal, wishlist card click + pill, and profile page layout restructure.

**Architecture:** Changes are isolated by file with no new dependencies. A shared `groupWinesByMonth(wines, locale)` utility drives date grouping in WineGrid and FollowingFeed. WineModal gains optional `isWishlisted`/`onWishlistToggle` props for the pill; callers opt in. ProfileView gains wishlistItems prop fed from the server page.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4, Prisma (SQLite), Framer Motion, lucide-react, `lib/i18n` for translations.

---

## File Map

| File | Role |
|------|------|
| `app/globals.css` | Add `background-attachment: fixed` to gradient |
| `lib/i18n/en.ts` | Update `wishlist.removeFromWishlist` label |
| `lib/i18n/fr.ts` | Update `wishlist.removeFromWishlist` label (French) |
| `lib/utils.ts` | Add `groupWinesByMonth` utility |
| `components/WineGrid.tsx` | Grouped rendering with date headers |
| `components/WineModal.tsx` | Add wishlist pill props + render |
| `components/FollowingFeed.tsx` | Grouped rendering + wishlist toggle wiring + remove bookmark button |
| `components/Dashboard.tsx` | Pass `wishlistItems` to FollowingFeed (not computed set) |
| `components/ProfileView.tsx` | Wishlist state + layout restructure (username/count below header) |
| `components/FollowButton.tsx` | Accept `className` prop |
| `app/u/[username]/page.tsx` | Fetch and pass `wishlistItems` to ProfileView |
| `components/WishlistModal.tsx` | New — read-only modal for wishlist items |
| `components/WishlistGrid.tsx` | Clickable card, pill button, remove description |

---

## Task 1: Fix Background Gradient

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Open `app/globals.css` and add `background-attachment: fixed` to both gradient rules**

Replace the two `html` blocks so they read:

```css
html {
  min-height: 100%;
  background: linear-gradient(135deg, #f5e6e8 0%, #ede0f0 50%, #dde0f5 100%);
  background-attachment: fixed;
}
```

And inside the dark mode media query:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
    --glass-shadow: 0 8px 32px rgba(80,0,30,0.35);
    --glass-shadow-hover: 0 12px 40px rgba(80,0,30,0.5);
  }
  html {
    background: linear-gradient(135deg, #1a0a0f 0%, #2d0a1e 40%, #1e0d3a 100%);
    background-attachment: fixed;
  }
}
```

- [ ] **Step 2: Verify with `npm run lint`**

```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "fix: pin background gradient to viewport with background-attachment fixed"
```

---

## Task 2: Update i18n Labels

**Files:**
- Modify: `lib/i18n/en.ts`
- Modify: `lib/i18n/fr.ts`

- [ ] **Step 1: Update `lib/i18n/en.ts` — change `wishlist.removeFromWishlist`**

Find this line:
```ts
removeFromWishlist: "Remove",
```
Change it to:
```ts
removeFromWishlist: "Remove from Wishlist",
```

- [ ] **Step 2: Update `lib/i18n/fr.ts` — change `wishlist.removeFromWishlist`**

Find this line:
```ts
removeFromWishlist: "Supprimer",
```
Change it to:
```ts
removeFromWishlist: "Retirer de la liste de souhaits",
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```
Expected: no errors. (The `fr.ts` file uses `satisfies typeof en` so TypeScript will catch any key mismatches.)

- [ ] **Step 4: Commit**

```bash
git add lib/i18n/en.ts lib/i18n/fr.ts
git commit -m "i18n: expand removeFromWishlist label in en and fr"
```

---

## Task 3: Add `groupWinesByMonth` Utility

**Files:**
- Modify: `lib/utils.ts`

- [ ] **Step 1: Add `groupWinesByMonth` to `lib/utils.ts`**

Append after the existing `cn` function:

```ts
export function groupWinesByMonth<T extends { createdAt: Date | string }>(
    wines: T[],
    locale: string
): { label: string; wines: T[] }[] {
    const buckets = new Map<string, { label: string; wines: T[] }>();

    for (const wine of wines) {
        const date = new Date(wine.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (!buckets.has(key)) {
            const label = date.toLocaleDateString(locale, { month: "long", year: "numeric" });
            buckets.set(key, { label, wines: [] });
        }
        buckets.get(key)!.wines.push(wine);
    }

    return Array.from(buckets.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([, group]) => group);
}
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/utils.ts
git commit -m "feat: add groupWinesByMonth locale-aware utility"
```

---

## Task 4: Date Section Headers in WineGrid

**Files:**
- Modify: `components/WineGrid.tsx`

- [ ] **Step 1: Replace `WineGrid` with grouped rendering**

Replace the entire file content with:

```tsx
"use client";

import * as React from "react";
import { Wine } from "@prisma/client";
import { WineCard } from "@/components/WineCard";
import { useTranslations } from "@/components/LanguageContext";
import { motion } from "framer-motion";
import { groupWinesByMonth } from "@/lib/utils";

interface WineGridProps {
    wines: Wine[];
    onWineClick: (wine: Wine) => void;
    readonly?: boolean;
}

export function WineGrid({ wines, onWineClick, readonly }: WineGridProps) {
    const { t, lang } = useTranslations();

    if (wines.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <p className="text-lg">{t.wineGrid.emptyTitle}</p>
                <p className="text-sm">{t.wineGrid.emptySubtitle}</p>
            </div>
        );
    }

    const groups = groupWinesByMonth(wines, lang);

    return (
        <>
            {groups.map(({ label, wines: groupWines }) => (
                <div key={label}>
                    <h2 className="text-2xl font-bold text-zinc-400 dark:text-zinc-500 px-4 pt-6 pb-2">
                        {label}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-4">
                        {groupWines.map((wine) => (
                            <motion.div key={wine.id}>
                                <WineCard
                                    wine={wine}
                                    onClick={() => onWineClick(wine)}
                                    readonly={readonly}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            ))}
        </>
    );
}
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/WineGrid.tsx
git commit -m "feat: add month/year section headers to WineGrid"
```

---

## Task 5: Add Wishlist Pill to WineModal

**Files:**
- Modify: `components/WineModal.tsx`

- [ ] **Step 1: Add `isWishlisted` and `onWishlistToggle` props and render the pill**

The `WineModal` component accepts two new optional props. The pill renders only when `readonly === true` and `onWishlistToggle` is defined.

Replace the `WineModalProps` interface and function signature, and add the pill inside the image `<motion.div>`. Here is the complete updated file:

```tsx
"use client";

import * as React from "react";
import { Wine } from "@prisma/client";
import { X, Calendar, Trash2, Share2, Check, ExternalLink, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RatingStar } from "@/components/ui/RatingStar";
import { motion, AnimatePresence } from "framer-motion";
import { deleteWine, generateShareToken } from "@/app/actions";
import { useTranslations } from "@/components/LanguageContext";
import { useSwipeable } from "react-swipeable";
import { cn } from "@/lib/utils";

interface WineModalProps {
    wine: Wine;
    onClose: () => void;
    onDelete?: () => void;
    readonly?: boolean;
    hasPrev?: boolean;
    hasNext?: boolean;
    onPrev?: () => void;
    onNext?: () => void;
    isWishlisted?: boolean;
    onWishlistToggle?: () => void;
}

export function WineModal({
    wine,
    onClose,
    onDelete,
    readonly = false,
    hasPrev = false,
    hasNext = false,
    onPrev = () => {},
    onNext = () => {},
    isWishlisted = false,
    onWishlistToggle,
}: WineModalProps) {
    const [copied, setCopied] = React.useState(false);
    const [confirmingDelete, setConfirmingDelete] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);
    const { t, lang } = useTranslations();
    const openedForWineId = React.useRef(wine.id);
    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => { if (hasNext && !confirmingDelete) onNext(); },
        onSwipedRight: () => { if (hasPrev && !confirmingDelete) onPrev(); },
        preventScrollOnSwipe: true,
    });

    React.useEffect(() => {
        setConfirmingDelete(false);
        setDeleting(false);
        setDeleteError(null);
        setCopied(false);
    }, [wine.id]);

    const saqUrl = `https://www.saq.com/${lang}/catalogsearch/result/?q=${encodeURIComponent(wine.name)}&catalog_type=1&availability_front=Online&availability_front=In%20store`;

    React.useEffect(() => {
        if (!confirmingDelete) return;
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && !deleting) {
                setConfirmingDelete(false);
                setDeleteError(null);
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [confirmingDelete, deleting]);

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

    async function handleDelete() {
        setDeleting(true);
        try {
            await deleteWine(wine.id);
            onClose();
            onDelete?.();
        } catch {
            setDeleteError(t.wineModal.deleteFailed);
        } finally {
            setDeleting(false);
        }
    }

    async function handleShare() {
        const token = await generateShareToken(wine.id);
        const url = `${window.location.origin}/share/${token}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: wine.name, url });
                return;
            }
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // share/clipboard unavailable
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                onClick={confirmingDelete ? undefined : onClose}
            />
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
                    className="w-full max-w-2xl bg-white/75 dark:bg-white/20 backdrop-blur-xl border border-white/50 dark:border-white/25 rounded-2xl overflow-hidden shadow-[var(--glass-shadow)] pointer-events-auto flex flex-col md:flex-row max-h-[90vh]"
                >
                    <motion.div
                        key={`img-${wine.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className="relative w-full md:w-1/2 h-64 md:h-auto bg-white/10"
                    >
                        <img
                            src={wine.imagePath}
                            alt={wine.name}
                            className="w-full h-full object-cover"
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-4 left-4 bg-black/20 hover:bg-black/40 text-white rounded-full md:hidden"
                            onClick={onClose}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        {readonly && onWishlistToggle && (
                            <button
                                onClick={onWishlistToggle}
                                className={cn(
                                    "absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full backdrop-blur-sm text-white text-sm flex items-center gap-1.5 whitespace-nowrap transition-colors",
                                    isWishlisted
                                        ? "bg-violet-600/70 hover:bg-violet-700/70"
                                        : "bg-black/40 hover:bg-black/60"
                                )}
                            >
                                {isWishlisted ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        {t.wishlist.removeFromWishlist}
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        {t.wishlist.addToWishlist}
                                    </>
                                )}
                            </button>
                        )}
                    </motion.div>

                    <motion.div
                        key={`content-${wine.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <motion.h2 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white">
                                    {wine.name}
                                </motion.h2>
                                <div className="flex items-center text-zinc-500 dark:text-white/50 text-sm">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(wine.createdAt).toLocaleDateString()}
                                </div>
                                {wine.sharedByUsername && (
                                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-violet-700 dark:text-violet-300 border border-white/40 dark:border-white/30">
                                        {t.share.sharedBy.replace("{username}", wine.sharedByUsername)}
                                    </span>
                                )}
                                <a
                                    href={saqUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 mt-1 text-sm text-violet-600 dark:text-violet-400 hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    {t.wineModal.goToSAQ}
                                </a>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="hidden md:flex rounded-full"
                                onClick={onClose}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-zinc-500 dark:text-white/50 uppercase tracking-wider">
                                    {t.common.rating}
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden rounded-full text-zinc-500 dark:text-white/60"
                                    onClick={handleShare}
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
                                </Button>
                            </div>
                            <RatingStar rating={wine.rating} readonly className="gap-2 [&_svg]:w-8 [&_svg]:h-8" />
                        </div>

                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-zinc-500 dark:text-white/50 uppercase tracking-wider mb-3">
                                {t.wineModal.tastingNotes}
                            </h3>
                            <p className="text-zinc-700 dark:text-white/80 leading-relaxed whitespace-pre-wrap">
                                {wine.description}
                            </p>
                        </div>

                        {!readonly && (
                            <div className="mt-6 pt-6 border-t border-white/20 dark:border-white/15 flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 gap-2"
                                    onClick={() => setConfirmingDelete(true)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {t.common.delete}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="hidden md:flex gap-2 text-zinc-600 dark:text-white/60"
                                    onClick={handleShare}
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
                                    {copied ? t.common.copied : t.common.share}
                                </Button>
                            </div>
                        )}
                    </motion.div>
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
                                if (!deleting) { setConfirmingDelete(false); setDeleteError(null); }
                            }}
                        />
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
                            <motion.div
                                key="confirm-card"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="w-full max-w-sm bg-white/75 dark:bg-white/20 backdrop-blur-xl border border-white/50 dark:border-white/25 rounded-2xl p-6 shadow-[var(--glass-shadow)] pointer-events-auto"
                            >
                                <p className="text-zinc-900 dark:text-white font-semibold text-lg mb-2">
                                    {t.wineModal.deleteConfirm}
                                </p>
                                {deleteError && (
                                    <p className="text-red-500 text-sm mb-4">{deleteError}</p>
                                )}
                                <div className="flex gap-3 justify-end">
                                    <Button
                                        variant="ghost"
                                        onClick={() => { if (!deleting) { setConfirmingDelete(false); setDeleteError(null); } }}
                                        disabled={deleting}
                                    >
                                        {t.common.cancel}
                                    </Button>
                                    <Button
                                        className="bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                                        onClick={handleDelete}
                                        disabled={deleting}
                                    >
                                        {deleting ? t.wineModal.deleting : t.wineModal.deleteConfirmAction}
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/WineModal.tsx
git commit -m "feat: add wishlist toggle pill to WineModal for readonly wines"
```

---

## Task 6: FollowingFeed — Date Headers + Wishlist Toggle Wiring

**Files:**
- Modify: `components/FollowingFeed.tsx`
- Modify: `components/Dashboard.tsx`

This task replaces the `wishlistedKeys: Set<string>` prop with `wishlistItems: WishlistItem[]`, adds a toggle handler (add + remove), groups wines by month, removes the below-card bookmark button, and wires the wishlist pill in WineModal.

- [ ] **Step 1: Replace `components/FollowingFeed.tsx`**

```tsx
"use client";

import * as React from "react";
import { Wine, WishlistItem } from "@prisma/client";
import { WineCard } from "@/components/WineCard";
import { WineModal } from "@/components/WineModal";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "@/components/LanguageContext";
import { addToWishlist, removeFromWishlist } from "@/app/actions";
import Link from "next/link";
import { groupWinesByMonth } from "@/lib/utils";

type FeedWine = Wine & { user: { username: string } };

interface FollowingFeedProps {
    wines: FeedWine[];
    wishlistItems: WishlistItem[];
}

export function FollowingFeed({ wines, wishlistItems }: FollowingFeedProps) {
    const [selectedWine, setSelectedWine] = React.useState<FeedWine | null>(null);
    const [localWishlistItems, setLocalWishlistItems] = React.useState<WishlistItem[]>(wishlistItems);
    const { t, lang } = useTranslations();
    const pendingKeys = React.useRef(new Set<string>());

    const wishlistItemsJson = JSON.stringify(wishlistItems.map((i) => i.id).sort());
    React.useEffect(() => {
        setLocalWishlistItems(wishlistItems);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wishlistItemsJson]);

    const wishlistMap = React.useMemo(
        () => new Map(localWishlistItems.map((i) => [`${i.name}::${i.addedByUsername}`, i.id])),
        [localWishlistItems]
    );

    async function handleWishlistToggle(wine: FeedWine) {
        const key = `${wine.name}::${wine.user.username}`;
        if (pendingKeys.current.has(key)) return;
        pendingKeys.current.add(key);

        const existingId = wishlistMap.get(key);
        if (existingId === undefined) {
            const pseudoItem: WishlistItem = {
                id: -Date.now(),
                userId: -1,
                name: wine.name,
                description: wine.description,
                imagePath: wine.imagePath,
                addedByUsername: wine.user.username,
                createdAt: new Date(),
            };
            setLocalWishlistItems((prev) => [...prev, pseudoItem]);
            try {
                await addToWishlist(wine.id);
            } catch {
                setLocalWishlistItems((prev) => prev.filter((i) => i.id !== pseudoItem.id));
            } finally {
                pendingKeys.current.delete(key);
            }
        } else {
            setLocalWishlistItems((prev) => prev.filter((i) => i.id !== existingId));
            try {
                await removeFromWishlist(existingId);
            } catch {
                setLocalWishlistItems(wishlistItems);
            } finally {
                pendingKeys.current.delete(key);
            }
        }
    }

    if (wines.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-center px-4">
                <p className="text-lg">{t.feed.empty}</p>
            </div>
        );
    }

    const groups = groupWinesByMonth(wines, lang);

    return (
        <>
            {groups.map(({ label, wines: groupWines }) => (
                <div key={label}>
                    <h2 className="text-2xl font-bold text-zinc-400 dark:text-zinc-500 px-4 pt-6 pb-2">
                        {label}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-4">
                        {groupWines.map((wine) => {
                            const key = `${wine.name}::${wine.user.username}`;
                            return (
                                <div key={wine.id}>
                                    <WineCard
                                        wine={wine}
                                        onClick={() => setSelectedWine(wine)}
                                        readonly
                                    />
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 px-1">
                                        <Link
                                            href={`/u/${wine.user.username}`}
                                            className="hover:underline hover:text-violet-600"
                                        >
                                            {t.feed.by.replace("{username}", wine.user.username)}
                                        </Link>
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
            <AnimatePresence>
                {selectedWine && (
                    <WineModal
                        wine={selectedWine}
                        onClose={() => setSelectedWine(null)}
                        readonly
                        isWishlisted={wishlistMap.has(`${selectedWine.name}::${selectedWine.user.username}`)}
                        onWishlistToggle={() => handleWishlistToggle(selectedWine)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
```

- [ ] **Step 2: Update `components/Dashboard.tsx` — pass `wishlistItems` directly to `FollowingFeed`**

In `Dashboard.tsx`, find the `wishlistedKeys` memo:

```tsx
const wishlistedKeys = React.useMemo(
    () => new Set(wishlistItems.map((i) => `${i.name}::${i.addedByUsername}`)),
    [wishlistItems]
);
```

Delete it entirely (it's no longer needed).

Then find the `FollowingFeed` usage:

```tsx
{activeTab === "following" && <FollowingFeed wines={feedWines} wishlistedKeys={wishlistedKeys} />}
```

Change it to:

```tsx
{activeTab === "following" && <FollowingFeed wines={feedWines} wishlistItems={wishlistItems} />}
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/FollowingFeed.tsx components/Dashboard.tsx
git commit -m "feat: add date headers and wishlist toggle to FollowingFeed"
```

---

## Task 7: ProfileView — Wishlist Wiring + Layout Restructure

**Files:**
- Modify: `components/FollowButton.tsx`
- Modify: `components/ProfileView.tsx`
- Modify: `app/u/[username]/page.tsx`

- [ ] **Step 1: Add `className` prop to `FollowButton`**

Replace `components/FollowButton.tsx` with:

```tsx
"use client";

import * as React from "react";
import { followUser, unfollowUser } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/components/LanguageContext";

interface FollowButtonProps {
    userId: number;
    initialIsFollowing: boolean;
    className?: string;
}

export function FollowButton({ userId, initialIsFollowing, className }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = React.useState(initialIsFollowing);
    const [isPending, setIsPending] = React.useState(false);
    React.useEffect(() => {
        setIsFollowing(initialIsFollowing);
    }, [initialIsFollowing]);
    const { t } = useTranslations();

    async function handleClick() {
        if (isPending) return;
        setIsPending(true);
        const prev = isFollowing;
        setIsFollowing(!prev);
        try {
            if (prev) {
                await unfollowUser(userId);
            } else {
                await followUser(userId);
            }
        } catch {
            setIsFollowing(prev);
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Button
            onClick={handleClick}
            disabled={isPending}
            variant={isFollowing ? "ghost" : "default"}
            className={className}
        >
            {isFollowing ? t.profile.unfollow : t.profile.follow}
        </Button>
    );
}
```

- [ ] **Step 2: Replace `components/ProfileView.tsx`**

```tsx
"use client";

import * as React from "react";
import { Wine, User, WishlistItem } from "@prisma/client";
import { WineGrid } from "@/components/WineGrid";
import { WineModal } from "@/components/WineModal";
import { FollowButton } from "@/components/FollowButton";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "@/components/LanguageContext";
import Link from "next/link";
import { Check, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { addToWishlist, removeFromWishlist } from "@/app/actions";

type ProfileUser = User & { wines: Wine[] };

interface ProfileViewProps {
    profile: ProfileUser;
    currentUserId: number | null;
    initialIsFollowing: boolean;
    wishlistItems?: WishlistItem[];
}

export function ProfileView({ profile, currentUserId, initialIsFollowing, wishlistItems = [] }: ProfileViewProps) {
    const [selectedWine, setSelectedWine] = React.useState<Wine | null>(null);
    const [copied, setCopied] = React.useState(false);
    const [localWishlistItems, setLocalWishlistItems] = React.useState<WishlistItem[]>(wishlistItems);
    const { t } = useTranslations();
    const pendingKeys = React.useRef(new Set<string>());

    const showFollowButton = currentUserId !== null && currentUserId !== profile.id;
    const isOwnProfile = currentUserId === profile.id;
    const canWishlist = currentUserId !== null && currentUserId !== profile.id;

    const wishlistItemsJson = JSON.stringify(wishlistItems.map((i) => i.id).sort());
    React.useEffect(() => {
        setLocalWishlistItems(wishlistItems);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wishlistItemsJson]);

    const wishlistMap = React.useMemo(
        () => new Map(localWishlistItems.map((i) => [`${i.name}::${i.addedByUsername}`, i.id])),
        [localWishlistItems]
    );

    async function handleWishlistToggle(wine: Wine) {
        const key = `${wine.name}::${profile.username}`;
        if (pendingKeys.current.has(key)) return;
        pendingKeys.current.add(key);

        const existingId = wishlistMap.get(key);
        if (existingId === undefined) {
            const pseudoItem: WishlistItem = {
                id: -Date.now(),
                userId: -1,
                name: wine.name,
                description: wine.description,
                imagePath: wine.imagePath,
                addedByUsername: profile.username,
                createdAt: new Date(),
            };
            setLocalWishlistItems((prev) => [...prev, pseudoItem]);
            try {
                await addToWishlist(wine.id);
            } catch {
                setLocalWishlistItems((prev) => prev.filter((i) => i.id !== pseudoItem.id));
            } finally {
                pendingKeys.current.delete(key);
            }
        } else {
            setLocalWishlistItems((prev) => prev.filter((i) => i.id !== existingId));
            try {
                await removeFromWishlist(existingId);
            } catch {
                setLocalWishlistItems(wishlistItems);
            } finally {
                pendingKeys.current.delete(key);
            }
        }
    }

    function handleCopyLink() {
        if (!navigator.clipboard) return;
        const url = `${window.location.origin}/u/${profile.username}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {});
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <Link href="/" className="text-sm text-violet-600 hover:underline">
                        VinoVault
                    </Link>
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
                    </div>
                </div>
            </header>

            <main className="container mx-auto max-w-7xl">
                <div className="text-center py-6 px-4">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                        {profile.username}
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {t.profile.wineCount.replace("{count}", String(profile.wines.length))}
                    </p>
                    {showFollowButton && (
                        <div className="mt-3">
                            <FollowButton
                                userId={profile.id}
                                initialIsFollowing={initialIsFollowing}
                                className="rounded-full px-6"
                            />
                        </div>
                    )}
                </div>

                <WineGrid
                    wines={profile.wines}
                    onWineClick={(wine) => setSelectedWine(wine)}
                    readonly
                />
            </main>

            <AnimatePresence>
                {selectedWine && (
                    <WineModal
                        wine={selectedWine}
                        onClose={() => setSelectedWine(null)}
                        readonly
                        isWishlisted={canWishlist ? wishlistMap.has(`${selectedWine.name}::${profile.username}`) : undefined}
                        onWishlistToggle={canWishlist ? () => handleWishlistToggle(selectedWine) : undefined}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
```

- [ ] **Step 3: Update `app/u/[username]/page.tsx` — fetch and pass `wishlistItems`**

Replace the file with:

```tsx
import { getUserProfile, getIsFollowing, getWishlist } from "@/app/actions";
import { getCurrentUser } from "@/app/auth-actions";
import { ProfileView } from "@/components/ProfileView";
import { notFound } from "next/navigation";

export default async function ProfilePage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;

    const profile = await getUserProfile(username);
    if (!profile) notFound();

    const currentUser = await getCurrentUser();
    const [isFollowing, wishlistItems] = await Promise.all([
        getIsFollowing(profile.id),
        currentUser ? getWishlist() : Promise.resolve([]),
    ]);

    return (
        <ProfileView
            profile={profile}
            currentUserId={currentUser?.id ?? null}
            initialIsFollowing={isFollowing}
            wishlistItems={wishlistItems}
        />
    );
}
```

- [ ] **Step 4: Run lint**

```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/FollowButton.tsx components/ProfileView.tsx app/u/[username]/page.tsx
git commit -m "feat: restructure profile layout and wire wishlist toggle on WineModal"
```

---

## Task 8: Create WishlistModal Component

**Files:**
- Create: `components/WishlistModal.tsx`

- [ ] **Step 1: Create `components/WishlistModal.tsx`**

```tsx
"use client";

import * as React from "react";
import { WishlistItem } from "@prisma/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { BookmarkPlus } from "lucide-react";

interface WishlistModalProps {
    item: WishlistItem;
    onClose: () => void;
}

export function WishlistModal({ item, onClose }: WishlistModalProps) {
    React.useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                onClick={onClose}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 16 }}
                    transition={{ duration: 0.18 }}
                    className="w-full max-w-sm bg-white/75 dark:bg-white/20 backdrop-blur-xl border border-white/50 dark:border-white/25 rounded-2xl overflow-hidden shadow-[var(--glass-shadow)] pointer-events-auto"
                >
                    <div className="relative w-full aspect-[4/3] bg-white/10">
                        {item.imagePath ? (
                            <img
                                src={item.imagePath}
                                alt={item.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                                <BookmarkPlus className="h-16 w-16 text-zinc-300 dark:text-zinc-600" />
                            </div>
                        )}
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-3 left-3 bg-black/20 hover:bg-black/40 text-white rounded-full"
                            onClick={onClose}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                            {item.name}
                        </h2>
                        {item.description && (
                            <p className="text-zinc-600 dark:text-white/70 leading-relaxed">
                                {item.description}
                            </p>
                        )}
                    </div>
                </motion.div>
            </div>
        </>
    );
}
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/WishlistModal.tsx
git commit -m "feat: add WishlistModal read-only view for wishlist items"
```

---

## Task 9: Update WishlistGrid

**Files:**
- Modify: `components/WishlistGrid.tsx`

- [ ] **Step 1: Replace `components/WishlistGrid.tsx`**

Changes: add `selectedItem` state, make card clickable, remove description below card, replace text button with pill, integrate `WishlistModal`.

```tsx
"use client";

import * as React from "react";
import { WishlistItem } from "@prisma/client";
import { Trash2, BookmarkPlus, X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { removeFromWishlist, moveToCollection } from "@/app/actions";
import { WineForm } from "@/components/WineForm";
import { WishlistModal } from "@/components/WishlistModal";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/components/LanguageContext";

interface WishlistGridProps {
    items: WishlistItem[];
}

export function WishlistGrid({ items }: WishlistGridProps) {
    const [movingItem, setMovingItem] = React.useState<WishlistItem | null>(null);
    const [selectedItem, setSelectedItem] = React.useState<WishlistItem | null>(null);
    const movingItemRef = React.useRef<WishlistItem | null>(null);
    const { t } = useTranslations();

    React.useEffect(() => {
        movingItemRef.current = movingItem;
    }, [movingItem]);

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
                        <div
                            className="relative rounded-xl overflow-hidden bg-white/10 border border-white/20 aspect-[4/5] cursor-pointer"
                            onClick={() => setSelectedItem(item)}
                        >
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
                        <div className="flex gap-2 mt-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 h-8 w-8 shrink-0"
                                title={t.wishlist.removeFromWishlist}
                                onClick={async () => {
                                    try {
                                        await removeFromWishlist(item.id);
                                    } catch {
                                        alert("Failed to remove from wishlist.");
                                    }
                                }}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <button
                                className="flex-1 rounded-full px-3 py-1.5 text-xs flex items-center justify-center gap-1.5 bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900 transition-colors"
                                onClick={() => setMovingItem(item)}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {t.wishlist.moveToCollection}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Wishlist Item Detail Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <WishlistModal
                        item={selectedItem}
                        onClose={() => setSelectedItem(null)}
                    />
                )}
            </AnimatePresence>

            {/* Move to Collection Modal */}
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
                                        if (!movingItemRef.current) return;
                                        await moveToCollection(movingItemRef.current.id, formData);
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

- [ ] **Step 2: Run lint**

```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 3: Run a production build to catch any type errors**

```bash
npm run build
```
Expected: compiled successfully with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add components/WishlistGrid.tsx
git commit -m "feat: clickable wishlist cards with WishlistModal and pill move button"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Task 1 — background gradient fix (`globals.css`)
- ✅ Task 2 — i18n `removeFromWishlist` label updated in en + fr
- ✅ Tasks 3–4 — `groupWinesByMonth` + WineGrid date headers
- ✅ Task 5 — WineModal wishlist pill (props, render, both states)
- ✅ Task 6 — FollowingFeed: date headers, wishlist toggle (add+remove), remove bookmark button, modal wiring; Dashboard passes `wishlistItems`
- ✅ Task 7 — ProfileView: wishlist state, toggle handler, layout restructure (username/count/follow below header), `FollowButton` className prop, profile page fetches wishlist
- ✅ Task 8 — WishlistModal created
- ✅ Task 9 — WishlistGrid: clickable card, no description, pill button, WishlistModal integration
- ✅ Profile page (WineGrid) inherits date headers automatically — no extra task needed

**Type consistency:**
- `groupWinesByMonth(wines, lang)` — called with `lang` (string) everywhere ✅
- `WishlistItem` pseudo-item fields match Prisma type (`id, userId, name, description, imagePath, addedByUsername, createdAt`) ✅
- `WineModal` new props `isWishlisted?: boolean`, `onWishlistToggle?: () => void` — used consistently across Tasks 5, 6, 7 ✅
- `removeFromWishlist` imported in both `FollowingFeed` and `ProfileView` ✅
- `WishlistModal` props `item: WishlistItem`, `onClose: () => void` — matches usage in Task 9 ✅
