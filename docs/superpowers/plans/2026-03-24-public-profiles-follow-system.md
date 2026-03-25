# Public Profiles & Follow System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add public user profiles at `/u/[username]`, a unidirectional follow system, and a Following feed tab on the dashboard.

**Architecture:** A new `Follow` Prisma model (followerId / followingId with a unique constraint) powers the social graph. Profile pages are server components that pass data to a `ProfileView` client component for interactive modal state. The dashboard gains three tabs (Collection, Following, Wishlist placeholder) driven by `React.useState`; the Following tab renders a `FollowingFeed` client component that receives pre-fetched feed wines from the root server component.

**Tech Stack:** Next.js 16 App Router, Prisma (SQLite), React 19, TypeScript, Framer Motion, Tailwind CSS v4, i18n via `lib/i18n/`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `prisma/schema.prisma` | Modify | Add `Follow` model + User relations |
| `app/actions.ts` | Modify | Add 5 new server actions |
| `lib/i18n/en.ts` | Modify | Add 8 new translation keys |
| `lib/i18n/fr.ts` | Modify | Mirror 8 keys in French |
| `components/WineModal.tsx` | Modify | Add `readonly` prop — hides entire footer div |
| `components/WineGrid.tsx` | Modify | Thread `readonly` prop to `WineCard` |
| `components/WineCard.tsx` | Modify | Accept `readonly` prop (for interface consistency) |
| `components/FollowButton.tsx` | Create | Optimistic follow/unfollow button (client) |
| `components/FollowingFeed.tsx` | Create | Feed grid with bylines + own modal state (client) |
| `components/ProfileView.tsx` | Create | Profile header + wine grid + modal state (client) |
| `app/u/[username]/page.tsx` | Create | Public profile server page |
| `components/Dashboard.tsx` | Modify | Add tabs + accept `feedWines` prop |
| `app/page.tsx` | Modify | Fetch `feedWines` and pass to Dashboard |

---

### Task 1: Database schema — Add Follow model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add Follow model and User relations to schema**

Open `prisma/schema.prisma`. The current `User` model ends at line 18. Add two relation fields to `User` and append the new `Follow` model. The full updated file should be:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  createdAt DateTime @default(now())
  wines     Wine[]
  following Follow[] @relation("UserFollowers")
  followers Follow[] @relation("UserFollowing")
}

model Wine {
  id               Int      @id @default(autoincrement())
  name             String
  description      String
  rating           Int
  imagePath        String
  createdAt        DateTime @default(now())
  userId           Int
  user             User     @relation(fields: [userId], references: [id])
  shareToken       String?  @unique
  sharedByUsername String?
}

model Follow {
  id          Int      @id @default(autoincrement())
  followerId  Int
  followingId Int
  follower    User     @relation("UserFollowers", fields: [followerId], references: [id])
  following   User     @relation("UserFollowing", fields: [followingId], references: [id])
  createdAt   DateTime @default(now())

  @@unique([followerId, followingId])
}
```

- [ ] **Step 2: Run migration**

```bash
cd /Users/jordandixon/Developer/Web/Test
npx prisma migrate dev --name add-follow-model
```

Expected output: `Your database is now in sync with your schema.`

- [ ] **Step 3: Verify TypeScript picks up new types**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Follow model to schema"
```

---

### Task 2: Server actions — follow system

**Files:**
- Modify: `app/actions.ts`

- [ ] **Step 1: Add the 5 new server actions**

Append the following to the end of `app/actions.ts` (after the `getWines` function at line 186):

```ts
export async function getUserProfile(username: string) {
    return await prisma.user.findUnique({
        where: { username },
        include: { wines: { orderBy: { createdAt: "desc" } } },
    });
}

export async function getIsFollowing(userId: number): Promise<boolean> {
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;
    const follow = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId: currentUser.id,
                followingId: userId,
            },
        },
    });
    return follow !== null;
}

export async function followUser(userId: number) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");
    if (currentUser.id === userId) throw new Error("Cannot follow yourself");
    try {
        await prisma.follow.create({
            data: { followerId: currentUser.id, followingId: userId },
        });
    } catch {
        // Duplicate follow — unique constraint violation, treat as no-op
    }
    revalidatePath("/");
}

export async function unfollowUser(userId: number) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");
    await prisma.follow.deleteMany({
        where: { followerId: currentUser.id, followingId: userId },
    });
    revalidatePath("/");
}

export async function getFollowingFeed() {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    const follows = await prisma.follow.findMany({
        where: { followerId: currentUser.id },
        select: { followingId: true },
    });
    const followingIds = follows.map((f) => f.followingId);
    if (followingIds.length === 0) return [];
    return await prisma.wine.findMany({
        where: { userId: { in: followingIds } },
        include: { user: { select: { username: true } } },
        orderBy: { createdAt: "desc" },
    });
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/actions.ts
git commit -m "feat: add follow system server actions"
```

---

### Task 3: i18n — English keys

**Files:**
- Modify: `lib/i18n/en.ts`

- [ ] **Step 1: Add keys to `en.ts`**

Make the following additions to `lib/i18n/en.ts`. Add `tabCollection`, `tabFollowing`, `tabWishlist` to the existing `dashboard` object; add new top-level `profile` and `feed` objects. The full file should read:

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
    tabCollection: "Collection",
    tabFollowing: "Following",
    tabWishlist: "Wishlist",
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
  },
  feed: {
    empty: "Follow some users to see their wines here.",
    by: "by {username}",
  },
};
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: errors in `fr.ts` (missing keys) — this is expected until Task 4.

- [ ] **Step 3: Commit**

```bash
git add lib/i18n/en.ts
git commit -m "feat: add profile and feed i18n keys (en)"
```

---

### Task 4: i18n — French keys

**Files:**
- Modify: `lib/i18n/fr.ts`

- [ ] **Step 1: Add keys to `fr.ts`**

The file uses `satisfies typeof en` — TypeScript will error if any key is missing. The full updated `fr.ts`:

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
    tabCollection: "Collection",
    tabFollowing: "Abonnements",
    tabWishlist: "Liste de souhaits",
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
  },
  feed: {
    empty: "Suivez des utilisateurs pour voir leurs vins ici.",
    by: "par {username}",
  },
} satisfies typeof en;
```

- [ ] **Step 2: Verify TypeScript — must be clean**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/i18n/fr.ts
git commit -m "feat: add profile and feed i18n keys (fr)"
```

---

### Task 5: WineModal — readonly prop

**Files:**
- Modify: `components/WineModal.tsx`

- [ ] **Step 1: Add `readonly` prop and make navigation props optional**

The user recently added navigation to `WineModal` — it now has required `hasPrev`, `hasNext`, `onPrev`, `onNext` props. These need to become optional so readonly callers (ProfileView, FollowingFeed) don't need to wire up navigation.

Find the `WineModalProps` interface. Replace it with:

```ts
interface WineModalProps {
    wine: Wine;
    onClose: () => void;
    onDelete?: () => void;
    readonly?: boolean;
    hasPrev?: boolean;
    hasNext?: boolean;
    onPrev?: () => void;
    onNext?: () => void;
}
```

- [ ] **Step 2: Update the component destructuring with defaults**

Find the `export function WineModal(...)` line. Change it to:

```ts
export function WineModal({
    wine,
    onClose,
    onDelete,
    readonly = false,
    hasPrev = false,
    hasNext = false,
    onPrev = () => {},
    onNext = () => {},
}: WineModalProps) {
```

- [ ] **Step 3: Wrap the footer div in a conditional**

Find the footer `div` that starts around line 137:
```tsx
<div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
```

This div contains both the Delete button and the Share button. Wrap the entire div:

```tsx
{!readonly && (
    <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        {/* existing Delete and Share buttons unchanged */}
    </div>
)}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/WineModal.tsx
git commit -m "feat: add readonly prop to WineModal"
```

---

### Task 6: WineGrid + WineCard — thread readonly prop

**Files:**
- Modify: `components/WineGrid.tsx`
- Modify: `components/WineCard.tsx`

- [ ] **Step 1: Add `readonly` to WineGrid**

In `components/WineGrid.tsx`, update the interface and component signature:

```ts
interface WineGridProps {
    wines: Wine[];
    onWineClick: (wine: Wine) => void;
    readonly?: boolean;
}

export function WineGrid({ wines, onWineClick, readonly }: WineGridProps) {
```

Pass it to each `WineCard`:

```tsx
<WineCard key={wine.id} wine={wine} onClick={() => onWineClick(wine)} readonly={readonly} />
```

- [ ] **Step 2: Add `readonly` to WineCard**

In `components/WineCard.tsx`, update the interface and destructuring:

```ts
interface WineCardProps {
    wine: Wine;
    onClick?: () => void;
    readonly?: boolean;
}

export function WineCard({ wine, onClick, readonly }: WineCardProps) {
```

`readonly` is accepted but not used on the card itself (the card has no delete/share UI) — this keeps the interface consistent with the rest of the readonly system.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/WineGrid.tsx components/WineCard.tsx
git commit -m "feat: thread readonly prop through WineGrid and WineCard"
```

---

### Task 7: FollowButton component

**Files:**
- Create: `components/FollowButton.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import * as React from "react";
import { followUser, unfollowUser } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/components/LanguageContext";

interface FollowButtonProps {
    userId: number;
    initialIsFollowing: boolean;
}

export function FollowButton({ userId, initialIsFollowing }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = React.useState(initialIsFollowing);
    const [isPending, setIsPending] = React.useState(false);
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
        >
            {isFollowing ? t.profile.unfollow : t.profile.follow}
        </Button>
    );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/FollowButton.tsx
git commit -m "feat: add FollowButton component"
```

---

### Task 8: FollowingFeed component

**Files:**
- Create: `components/FollowingFeed.tsx`

- [ ] **Step 1: Create the component**

`FollowingFeed` renders its own grid (not via `WineGrid`) because it needs per-card bylines. It manages its own `selectedWine` state and renders `WineModal` with `readonly`.

```tsx
"use client";

import * as React from "react";
import { Wine } from "@prisma/client";
import { WineCard } from "@/components/WineCard";
import { WineModal } from "@/components/WineModal";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "@/components/LanguageContext";
import Link from "next/link";

type FeedWine = Wine & { user: { username: string } };

interface FollowingFeedProps {
    wines: FeedWine[];
}

export function FollowingFeed({ wines }: FollowingFeedProps) {
    const [selectedWine, setSelectedWine] = React.useState<Wine | null>(null);
    const { t } = useTranslations();

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
                {wines.map((wine) => (
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
                ))}
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

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/FollowingFeed.tsx
git commit -m "feat: add FollowingFeed component"
```

---

### Task 9: ProfileView component

**Files:**
- Create: `components/ProfileView.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import * as React from "react";
import { Wine, User } from "@prisma/client";
import { WineGrid } from "@/components/WineGrid";
import { WineModal } from "@/components/WineModal";
import { FollowButton } from "@/components/FollowButton";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "@/components/LanguageContext";
import Link from "next/link";

type ProfileUser = User & { wines: Wine[] };

interface ProfileViewProps {
    profile: ProfileUser;
    currentUserId: number | null;
    initialIsFollowing: boolean;
}

export function ProfileView({ profile, currentUserId, initialIsFollowing }: ProfileViewProps) {
    const [selectedWine, setSelectedWine] = React.useState<Wine | null>(null);
    const { t } = useTranslations();

    const showFollowButton = currentUserId !== null && currentUserId !== profile.id;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div>
                        <Link href="/" className="text-sm text-violet-600 hover:underline mb-1 block">
                            VinoVault
                        </Link>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {profile.username}
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {t.profile.wineCount.replace("{count}", String(profile.wines.length))}
                        </p>
                    </div>
                    {showFollowButton && (
                        <FollowButton
                            userId={profile.id}
                            initialIsFollowing={initialIsFollowing}
                        />
                    )}
                </div>
            </header>

            <main className="container mx-auto max-w-7xl">
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
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/ProfileView.tsx
git commit -m "feat: add ProfileView component"
```

---

### Task 10: Profile page route

**Files:**
- Create: `app/u/[username]/page.tsx`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p /Users/jordandixon/Developer/Web/Test/app/u/\[username\]
```

- [ ] **Step 2: Write the page**

```tsx
import { getUserProfile, getIsFollowing } from "@/app/actions";
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
    const isFollowing = await getIsFollowing(profile.id);

    return (
        <ProfileView
            profile={profile}
            currentUserId={currentUser?.id ?? null}
            initialIsFollowing={isFollowing}
        />
    );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/u/
git commit -m "feat: add public profile page at /u/[username]"
```

---

### Task 11: Dashboard tabs

**Files:**
- Modify: `components/Dashboard.tsx`

- [ ] **Step 1: Add the `FeedWine` type and update `DashboardProps`**

At the top of `components/Dashboard.tsx`, after the existing imports, add the `FeedWine` type and update the props interface:

```ts
import { FollowingFeed } from "@/components/FollowingFeed";

type FeedWine = import("@prisma/client").Wine & { user: { username: string } };

interface DashboardProps {
    wines: Wine[];
    user: User;
    feedWines: FeedWine[];
}
```

- [ ] **Step 2: Add `activeTab` state and update the function signature**

Inside the `Dashboard` function, after the existing `useState` declarations, add:

```ts
const [activeTab, setActiveTab] = React.useState<"collection" | "following" | "wishlist">("collection");
```

Update the destructuring to include `feedWines`:
```ts
export function Dashboard({ wines, user, feedWines }: DashboardProps) {
```

- [ ] **Step 3: Add the tab bar**

Inside `<main className="container mx-auto max-w-7xl">`, add the tab bar before `<WineGrid`:

```tsx
<main className="container mx-auto max-w-7xl">
    <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-4">
        {(["collection", "following", "wishlist"] as const).map((tab) => (
            <button
                key={tab}
                onClick={() => tab !== "wishlist" && setActiveTab(tab)}
                disabled={tab === "wishlist"}
                className={cn(
                    "px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                    activeTab === tab
                        ? "border-violet-600 text-violet-600"
                        : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
                    tab === "wishlist" && "opacity-40 cursor-not-allowed"
                )}
            >
                {tab === "collection"
                    ? t.dashboard.tabCollection
                    : tab === "following"
                    ? t.dashboard.tabFollowing
                    : t.dashboard.tabWishlist}
            </button>
        ))}
    </div>

    {activeTab === "collection" && (
        <WineGrid
            wines={filteredWines}
            onWineClick={(wine) => setSelectedWine(wine)}
        />
    )}
    {activeTab === "following" && <FollowingFeed wines={feedWines} />}
    {activeTab === "wishlist" && null}

    <div className="flex justify-center pb-6">
        <LanguageToggle />
    </div>
</main>
```

Remove the standalone `<WineGrid ... />` that was there before (it is now inside the conditional above).

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/Dashboard.tsx
git commit -m "feat: add Collection/Following/Wishlist tabs to Dashboard"
```

---

### Task 12: Wire up root page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Fetch feedWines and pass to Dashboard**

Replace the contents of `app/page.tsx` with:

```tsx
import { getWines, getFollowingFeed } from "./actions";
import { getCurrentUser } from "./auth-actions";
import { Dashboard } from "@/components/Dashboard";
import { redirect } from "next/navigation";

export default async function Home() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const [wines, feedWines] = await Promise.all([getWines(), getFollowingFeed()]);

    return <Dashboard wines={wines} user={user} feedWines={feedWines} />;
}
```

- [ ] **Step 2: Verify TypeScript and lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: no new errors (pre-existing lint issues in other files are not a blocker).

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: successful build.

- [ ] **Step 4: Manual smoke test**

Start `npm run dev` and verify:
1. Dashboard loads with three tabs — Collection (active by default), Following, Wishlist (disabled)
2. Following tab shows empty state when following nobody
3. Navigate to `/u/<your-username>` — profile page loads with wine grid
4. Visit `/u/<nonexistent>` — returns 404
5. As a logged-in user, visit another user's profile — Follow button appears
6. Click Follow — button changes to Unfollow optimistically
7. Return to dashboard Following tab — wine from followed user appears (after page refresh)
8. Toggle language to French — all new strings appear in French

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire getFollowingFeed into root page and Dashboard"
```
