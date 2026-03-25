# Mobile Bottom Navigation Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Collection/Following/Wishlist tab navigation to a floating frosted-glass bottom bar on mobile, while keeping the existing top tab bar on desktop.

**Architecture:** All changes are confined to `components/Dashboard.tsx`. The existing top tab bar gains `hidden sm:flex` to hide on mobile. A new `fixed` bottom nav element with `flex sm:hidden` is added for mobile only. The FAB button gets a responsive bottom offset to sit above the nav bar.

**Tech Stack:** Next.js App Router, Tailwind CSS v4, lucide-react, Framer Motion (existing, no new dependencies)

---

## File Map

| File | Change |
|------|--------|
| `components/Dashboard.tsx` | All changes — imports, desktop tab bar, new mobile nav, FAB offset, root padding |

---

### Task 1: Add icon imports and fix desktop tab bar

**Files:**
- Modify: `components/Dashboard.tsx`

This task adds the three lucide icons needed for the mobile nav, then fixes the desktop tab bar: hide it on mobile and enable the Wishlist tab.

- [ ] **Step 1: Add lucide-react icon imports**

In `components/Dashboard.tsx`, find the existing imports block near the top. Add after the existing lucide import line (`import { Plus, X, LogOut, Search } from "lucide-react"`):

```ts
import { Wine as WineIcon, Users, Bookmark } from "lucide-react";
```

The `Wine` alias is required because line 4 already imports `Wine` as a Prisma model type from `@prisma/client`.

- [ ] **Step 2: Hide the desktop tab bar on mobile**

Find the `<div>` that wraps the tab buttons (around line 131):

```tsx
<div className="flex border-b border-zinc-200 dark:border-zinc-800 px-4">
```

Change `flex` to `hidden sm:flex`:

```tsx
<div className="hidden sm:flex border-b border-zinc-200 dark:border-zinc-800 px-4">
```

- [ ] **Step 3: Enable Wishlist tab on desktop**

Inside that same tab map, each `<button>` currently has:
```tsx
onClick={() => tab !== "wishlist" && setActiveTab(tab)}
disabled={tab === "wishlist"}
```
and the `cn()` call includes:
```tsx
tab === "wishlist" && "opacity-40 cursor-not-allowed"
```

Replace with a plain onClick and remove the disabled prop and the opacity/cursor class:

```tsx
onClick={() => setActiveTab(tab)}
```

Remove `disabled={tab === "wishlist"}` entirely.

Remove `tab === "wishlist" && "opacity-40 cursor-not-allowed"` from the `cn()` call.

- [ ] **Step 4: Verify TypeScript compiles cleanly**

Run: `npm run lint`

Expected: no errors. If there are import errors, check the alias spelling (`WineIcon` not `Wine`).

- [ ] **Step 5: Commit**

```bash
git add components/Dashboard.tsx
git commit -m "feat: add mobile nav icons, hide desktop tab bar on mobile, enable wishlist tab"
```

---

### Task 2: Add the mobile bottom nav bar

**Files:**
- Modify: `components/Dashboard.tsx`

Add the floating frosted-glass bottom nav element. It only renders on mobile (`flex sm:hidden`), spans the viewport width minus 16px each side, and divides equally into three tab buttons.

- [ ] **Step 1: Add the mobile bottom nav element**

In `components/Dashboard.tsx`, find the closing `</div>` of the root element (the very last `</div>` before the component closes, around line 223). Insert the following just before it — after the `{/* Wine Details Modal */}` AnimatePresence block:

```tsx
{/* Mobile Bottom Nav */}
<nav className="fixed bottom-4 left-4 right-4 z-20 flex sm:hidden items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-[0_0_16px_0_rgba(0,0,0,0.10)] p-2">
    {(["collection", "following", "wishlist"] as const).map((tab) => (
        <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-xs font-medium transition-colors",
                activeTab === tab
                    ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600"
                    : "text-zinc-500"
            )}
        >
            {tab === "collection" && <WineIcon className="h-5 w-5" />}
            {tab === "following" && <Users className="h-5 w-5" />}
            {tab === "wishlist" && <Bookmark className="h-5 w-5" />}
            <span>
                {tab === "collection"
                    ? t.dashboard.tabCollection
                    : tab === "following"
                    ? t.dashboard.tabFollowing
                    : t.dashboard.tabWishlist}
            </span>
        </button>
    ))}
</nav>
```

**Shadow note:** `shadow-[0_0_16px_0_rgba(0,0,0,0.10)]` is a Tailwind arbitrary value that produces an even, undirected shadow (equal spread in all directions, no Y offset). This replaces the default `shadow-lg` which has a downward bias.

- [ ] **Step 2: Verify TypeScript compiles cleanly**

Run: `npm run lint`

Expected: no errors.

- [ ] **Step 3: Visual check — mobile nav renders correctly**

Run: `npm run dev`

Open `http://localhost:3000` in a browser. Open DevTools and switch to a mobile viewport (e.g. iPhone 14, 390px wide).

Verify:
- Floating nav bar appears at the bottom, not full-width (16px gap each side)
- Three equal-width tabs with icon + label
- Active tab (Collection) has violet highlight pill
- Shadow is soft and even, not heavier on bottom
- Desktop view: nav bar is hidden, top tab bar is visible

- [ ] **Step 4: Commit**

```bash
git add components/Dashboard.tsx
git commit -m "feat: add mobile floating bottom nav bar"
```

---

### Task 3: Adjust FAB position and root padding for mobile

**Files:**
- Modify: `components/Dashboard.tsx`

The floating `+` button must sit above the bottom nav bar on mobile. The root container needs extra bottom padding so content is not hidden behind the nav.

- [ ] **Step 1: Shift FAB upward on mobile**

Find the floating add button (around line 202):

```tsx
className="fixed bottom-6 right-6 z-30 ..."
```

Change `bottom-6` to `bottom-24 sm:bottom-6`:

```tsx
className="fixed bottom-24 sm:bottom-6 right-6 z-30 ..."
```

`bottom-24` = 96px from viewport bottom. The nav bar top edge sits at ~72px, so this gives ~24px clearance.

- [ ] **Step 2: Increase root container bottom padding**

Find the root `<div>` (line 70):

```tsx
<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
```

Change `pb-20` to `pb-36 sm:pb-20`:

```tsx
<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-36 sm:pb-20">
```

`pb-36` = 144px, intentionally generous to account for safe-area insets on iOS Safari and varying rendered nav heights.

- [ ] **Step 3: Verify TypeScript compiles cleanly**

Run: `npm run lint`

Expected: no errors.

- [ ] **Step 4: Visual check — FAB and content clearance**

Open `http://localhost:3000` in a mobile viewport.

Verify:
- `+` FAB floats clearly above the bottom nav bar with visible gap
- Scrolling to the bottom of the wine grid reveals the last card fully above the nav bar
- `LanguageToggle` at the bottom of the page is not hidden behind the nav
- Desktop: FAB is back at its original bottom-right position

- [ ] **Step 5: Commit**

```bash
git add components/Dashboard.tsx
git commit -m "feat: adjust FAB position and root padding for mobile bottom nav"
```
