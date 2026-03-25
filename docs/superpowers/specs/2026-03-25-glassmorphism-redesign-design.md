# Glassmorphism 2.0 Redesign — Design Spec

**Date:** 2026-03-25
**Approach:** Wine-Cellar Dark Glass (Approach A)

---

## Scope

Full-app redesign. Every surface gets the glassmorphism treatment. Applies in both light and dark modes. The page gets a vivid gradient background — the glass effect is only meaningful when there is color behind it.

---

## Background & Color System

### Page Background

Fixed, full-viewport gradient (does not scroll with content).

**Dark mode:**
```css
background: linear-gradient(135deg, #1a0a0f 0%, #2d0a1e 40%, #1e0d3a 100%);
```
Burgundy-black → deep wine-rose → dark indigo-violet.

**Light mode:**
```css
background: linear-gradient(135deg, #f5e6e8 0%, #ede0f0 50%, #dde0f5 100%);
```
Blush rose → soft lavender → cool periwinkle.

### New CSS Variables (`app/globals.css`)

Add to both `:root` (light) and `.dark` (or `@media (prefers-color-scheme: dark)`):

| Variable | Light | Dark |
|---|---|---|
| `--glass-bg` | `rgba(255,255,255,0.65)` | `rgba(255,255,255,0.15)` |
| `--glass-border` | `rgba(255,255,255,0.5)` | `rgba(255,255,255,0.2)` |
| `--glass-shadow` | `0 8px 24px rgba(120,60,80,0.15)` | `0 8px 32px rgba(80,0,30,0.35)` |
| `--glass-shadow-hover` | `0 12px 32px rgba(120,60,80,0.25)` | `0 12px 40px rgba(80,0,30,0.5)` |

The existing `--background` token is repurposed: it no longer sets the page background (the gradient does that) but can remain for any fallback needs.

### Accent Colors
Violet/indigo button accents are unchanged — they read well over both gradient backgrounds in both modes.

---

## Component Specifications

### `components/ui/Card.tsx`

The base glass surface. All other glass components inherit from this pattern.

- **Dark:** `bg-white/15 backdrop-blur-lg border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(80,0,30,0.35)]`
- **Light:** `bg-white/65 backdrop-blur-md border border-white/50 rounded-2xl shadow-[0_8px_24px_rgba(120,60,80,0.15)]`

Replace current solid `bg-white dark:bg-zinc-900` and `ring-1` border with the above.

### `components/WineCard.tsx`

Inherits core glass card styling. Additional rules:

- Image area: add a subtle `bg-gradient-to-b from-transparent to-black/20` overlay at the bottom of the image to maintain legibility of text below it
- Hover shadow: deepen to `--glass-shadow-hover`
- Framer Motion `y: -4` lift on hover — preserved as-is
- Rating stars: `text-violet-400` — unchanged

### `components/WineModal.tsx`

Heavier glass (more opaque) since it sits above cards and needs to feel elevated:

- Panel: `bg-white/20 backdrop-blur-xl border border-white/25 rounded-2xl`
- Backdrop overlay: `bg-black/40 backdrop-blur-sm` — slight blur on background content
- Top border highlight: `border-t border-white/30` for the faint "edge catch" depth cue

### `components/Dashboard.tsx` — Sticky Header

Already partially glass. Upgrade:

- **Dark:** `bg-white/10 backdrop-blur-xl border-b border-white/20`
- **Light:** `bg-white/30 backdrop-blur-xl border-b border-white/30`
- Title/logo text: `text-white` (dark) / `text-zinc-900` (light)

### `app/login/page.tsx`

Centered glass card over the full-viewport gradient. No surrounding container needed — the gradient page background is the context.

- Card: `bg-white/25 backdrop-blur-xl border border-white/30 rounded-2xl`
- Input fields: `bg-white/30 dark:bg-white/10 border border-white/30 rounded-xl`
- Input placeholder: `placeholder:text-white/40` (dark) / `placeholder:text-zinc-400` (light)

### `app/share/[token]/page.tsx`

Same gradient background. Single centered glass card, same treatment as login card.

### `components/ui/Button.tsx`

- **Primary (violet gradient):** Unchanged — solid fills serve as clear CTAs over glass surfaces
- **Ghost/outline variant:** `bg-white/10 border border-white/30 hover:bg-white/20 text-white` — becomes a mini glass element

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

### Badges
Replace current solid `violet-100` / `violet-900/40` badges:
- **Dark:** `bg-white/20 text-white border border-white/30`
- **Light:** `bg-white/50 text-zinc-800 border border-white/40`

---

## What Does Not Change

- Framer Motion animations (spring physics, `y: -4` lift, `layoutId` shared transitions)
- Font family, weight scale, size scale
- Violet/indigo primary button gradient
- Prisma/data layer — this is purely a visual redesign
- Component structure and props — styling only

---

## Files to Modify

| File | Change |
|---|---|
| `app/globals.css` | Add gradient background, glass CSS variables, update dark mode vars |
| `components/ui/Card.tsx` | Replace solid bg/ring with glass classes |
| `components/ui/Button.tsx` | Update ghost/outline variant to glass |
| `components/WineCard.tsx` | Apply glass card, update hover shadow, add image overlay |
| `components/WineModal.tsx` | Heavy glass panel + blurred backdrop |
| `components/Dashboard.tsx` | Upgrade sticky header glass |
| `app/login/page.tsx` | Glass card + glass inputs |
| `app/share/[token]/page.tsx` | Gradient bg + glass card |
