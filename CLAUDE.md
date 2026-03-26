# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Code Style Guidelines

- Follow DRY principles strictly. Before writing new code, check for existing functions, utilities, or abstractions that can be reused.
- When you see duplicated logic, extract it into a shared helper or utility function.
- Do not copy-paste code blocks — abstract shared behavior into reusable components.
- When modifying code, check if similar patterns exist elsewhere that should also be updated or consolidated.

## Commands

```bash
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Production build
npm run lint      # Run ESLint
npx prisma studio # Open Prisma database GUI
npx prisma migrate dev --name <name>  # Create and apply a new migration
npx prisma db push                    # Push schema changes without migration
npx prisma generate                   # Regenerate Prisma client
```

## Architecture

**VinoVault** — a personal wine collection tracker built with Next.js App Router.

### Auth
Cookie-based session with no passwords — users log in by username only (auto-created on first login). `auth-actions.ts` sets/reads an HTTP-only `userId` cookie (7-day expiry). `getCurrentUser()` is called from server components and actions to guard routes.

### Data Flow
Server actions in `app/actions.ts` handle wine CRUD. `app/auth-actions.ts` handles login/logout. All DB access goes through the Prisma client. Images uploaded via form are written directly to `public/uploads/` with UUID filenames and the relative path is stored in the `Wine.imagePath` field.

### Database
SQLite (`prisma/dev.db`) in development via Prisma. Schema has two models: `User` (id, username) and `Wine` (id, name, description, rating 1-5, imagePath, userId FK, createdAt). Set `DATABASE_URL` in `.env` (already present as `file:./dev.db`).

### Key Files
- `app/page.tsx` — root page; checks auth and renders `<Dashboard>`
- `app/login/page.tsx` — login form
- `app/actions.ts` — `addWine`, `getWines` server actions
- `app/auth-actions.ts` — `login`, `logout`, `getCurrentUser`
- `components/Dashboard.tsx` — main layout, fetches wine list
- `components/WineForm.tsx` — add wine form (name, description, rating, image)
- `components/WineGrid.tsx` / `WineCard.tsx` / `WineModal.tsx` — display layer
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `components/ui/` — Button, Card, Input, Textarea, RatingStar

### Styling
Tailwind CSS v4 with PostCSS. Theme colors defined as CSS variables in `app/globals.css`. UI uses violet/indigo gradient accents, frosted-glass effects (`backdrop-blur`), and Framer Motion animations. Dark mode is handled via `prefers-color-scheme` CSS variables.