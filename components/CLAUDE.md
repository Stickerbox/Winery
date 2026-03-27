# components/CLAUDE.md

## Component List

| Component | Description |
|---|---|
| `Dashboard.tsx` | Main layout; fetches wine list, wishlist, and following feed; renders tabs |
| `WineForm.tsx` | Add wine form — name, description, rating, image upload, AI label analysis |
| `WineGrid.tsx` | Masonry/grid layout for wine cards |
| `WineCard.tsx` | Individual wine card with image, rating, and action buttons |
| `WineModal.tsx` | Full wine detail modal with share, delete, wishlist actions |
| `WishlistGrid.tsx` | Grid layout for wishlist items |
| `WishlistModal.tsx` | Wishlist item detail modal with move-to-collection action |
| `ProfileView.tsx` | Public user profile — their wine grid + follow button |
| `FollowButton.tsx` | Follow/unfollow toggle with optimistic UI |
| `FollowingFeed.tsx` | Feed of wines from followed users |
| `LanguageContext.tsx` | Client-side React context for current language (`en`/`fr`) |

### UI Primitives (`ui/`)

`Button`, `Card`, `Input`, `Textarea`, `RatingStar` — shared primitives used across the app.

## Styling Conventions

- **Tailwind CSS v4** with PostCSS. Theme colors are CSS variables in `app/globals.css`.
- **Frosted glass** — use `bg-white/65 dark:bg-white/15 backdrop-blur-lg border border-white/50 dark:border-white/20` for card surfaces.
- **Gradient accents** — `bg-gradient-to-r from-violet-600 to-indigo-600` for primary buttons and highlights.
- **Dark mode** — handled via `prefers-color-scheme` CSS variables, not a class toggle. Do not add a manual dark mode toggle.
- **Animations** — use Framer Motion for enter/exit transitions and interactive feedback.
- **Icons** — use `lucide-react`.
- `cn()` from `lib/utils.ts` (clsx + tailwind-merge) for conditional class composition — always use this instead of string concatenation.
