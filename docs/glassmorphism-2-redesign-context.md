# Glassmorphism 2.0 Redesign — Context for New Session

## User Request

Convert the VinoVault app UI to use Glassmorphism 2.0 style.

Reference Figma file (couldn't be fetched — 403): https://www.figma.com/community/file/1573593284507887404/glassmorphism-2-0-makeover

---

## Glassmorphism 2.0 — Style Research

### What It Is

Glassmorphism 2.0 (2020+) is the modern frosted-glass UI style popularized by macOS Big Sur and Windows 11. It uses semi-transparent, blurred panels layered over vivid colorful backgrounds to create depth and elegance. Contrast with original "Aero" glassmorphism (heavy, glossy, skeuomorphic).

### Core CSS Properties

```css
/* Standard glass card */
background: rgba(255, 255, 255, 0.15);
backdrop-filter: blur(10px–20px) saturate(180%);
-webkit-backdrop-filter: blur(10px–20px) saturate(180%);
border-radius: 12px–16px;
border: 1px solid rgba(255, 255, 255, 0.2);
box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);

/* Heavy/opaque glass (headers, nav bars) */
background: rgba(255, 255, 255, 0.75);
backdrop-filter: blur(16px) saturate(180%);
border: 1px solid rgba(209, 213, 219, 0.3);

/* Light/subtle glass */
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(5px);
```

### Tailwind Equivalents

- `backdrop-blur-md` / `backdrop-blur-lg` / `backdrop-blur-xl`
- `bg-white/10` to `bg-white/20` (cards over dark bg) or `bg-white/70` (heavy, over light bg)
- `rounded-2xl` / `rounded-3xl`
- `border border-white/20`
- `shadow-[0_8px_32px_rgba(31,38,135,0.37)]` or custom arbitrary shadows
- `saturate-150` / `saturate-200` (if supported)

### Key Aesthetic Traits

- **Vivid gradient background** — the glass effect only looks good over a colorful, blurred background. Cards need something interesting behind them.
- **Frosted, not glossy** — no shine gradients on surfaces themselves; the blur does the work
- **Light border** — `rgba(255,255,255,0.2)` top/left highlight border for depth
- **Soft, deep shadow** — not sharp drop shadows; wide, diffuse colored shadows
- **High contrast text** — white or near-white text on glass panels over dark backgrounds
- **Rounded corners** — `rounded-2xl` or `rounded-3xl` is standard

### Dark Mode Adaptation

- Dark mode: `bg-black/20` to `bg-black/40` glass panels over a dark gradient background
- Borders: `border-white/10` to `border-white/20`
- The background gradient shifts to deep purples, navies, or dark teals

---

## Current VinoVault App Design System

### Files to Modify (confirmed)

| File | Current Style | Notes |
|------|--------------|-------|
| `app/globals.css` | CSS vars, zinc/white bg | Background gradient needs adding here |
| `components/ui/Button.tsx` | Violet + zinc variants | Ghost/outline variants need glass treatment |
| `components/ui/Card.tsx` | White/zinc-900 bg, ring-1 | Core glass card component |
| `components/WineCard.tsx` | Solid bg, shadow-sm→xl | Becomes a glass card |
| `components/WineModal.tsx` | Dark bg, shadow-2xl | Becomes full glass modal |
| `components/Dashboard.tsx` | Sticky header w/ backdrop-blur | Already partially glass — enhance |
| `app/login/page.tsx` | Solid Card, shadow-xl | Becomes glass login card |
| `app/share/[token]/page.tsx` | Solid white/zinc bg | Becomes glass share card |

### Current Color Palette

- Primary: `violet-600` / `indigo-600` gradient
- Neutral: zinc scale (50, 100, 200, 800, 900, 950)
- Dark bg: `zinc-950`
- Badges: `violet-100` / `violet-900/40`

### Already Uses Partial Glass

- `bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md` — sticky header and mobile nav
- `bg-black/60` — modal backdrop
- `bg-black/20 hover:bg-black/40` — image overlay buttons

### Animation System

- Framer Motion throughout
- Spring physics (`stiffness: 300, damping: 30`)
- Card hover: `y: -4` lift
- Shared element transitions with `layoutId`

---

## Brainstorming Status

- **Explore context**: ✅ Done
- **Visual companion**: Declined (terminal only)
- **Clarifying questions**: Not yet asked
- **Approaches**: Not yet proposed
- **Design**: Not yet written
- **Spec**: Not yet written

## Next Steps for New Session

Pick up from "Ask clarifying questions" step. Key questions still to ask:
1. How deep/pervasive — full rebrand of every surface, or just key surfaces (cards, modals, header)?
2. Background approach — should the app get a vivid gradient background page, or keep the current zinc/white bg?
3. Dark mode — should glassmorphism only apply in dark mode, or in both light and dark?

Then propose 2-3 approaches (scope options: full vs partial vs dark-mode-only).
