# Share Profile Tab Bar Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Share Profile action from the header into the tab bar as a standalone circle icon button, style mobile tabs as pills, increase desktop tab label size, and wire the button to the native system share sheet.

**Architecture:** All changes are confined to `components/Dashboard.tsx`. The existing `handleCopyProfileLink` function is replaced by `handleShareProfile` which uses `navigator.share` with a clipboard fallback, matching the pattern already used in `WineModal.tsx`. The Share button is a plain `<button>` rendered as a sibling to (not inside) the tab loops — it never becomes the active tab.

**Tech Stack:** React, Next.js App Router, Tailwind CSS v4, Lucide React, Framer Motion (no changes needed), `navigator.share` Web API.

---

## File Map

| File | Change |
|------|--------|
| `components/Dashboard.tsx` | All changes — imports, handler, header, mobile nav, desktop tab bar |

---

### Task 1: Update imports and replace share handler

**Files:**
- Modify: `components/Dashboard.tsx:5` (imports), `components/Dashboard.tsx:36-52` (state + handler), `components/Dashboard.tsx:120-128` (header button)

- [ ] **Step 1: Update the lucide-react import line**

In `components/Dashboard.tsx`, line 5, replace:

```tsx
import { Plus, X, LogOut, Search, Wine as WineIcon, Users, Bookmark, Check, Link as LinkIcon } from "lucide-react";
```

with:

```tsx
import { Plus, X, LogOut, Search, Wine as WineIcon, Users, Bookmark, Share2 } from "lucide-react";
```

- [ ] **Step 2: Remove `copied` state and replace the share handler**

Remove line 36:
```tsx
const [copied, setCopied] = React.useState(false);
```

Remove lines 43-52 (`handleCopyProfileLink` function):
```tsx
function handleCopyProfileLink() {
    if (!navigator.clipboard) return;
    const url = `${window.location.origin}/u/${user.username}`;
    navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
        // Clipboard unavailable — no-op; button stays in default state
    });
}
```

Add the new handler in their place (after the `wishlistedKeys` useMemo, before `filteredWines`):

```tsx
function handleShareProfile() {
    const url = `${window.location.origin}/u/${user.username}`;
    if (navigator.share) {
        navigator.share({ title: user.username, url }).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).catch(() => {});
    }
}
```

- [ ] **Step 3: Remove the share button from the header**

Remove lines 120-128 in the header `<div className="flex items-center gap-2">`:

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

- [ ] **Step 4: Verify the file compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: no TypeScript or import errors. (Build may warn about other things — only care about errors in `Dashboard.tsx`.)

- [ ] **Step 5: Commit**

```bash
git add components/Dashboard.tsx
git commit -m "refactor: replace copy-link header button with navigator.share handler"
```

---

### Task 2: Restyle mobile nav tabs as pills and adjust nav offset

**Files:**
- Modify: `components/Dashboard.tsx` — mobile `<nav>` element

- [ ] **Step 1: Change nav right offset to make room for the share button**

In the mobile `<nav>` element (currently `className="fixed bottom-4 left-4 right-4 z-20 flex sm:hidden ..."`), change `right-4` to `right-20`:

```tsx
<nav aria-label="Tab navigation" className="fixed bottom-4 left-4 right-20 z-20 flex sm:hidden items-center bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/30 dark:border-white/20 rounded-3xl shadow-[var(--glass-shadow)] p-2">
```

- [ ] **Step 2: Change mobile tab button corners from rounded-xl to rounded-full**

In the mobile tab button `className`, change `rounded-xl` to `rounded-full`:

```tsx
className={cn(
    "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-full text-xs font-medium transition-colors",
    activeTab === tab
        ? "bg-white/30 dark:bg-white/20 text-violet-600 dark:text-violet-400"
        : "text-zinc-500"
)}
```

- [ ] **Step 3: Verify visually**

```bash
npm run dev
```

Open http://localhost:3000 on a narrow viewport (< 640px). The three tab pills should have fully rounded ends. There should be a gap at the right of the nav where the share button will go.

- [ ] **Step 4: Commit**

```bash
git add components/Dashboard.tsx
git commit -m "style: pill tabs on mobile nav, adjust right offset for share button"
```

---

### Task 3: Add mobile share circle button

**Files:**
- Modify: `components/Dashboard.tsx` — add sibling button after `</nav>`

- [ ] **Step 1: Add the share button after the closing `</nav>` tag**

The mobile `</nav>` closes around line 273. Immediately after it, add:

```tsx
{/* Mobile Share Button */}
<button
    onClick={handleShareProfile}
    className="fixed bottom-4 right-4 z-20 flex sm:hidden h-14 w-14 rounded-full items-center justify-center bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/30 dark:border-white/20 shadow-[var(--glass-shadow)] text-zinc-500"
    title={t.dashboard.shareTitle}
>
    <Share2 className="h-5 w-5" />
</button>
```

- [ ] **Step 2: Verify visually on mobile viewport**

```bash
npm run dev
```

Open http://localhost:3000 at < 640px width. A frosted-glass circle button with a share icon should appear to the right of the tab nav at the same vertical position. Tapping it should open the system share sheet (or silently copy on non-supporting browsers).

- [ ] **Step 3: Commit**

```bash
git add components/Dashboard.tsx
git commit -m "feat: add mobile share circle button next to tab nav"
```

---

### Task 4: Restyle desktop tab labels

**Files:**
- Modify: `components/Dashboard.tsx` — desktop tab bar button className

- [ ] **Step 1: Increase desktop tab label size and weight**

In the desktop tab bar (`hidden sm:flex` section), update the tab button `className`. Change `text-sm font-medium` to `text-[30px] font-medium`:

```tsx
className={cn(
    "px-4 py-3 text-[30px] font-medium transition-colors border-b-2 -mb-px",
    activeTab === tab
        ? "border-violet-600 text-violet-600"
        : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white"
)}
```

- [ ] **Step 2: Also add `items-center` to the desktop tab row container**

The container `<div className="hidden sm:flex border-b ...">` needs `items-center` so the share button (added next task) aligns vertically with the tabs:

```tsx
<div className="hidden sm:flex items-center border-b border-white/20 dark:border-white/15 px-4">
```

- [ ] **Step 3: Verify visually on desktop**

```bash
npm run dev
```

Open http://localhost:3000 at ≥ 640px. The Collection / Following / Wishlist labels should render at 30px, medium weight.

- [ ] **Step 4: Commit**

```bash
git add components/Dashboard.tsx
git commit -m "style: increase desktop tab label size to 30px"
```

---

### Task 5: Add desktop share circle button

**Files:**
- Modify: `components/Dashboard.tsx` — desktop tab bar

- [ ] **Step 1: Add the share button after the desktop tab loop's closing `)`**

After the closing `})}` of the desktop tab `.map(...)`, still inside the `<div className="hidden sm:flex ...">`, add:

```tsx
<button
    onClick={handleShareProfile}
    className="ml-auto h-8 w-8 rounded-full flex items-center justify-center bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/30 dark:border-white/20 text-zinc-500 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white"
    title={t.dashboard.shareTitle}
>
    <Share2 className="h-4 w-4" />
</button>
```

- [ ] **Step 2: Verify visually on desktop**

```bash
npm run dev
```

Open http://localhost:3000 at ≥ 640px. A small frosted-glass circle with a share icon should appear at the far right of the desktop tab row. Clicking it should open the system share sheet.

- [ ] **Step 3: Final full check — confirm no regressions**

- Mobile: three pill tabs, share circle to the right, no overlap
- Desktop: large tab labels, share circle at right end of tab row
- Header: no share/copy button visible
- Adding wine still works (floating `+` button)
- Wine modal still opens

- [ ] **Step 4: Commit**

```bash
git add components/Dashboard.tsx
git commit -m "feat: add desktop share circle button to tab bar"
```
