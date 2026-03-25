# Glassmorphism 2.0 Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle every UI surface in VinoVault to use Glassmorphism 2.0 — frosted-glass panels over a vivid wine-themed gradient background — in both light and dark modes.

**Architecture:** Pure styling change — no data layer, no component structure, no props modified. All glass surfaces use a consistent base pattern (`bg-white/65 dark:bg-white/15 backdrop-blur-md dark:backdrop-blur-lg border border-white/50 dark:border-white/20 rounded-2xl shadow-[var(--glass-shadow)]`) defined in `Card.tsx` and inherited downstream. The page gradient lives on the `html` element in `globals.css`.

**Tech Stack:** Next.js App Router, Tailwind CSS v4 (`dark:` resolves to `@media (prefers-color-scheme: dark)` by default — no config needed), Framer Motion (animations unchanged)

> **Note on testing:** This is a pure visual/CSS redesign — there are no unit-testable behaviors to write tests for. Each task uses `npm run lint` as a build-correctness check and `npm run dev` for visual verification. Lint passes + no visual regressions = task complete.

**Spec:** `docs/superpowers/specs/2026-03-25-glassmorphism-redesign-design.md`

---

## File Map

| File | Change |
|---|---|
| `app/globals.css` | Gradient on `html`, `body { background: transparent }`, glass shadow CSS vars |
| `components/ui/Card.tsx` | Base glass card — all downstream components inherit this |
| `components/ui/Button.tsx` | `ghost` and `outline` variants only |
| `components/Dashboard.tsx` | Remove page bg; upgrade header, select, search input, tab bar, mobile nav |
| `components/WineCard.tsx` | Remove Card overrides; update image placeholder bg; upgrade hover shadow |
| `components/WineModal.tsx` | Main panel + delete dialog glass; inner text/divider/badge updates; backdrop opacity |
| `components/WineForm.tsx` | Remove Card ring overrides; glass upload zone |
| `app/login/page.tsx` | Remove outer bg; Card glass override; glass inputs |
| `app/share/[token]/page.tsx` | Remove outer bg; manual glass on card div; image placeholder; inner text |

---

## Task 1: Foundation — Page Gradient & CSS Variables

**Files:**
- Modify: `app/globals.css`

This is the first change to make. Everything else depends on having the gradient background visible.

- [ ] **Step 1: Update `app/globals.css`**

Replace the entire file contents with:

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
  --glass-shadow: 0 8px 24px rgba(120,60,80,0.15);
  --glass-shadow-hover: 0 12px 32px rgba(120,60,80,0.25);
}

html {
  min-height: 100%;
  background: linear-gradient(135deg, #f5e6e8 0%, #ede0f0 50%, #dde0f5 100%);
}

body {
  background: transparent;
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
    --glass-shadow: 0 8px 32px rgba(80,0,30,0.35);
    --glass-shadow-hover: 0 12px 40px rgba(80,0,30,0.5);
  }
  html {
    background: linear-gradient(135deg, #1a0a0f 0%, #2d0a1e 40%, #1e0d3a 100%);
  }
}
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: passes (no JSX changes in this task).

- [ ] **Step 3: Start dev server and verify gradient**

```bash
npm run dev
```

Open http://localhost:3000. Expected: vivid gradient background visible (blush/lavender in light mode, deep burgundy/violet in dark mode). The existing UI will look broken (solid white components floating on the gradient) — that's correct and expected at this stage.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: add wine-cellar gradient background and glass shadow CSS variables"
```

---

## Task 2: Base Glass Card

**Files:**
- Modify: `components/ui/Card.tsx`

`Card` is the foundation — updating it automatically applies glass to every component that uses `<Card>` without overriding its background classes. Do this before touching any consuming components.

- [ ] **Step 1: Update the Card base className in `components/ui/Card.tsx`**

Find line 11:
```
"rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50",
```

Replace with:
```
"rounded-2xl bg-white/65 dark:bg-white/15 backdrop-blur-md dark:backdrop-blur-lg border border-white/50 dark:border-white/20 text-zinc-950 dark:text-zinc-50 shadow-[var(--glass-shadow)]",
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: passes.

- [ ] **Step 3: Visual verify**

Open http://localhost:3000. Expected: `WineCard` components now appear as frosted-glass panels over the gradient. Login card and WineForm card also adopt glass automatically. Some components will still look inconsistent (Dashboard header still solid, some ring/border overrides still in place) — that's fine for now.

- [ ] **Step 4: Commit**

```bash
git add components/ui/Card.tsx
git commit -m "feat: apply glassmorphism base to Card component"
```

---

## Task 3: Button Glass Variants

**Files:**
- Modify: `components/ui/Button.tsx`

Only `ghost` and `outline` in the `premiumVariants` object need updating. Lines 55–62. All other variants unchanged.

- [ ] **Step 1: Update `ghost` and `outline` in `premiumVariants`**

Find in `components/ui/Button.tsx`:
```js
ghost: "hover:bg-zinc-100 text-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-50",
```
Replace with:
```js
ghost: "hover:bg-white/20 dark:hover:bg-white/15 text-zinc-900 dark:text-white",
```

Find:
```js
outline: "border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800 dark:text-zinc-50",
```
Replace with:
```js
outline: "border border-white/40 dark:border-white/25 bg-white/20 dark:bg-white/10 hover:bg-white/35 dark:hover:bg-white/20 text-zinc-900 dark:text-white",
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: passes.

- [ ] **Step 3: Visual verify**

Check that ghost buttons (close/nav icon buttons) and outline buttons look correct. The WineModal nav arrows use explicit `bg-black/20 hover:bg-black/40 text-white` overrides in their `className` — confirm they still appear dark (the override should win over the ghost base).

- [ ] **Step 4: Commit**

```bash
git add components/ui/Button.tsx
git commit -m "feat: apply glass treatment to ghost and outline button variants"
```

---

## Task 4: Dashboard — Background, Header, Tab Bar, Mobile Nav

**Files:**
- Modify: `components/Dashboard.tsx`

Four changes in one file: remove page bg, upgrade header, update select/search inputs, upgrade tab bar border and inactive tabs, upgrade mobile nav.

- [ ] **Step 1: Remove page background from the page wrapper div (line 69)**

Find:
```
className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-36 sm:pb-20"
```
Replace with:
```
className="min-h-screen pb-36 sm:pb-20"
```

- [ ] **Step 2: Upgrade sticky header (line 70)**

Find:
```
className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex flex-col gap-2"
```
Replace with:
```
className="sticky top-0 z-10 bg-white/30 dark:bg-white/10 backdrop-blur-xl border-b border-white/30 dark:border-white/20 px-4 py-3 flex flex-col gap-2"
```

- [ ] **Step 3: Upgrade sort select (line 84)**

Find:
```
className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
```
Replace with:
```
className="rounded-lg border border-white/30 dark:border-white/20 bg-white/30 dark:bg-white/10 px-2 py-1.5 text-xs text-zinc-700 dark:text-white/80 outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
```

- [ ] **Step 4: Upgrade search input (line 122)**

Find:
```
className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
```
Replace with:
```
className="w-full rounded-lg border border-white/30 dark:border-white/20 bg-white/30 dark:bg-white/10 px-3 py-1.5 text-sm text-zinc-700 dark:text-white outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-400 dark:placeholder:text-white/40"
```

- [ ] **Step 5: Upgrade desktop tab bar border (line 130)**

Find:
```
className="hidden sm:flex border-b border-zinc-200 dark:border-zinc-800 px-4"
```
Replace with:
```
className="hidden sm:flex border-b border-white/20 dark:border-white/15 px-4"
```

- [ ] **Step 6: Upgrade inactive desktop tab styling**

In the tab `cn()` call, find the inactive branch string:
```
"border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
```
Replace with:
```
"border-transparent text-zinc-500 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white"
```

- [ ] **Step 7: Upgrade mobile bottom nav (line 219)**

Find:
```
className="fixed bottom-4 left-4 right-4 z-20 flex sm:hidden items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-[0_0_16px_0_rgba(0,0,0,0.10)] p-2"
```
Replace with:
```
className="fixed bottom-4 left-4 right-4 z-20 flex sm:hidden items-center bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/30 dark:border-white/20 rounded-3xl shadow-[var(--glass-shadow)] p-2"
```

- [ ] **Step 8: Upgrade mobile nav active tab indicator**

In the mobile tab `cn()` call, find the active branch string:
```
"bg-violet-100 dark:bg-violet-900/40 text-violet-600"
```
Replace with:
```
"bg-white/30 dark:bg-white/20 text-violet-600 dark:text-violet-400"
```

- [ ] **Step 9: Run lint**

```bash
npm run lint
```

Expected: passes.

- [ ] **Step 10: Visual verify**

Open http://localhost:3000. Expected:
- Gradient visible through the page with no solid background blocking it
- Sticky header is frosted glass
- Sort dropdown and search input have glass backgrounds
- Desktop tab bar border is subtle white/glass
- Mobile nav (resize browser narrow) is frosted glass pill

- [ ] **Step 11: Commit**

```bash
git add components/Dashboard.tsx
git commit -m "feat: apply glassmorphism to Dashboard page wrapper, header, tabs, and mobile nav"
```

---

## Task 5: WineCard

**Files:**
- Modify: `components/WineCard.tsx`

Three changes: remove the solid-bg/ring Card overrides, update image placeholder bg, upgrade hover shadow.

- [ ] **Step 1: Update the Card className prop (line 23–25)**

Find:
```
className="overflow-hidden cursor-pointer group hover:shadow-xl transition-shadow border-0 ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900"
```
Replace with:
```
className="overflow-hidden cursor-pointer group transition-shadow hover:shadow-[var(--glass-shadow-hover)]"
```

- [ ] **Step 2: Update image placeholder bg (line 27)**

Find:
```
className="aspect-[4/5] relative overflow-hidden bg-zinc-100 dark:bg-zinc-800"
```
Replace with:
```
className="aspect-[4/5] relative overflow-hidden bg-white/10"
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: passes.

- [ ] **Step 4: Visual verify**

Wine cards on the dashboard should now be frosted-glass panels. Hovering a card should deepen the shadow. The image overlay gradient (`from-black/60`) should remain visible.

- [ ] **Step 5: Commit**

```bash
git add components/WineCard.tsx
git commit -m "feat: apply glassmorphism to WineCard"
```

---

## Task 6: WineModal

**Files:**
- Modify: `components/WineModal.tsx`

Six changes: main panel, image pane bg, content text/dividers, shared-by badge, modal backdrop opacity, delete confirmation dialog.

- [ ] **Step 1: Update main modal panel (line 128–131)**

Find:
```
className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col md:flex-row max-h-[90vh]"
```
Replace with:
```
className="w-full max-w-2xl bg-white/75 dark:bg-white/20 backdrop-blur-xl border border-white/50 dark:border-white/25 rounded-2xl overflow-hidden shadow-[var(--glass-shadow)] pointer-events-auto flex flex-col md:flex-row max-h-[90vh]"
```

- [ ] **Step 2: Update image pane placeholder bg (line 137)**

Find:
```
className="relative w-full md:w-1/2 h-64 md:h-auto bg-zinc-100 dark:bg-zinc-800"
```
Replace with:
```
className="relative w-full md:w-1/2 h-64 md:h-auto bg-white/10"
```

- [ ] **Step 3: Update modal backdrop opacity (line 113)**

Find:
```
className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
```
Replace with:
```
className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
```

- [ ] **Step 4: Update content pane text and dividers**

Update section label `h3` elements at lines 198 and 214:
- Find: `text-zinc-500 dark:text-zinc-400 uppercase tracking-wider`
- Replace with: `text-zinc-500 dark:text-white/50 uppercase tracking-wider`

Update body text `p` at line 217:
- Find: `text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap`
- Replace with: `text-zinc-700 dark:text-white/80 leading-relaxed whitespace-pre-wrap`

Update date line at line 166:
- Find: `text-zinc-500 dark:text-zinc-400 text-sm`
- Replace with: `text-zinc-500 dark:text-white/50 text-sm`

Update section divider at line 223:
- Find: `border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between`
- Replace with: `border-t border-white/20 dark:border-white/15 flex items-center justify-between`

Update mobile share icon button at line 204:
- Find: `className="md:hidden rounded-full text-zinc-500 dark:text-zinc-400"`
- Replace with: `className="md:hidden rounded-full text-zinc-500 dark:text-white/60"`

Update desktop share button at line 234:
- Find: `className="hidden md:flex gap-2 text-zinc-600 dark:text-zinc-400"`
- Replace with: `className="hidden md:flex gap-2 text-zinc-600 dark:text-white/60"`

- [ ] **Step 5: Update shared-by badge (line 171)**

Find:
```
className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 ring-1 ring-violet-200 dark:ring-violet-700/50"
```
Replace with:
```
className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-violet-700 dark:text-violet-300 border border-white/40 dark:border-white/30"
```

- [ ] **Step 6: Update delete confirmation dialog (line 276)**

Find:
```
className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl pointer-events-auto"
```
Replace with:
```
className="w-full max-w-sm bg-white/75 dark:bg-white/20 backdrop-blur-xl border border-white/50 dark:border-white/25 rounded-2xl p-6 shadow-[var(--glass-shadow)] pointer-events-auto"
```

- [ ] **Step 7: Run lint**

```bash
npm run lint
```

Expected: passes.

- [ ] **Step 8: Visual verify**

Click a wine card to open the modal. Expected:
- Modal panel is heavy frosted glass over the blurred/dimmed gradient
- Image pane placeholder is glass-tinted (not solid zinc)
- Content text is readable (white/80 in dark, zinc-700 in light)
- Section dividers are subtle white/glass lines
- Delete button → confirm dialog is also glass

- [ ] **Step 9: Commit**

```bash
git add components/WineModal.tsx
git commit -m "feat: apply glassmorphism to WineModal and delete confirmation dialog"
```

---

## Task 7: WineForm

**Files:**
- Modify: `components/WineForm.tsx`

Two changes: remove the ring/border Card override so glass shows through, and update the image upload zone.

- [ ] **Step 1: Remove ring/shadow overrides from the Card className (line 88)**

Find:
```
className="w-full max-w-sm mx-auto overflow-hidden border-0 shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-800"
```
Replace with:
```
className="w-full max-w-sm mx-auto overflow-hidden"
```

- [ ] **Step 2: Update image upload zone (line 94–97 — the `cn()` non-image branch)**

Find the class string inside `cn()` that applies when no image is previewed:
```
"border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center cursor-pointer"
```
Replace with:
```
"border-2 border-dashed border-white/40 dark:border-white/35 bg-white/20 dark:bg-white/25 hover:bg-white/30 dark:hover:bg-white/35 transition-colors flex items-center justify-center cursor-pointer"
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: passes.

- [ ] **Step 4: Visual verify**

Click the "+" Add Wine button on the dashboard. Expected:
- The WineForm card (Add Wine modal) is now frosted glass
- The image upload zone has a glass-compatible dashed border (white/translucent, not solid zinc)

- [ ] **Step 5: Commit**

```bash
git add components/WineForm.tsx
git commit -m "feat: apply glassmorphism to WineForm card and image upload zone"
```

---

## Task 8: Login Page

**Files:**
- Modify: `app/login/page.tsx`

Three changes: remove outer container bg, override Card with heavier glass, add glass classes to the Input.

- [ ] **Step 1: Remove background from outer container (line 15)**

Find:
```
className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 gap-4"
```
Replace with:
```
className="min-h-screen flex flex-col items-center justify-center p-4 gap-4"
```

- [ ] **Step 2: Override Card with heavier glass (line 16)**

Find:
```
className="w-full max-w-md border-0 shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800"
```
Replace with:
```
className="w-full max-w-md bg-white/35 dark:bg-white/20 backdrop-blur-xl border border-white/40 dark:border-white/25"
```

- [ ] **Step 3: Add glass classes to the Input (line 28)**

Find:
```
<Input
    name="username"
    placeholder={t.login.usernamePlaceholder}
    required
    className="h-12 text-lg"
/>
```
Replace with:
```
<Input
    name="username"
    placeholder={t.login.usernamePlaceholder}
    required
    className="h-12 text-lg bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 placeholder:text-zinc-400 dark:placeholder:text-white/40"
/>
```

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: passes.

- [ ] **Step 5: Visual verify**

Navigate to http://localhost:3000/login (or log out first). Expected:
- Full gradient background visible
- Login card is a frosted-glass panel (slightly heavier than wine cards)
- Username input has glass styling

- [ ] **Step 6: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: apply glassmorphism to login page"
```

---

## Task 9: Share Page

**Files:**
- Modify: `app/share/[token]/page.tsx`

Four changes: remove outer bg, manually apply glass to card div (no `<Card>` component), update image placeholder, update inner text colors.

- [ ] **Step 1: Remove background from outer container (line 29)**

Find:
```
className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 gap-4"
```
Replace with:
```
className="min-h-screen flex flex-col items-center justify-center p-4 gap-4"
```

- [ ] **Step 2: Apply glass to the card div (line 30)**

Find:
```
className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800"
```
Replace with:
```
className="w-full max-w-sm bg-white/65 dark:bg-white/15 backdrop-blur-lg border border-white/50 dark:border-white/20 rounded-2xl overflow-hidden shadow-[var(--glass-shadow)]"
```

- [ ] **Step 3: Update image area placeholder bg (line 31)**

Find:
```
className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800"
```
Replace with:
```
className="relative aspect-[4/3] w-full overflow-hidden bg-white/10"
```

- [ ] **Step 4: Update inner text colors**

Find (line 49):
```
className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed"
```
Replace with:
```
className="text-zinc-700 dark:text-white/80 text-sm leading-relaxed"
```

Find (line 53):
```
className="text-xs text-zinc-400"
```
Replace with:
```
className="text-xs text-zinc-400 dark:text-white/40"
```

- [ ] **Step 5: Run lint**

```bash
npm run lint
```

Expected: passes.

- [ ] **Step 6: Visual verify**

To test: share a wine from the modal (generates a share token), then open the share URL. Expected:
- Full gradient background visible
- Wine card is frosted glass
- Text is readable in both modes

Alternatively: set `SHARE_TOKEN` in browser URL to a known token, or check visually by inspecting the page at `/share/any-value` (it will 404 but you can see the background rendering).

- [ ] **Step 7: Commit**

```bash
git add app/share/[token]/page.tsx
git commit -m "feat: apply glassmorphism to share page"
```

---

## Task 10: Final Polish & Build Check

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Expected: no errors, no warnings about unknown Tailwind classes.

- [ ] **Step 2: Full visual walkthrough**

With `npm run dev` running, verify each surface:

| Surface | Light mode | Dark mode |
|---|---|---|
| Page background | Blush/lavender gradient visible | Deep burgundy/violet gradient visible |
| Dashboard header | Frosted glass, VinoVault title visible | Same |
| Wine cards | Glass panels over gradient | Same |
| Wine modal | Heavier glass, readable text | Same |
| Delete confirm dialog | Glass panel | Same |
| Add Wine modal (WineForm) | Glass card + dashed upload zone | Same |
| Mobile nav (narrow viewport) | Frosted glass pill | Same |
| Login page | Glass card centered on gradient | Same |
| Share page | Glass card centered on gradient | Same |

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: glassmorphism 2.0 redesign complete — wine-cellar dark glass"
```
