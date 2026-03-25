# Glassmorphism 2.0 Redesign — Design Spec

**Date:** 2026-03-25
**Approach:** Wine-Cellar Dark Glass (Approach A)

---

## Scope

Full-app redesign. Every surface gets the glassmorphism treatment. Applies in both light and dark modes. The page gets a vivid gradient background — the glass effect is only meaningful when there is color behind it.

---

## Implementation Pattern

### Dark Mode Mechanism

This project uses `@import "tailwindcss"` with no `tailwind.config` file. In Tailwind v4, this means the `dark:` variant resolves to `@media (prefers-color-scheme: dark)` by default — no `darkMode: 'class'` config is needed or present.

**Authoritative pattern:** Use `dark:` Tailwind utility classes in all component `className` strings. Do not add inline `@media` blocks to component files. CSS variables in `globals.css` are set per mode using the `@media (prefers-color-scheme: dark)` block and consumed via `var()` in Tailwind arbitrary values.

### Glass Card Pattern

The repeating base pattern for all glass surfaces:

```
bg-white/65 dark:bg-white/15
backdrop-blur-md dark:backdrop-blur-lg
border border-white/50 dark:border-white/20
rounded-2xl
shadow-[var(--glass-shadow)]
```

---

## Background & Color System

### Page Background

The gradient is applied to the `html` element (not `body`) so it covers the full viewport without needing `background-attachment: fixed` (which is broken on mobile Safari). `body` background is set to `transparent`.

> **Note on scrolling:** The gradient scrolls with content on very long pages. This is acceptable — the gradient is large enough (full-viewport diagonal) that it reads as a fixed background on any typical wine collection.

**`app/globals.css` canonical structure after changes:**

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

Note: `html` rules are standalone inside the media query — not nested inside `:root`.

### Palette

- **Dark mode background:** Burgundy-black → deep wine-rose → dark indigo-violet
- **Light mode background:** Blush rose → soft lavender → cool periwinkle
- **Accent:** Violet/indigo (unchanged)

---

## Component Specifications

### `components/ui/Card.tsx`

**Current (line 11):**
```
rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50
```

**Replace with:**
```
rounded-2xl bg-white/65 dark:bg-white/15 backdrop-blur-md dark:backdrop-blur-lg border border-white/50 dark:border-white/20 text-zinc-950 dark:text-zinc-50 shadow-[var(--glass-shadow)]
```

Changes: `rounded-xl` → `rounded-2xl`; `border border-zinc-200 dark:border-zinc-800` → `border border-white/50 dark:border-white/20`; `bg-white dark:bg-zinc-950` → `bg-white/65 dark:bg-white/15`; add `backdrop-blur-md dark:backdrop-blur-lg`; `shadow-sm` → `shadow-[var(--glass-shadow)]`.

---

### `components/WineCard.tsx`

`<Card>` is called with an explicit className override on line 24:
```
overflow-hidden cursor-pointer group hover:shadow-xl transition-shadow border-0 ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900
```

**Replace with:**
```
overflow-hidden cursor-pointer group transition-shadow hover:shadow-[var(--glass-shadow-hover)]
```

Changes: Remove `border-0 ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900` (these override the new Card glass styles and must be gone). Replace `hover:shadow-xl` with `hover:shadow-[var(--glass-shadow-hover)]` — do not add alongside, replace. Keep `overflow-hidden cursor-pointer group transition-shadow`.

**Image placeholder div** (`bg-zinc-100 dark:bg-zinc-800` on line 27): Replace with `bg-white/10`.

**Image overlay** (`bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60` on line 33): Keep as-is.

**`backdrop-blur` note:** The `backdrop-blur` from `<Card>` blurs what is visible through the card's translucent background (the page gradient behind the card). It does not affect the `<img>` inside — the image is opaque and fills its container independently. No blur suppression needed.

---

### `components/WineModal.tsx`

#### Main modal panel (line 130)

**Current:**
```
w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col md:flex-row max-h-[90vh]
```

**Replace `bg-white dark:bg-zinc-900 shadow-2xl` only.** Keep all layout classes unchanged. Result:
```
w-full max-w-2xl bg-white/75 dark:bg-white/20 backdrop-blur-xl border border-white/50 dark:border-white/25 rounded-2xl overflow-hidden shadow-[var(--glass-shadow)] pointer-events-auto flex flex-col md:flex-row max-h-[90vh]
```

#### Image pane placeholder bg (line 137)

`bg-zinc-100 dark:bg-zinc-800` → `bg-white/10`

#### Content pane text and dividers

| Element | Current | Replace with |
|---|---|---|
| Section label `h3` (lines 198, 214) | `text-zinc-500 dark:text-zinc-400` | `text-zinc-500 dark:text-white/50` |
| Body text `p` (line 217) | `text-zinc-700 dark:text-zinc-300` | `text-zinc-700 dark:text-white/80` |
| Wine title `h2` (line 163) | `text-zinc-900 dark:text-white` | Keep as-is |
| Date line (line 166) | `text-zinc-500 dark:text-zinc-400` | `text-zinc-500 dark:text-white/50` |
| Section divider (line 223) | `border-t border-zinc-200 dark:border-zinc-800` | `border-t border-white/20 dark:border-white/15` |
| Mobile share icon button (line 204) | `text-zinc-500 dark:text-zinc-400` | `text-zinc-500 dark:text-white/60` |
| Desktop share button (line 234) | `text-zinc-600 dark:text-zinc-400` | `text-zinc-600 dark:text-white/60` |

#### Shared-by badge (line 171)

**Current:** `bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 ring-1 ring-violet-200 dark:ring-violet-700/50`
**Replace with:** `bg-white/20 text-violet-700 dark:text-violet-300 border border-white/40 dark:border-white/30`

#### Modal backdrop (line 113)

`bg-black/60 backdrop-blur-sm` → `bg-black/40 backdrop-blur-sm`

Rationale: the vivid gradient contributes its own atmospheric depth behind the overlay; lighter at 40% keeps the glass panel legible while letting the background color contribute to the mood.

#### Delete confirmation dialog (line 276)

**Current:**
```
w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl pointer-events-auto
```

**Replace `bg-white dark:bg-zinc-900 shadow-2xl` only.** Keep all layout classes. Result:
```
w-full max-w-sm bg-white/75 dark:bg-white/20 backdrop-blur-xl border border-white/50 dark:border-white/25 rounded-2xl p-6 shadow-[var(--glass-shadow)] pointer-events-auto
```

Text inside (`text-zinc-900 dark:text-white`): Keep as-is.

---

### `components/WineForm.tsx`

`WineForm` uses `<Card>` (line 88) with this className override:
```
w-full max-w-sm mx-auto overflow-hidden border-0 shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-800
```

The `border-0 ring-1 ring-zinc-200 dark:ring-zinc-800 shadow-lg` override will suppress the new glass border from Card.tsx. **Remove these override classes.** Keep `w-full max-w-sm mx-auto overflow-hidden`. Result:
```
w-full max-w-sm mx-auto overflow-hidden
```

**Image upload zone** (line 96):

**Current:** `border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800`

**Replace with:**
```
border-2 border-dashed border-white/40 dark:border-white/35 bg-white/20 dark:bg-white/25 hover:bg-white/30 dark:hover:bg-white/35
```

Light mode: `bg-white/20` appears slightly more transparent than the card (`bg-white/65`), providing a subtle recessed feel. Dark mode: `bg-white/25` provides visible contrast over the card's `bg-white/15`.

---

### `components/Dashboard.tsx` — Page Wrapper (line 69)

**Current:** `min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-36 sm:pb-20`
**Replace with:** `min-h-screen pb-36 sm:pb-20`

---

### `components/Dashboard.tsx` — Sticky Header (line 70)

**Current:** `bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800`
**Replace with:** `bg-white/30 dark:bg-white/10 backdrop-blur-xl border-b border-white/30 dark:border-white/20`

**Sort `<select>` (line 84):**

Replace only the bg/border/text-color token groups; keep all other classes (`rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer`). Full result:
```
rounded-lg border border-white/30 dark:border-white/20 bg-white/30 dark:bg-white/10 px-2 py-1.5 text-xs text-zinc-700 dark:text-white/80 outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer
```

**Search `<input>` (line 122):**

Replace only the bg/border token groups; keep all other classes (`w-full rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-500`). Full result:
```
w-full rounded-lg border border-white/30 dark:border-white/20 bg-white/30 dark:bg-white/10 px-3 py-1.5 text-sm text-zinc-700 dark:text-white outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-400 dark:placeholder:text-white/40
```

**VinoVault title** (`from-violet-600 to-indigo-600`): Keep as-is.

---

### `components/Dashboard.tsx` — Desktop Tab Bar (line 130)

**Container border:** `border-b border-zinc-200 dark:border-zinc-800` → `border-b border-white/20 dark:border-white/15`

**Active tab** (`border-violet-600 text-violet-600`): Keep as-is.

**Inactive tab:**
**Current:** `border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100`
**Replace with:** `border-transparent text-zinc-500 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white`

Light mode keeps `text-zinc-500 hover:text-zinc-900` — white text is invisible against the light pastel gradient. Dark mode uses `text-white/60 dark:hover:text-white`.

---

### `components/Dashboard.tsx` — Mobile Bottom Nav (line 219)

**Current:** `bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800`

Replace the bg/blur/border tokens and replace the existing `shadow-[0_0_16px_0_rgba(0,0,0,0.10)]` with `shadow-[var(--glass-shadow)]`. Keep all layout classes (`fixed bottom-4 left-4 right-4 z-20 flex sm:hidden items-center rounded-3xl p-2`). Full result:
```
fixed bottom-4 left-4 right-4 z-20 flex sm:hidden items-center bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/30 dark:border-white/20 rounded-3xl shadow-[var(--glass-shadow)] p-2
```

**Active tab indicator:**
**Current:** `bg-violet-100 dark:bg-violet-900/40 text-violet-600`
**Replace with:** `bg-white/30 dark:bg-white/20 text-violet-600 dark:text-violet-400`

---

### `app/login/page.tsx`

**Outer container (line 15):**
**Current:** `min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 gap-4`
**Replace with:** `min-h-screen flex flex-col items-center justify-center p-4 gap-4`

**`<Card>` className override (line 16):**
**Current:** `w-full max-w-md border-0 shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800`

Remove `border-0 shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800` — these override Card's glass styles. Override with heavier glass instead:
```
w-full max-w-md bg-white/35 dark:bg-white/20 backdrop-blur-xl border border-white/40 dark:border-white/25
```

**`<Input>` fields:** Add to Input className:
`bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 placeholder:text-zinc-400 dark:placeholder:text-white/40`

---

### `app/share/[token]/page.tsx`

The share page does **not** use `<Card>` — glass must be applied manually.

**Outer container (line 29):**
**Current:** `min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 gap-4`
**Replace with:** `min-h-screen flex flex-col items-center justify-center p-4 gap-4`

**Card div (line 30):**
**Current:** `w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800`
**Replace with:** `w-full max-w-sm bg-white/65 dark:bg-white/15 backdrop-blur-lg border border-white/50 dark:border-white/20 rounded-2xl overflow-hidden shadow-[var(--glass-shadow)]`

**Image area placeholder bg (line 31):**
`bg-zinc-100 dark:bg-zinc-800` → `bg-white/10`

**Inner text:**
| Element | Current | Replace with |
|---|---|---|
| Description | `text-zinc-600 dark:text-zinc-300` | `text-zinc-700 dark:text-white/80` |
| Date | `text-xs text-zinc-400` | `text-xs text-zinc-400 dark:text-white/40` |

---

### `components/ui/Button.tsx`

Two variants need updating. All others (`default`, `destructive`, `secondary`, `link`) are unchanged.

**`ghost` variant (line 60):**
**Current:** `hover:bg-zinc-100 text-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-50`
**Replace with:** `hover:bg-white/20 dark:hover:bg-white/15 text-zinc-900 dark:text-white`

**`outline` variant (line 58):**
**Current:** `border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800 dark:text-zinc-50`
**Replace with:** `border border-white/40 dark:border-white/25 bg-white/20 dark:bg-white/10 hover:bg-white/35 dark:hover:bg-white/20 text-zinc-900 dark:text-white`

> **Exception — WineModal nav arrow buttons (lines 123, 251):** Use `ghost` but with explicit `bg-black/20 hover:bg-black/40 text-white` className overrides. Preserve as-is — these are intentional dark-overlay buttons on the image edge.

> **Exception — WineModal delete button (line 226):** Uses `ghost` with explicit `text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950` override. Preserve as-is.

---

## Typography & Text Treatment

### Dark Mode (on glass panels)
| Role | Token |
|---|---|
| Primary text | `text-white` |
| Secondary/muted | `text-white/70` |
| Labels/metadata | `text-white/50` |
| Interactive/links | `text-violet-400` |

### Light Mode (on glass panels)
| Role | Token |
|---|---|
| Primary text | `text-zinc-900` |
| Secondary/muted | `text-zinc-600` |
| Labels/metadata | `text-zinc-400` |
| Interactive/links | `text-violet-600` |

---

## What Does Not Change

- Framer Motion animations (spring physics, `y: -4` lift, `layoutId` shared transitions)
- Font family, weight scale, size scale
- Violet/indigo primary (`default`) button gradient and `destructive`, `secondary`, `link` variants
- WineCard image gradient overlay (already exists — keep as-is)
- WineModal nav arrow button explicit style overrides
- WineModal delete button color (red explicit override)
- Prisma/data layer — purely a visual redesign
- Component structure, props, and logic — styling changes only

---

## Files to Modify

| File | Change |
|---|---|
| `app/globals.css` | Add gradient to `html` in both modes; `body { background: transparent }`; add `--glass-shadow` / `--glass-shadow-hover` CSS variables |
| `components/ui/Card.tsx` | Replace border/bg/shadow with glass classes; `rounded-xl` → `rounded-2xl`; add `backdrop-blur` |
| `components/ui/Button.tsx` | Update `ghost` and `outline` variants to glass |
| `components/WineCard.tsx` | Remove bg/ring Card overrides; replace `hover:shadow-xl` with glass hover shadow; update image placeholder bg |
| `components/WineModal.tsx` | Heavy glass on main panel + delete dialog; backdrop 60→40; image pane bg; inner text/divider/badge updates |
| `components/WineForm.tsx` | Remove ring/border Card overrides; update image upload zone to glass-compatible dashed style |
| `components/Dashboard.tsx` | Remove page bg; upgrade header, tab bar, mobile nav; update select/search inputs |
| `app/login/page.tsx` | Remove outer bg; remove ring Card overrides + apply heavier glass; glass input fields |
| `app/share/[token]/page.tsx` | Remove outer bg; manually apply glass to card div + image placeholder; update inner text |
