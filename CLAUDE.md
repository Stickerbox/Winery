# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Commands

```bash
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Production build
npm run start     # Run production build locally
npm run lint      # Run ESLint (always run before committing)
npx prisma studio                     # Open Prisma database GUI
npx prisma migrate dev --name <name>  # Create and apply a new migration
npx prisma db push                    # Push schema changes without migration
npx prisma generate                   # Regenerate Prisma client
```

## Workflow

### Discuss Before Building
Always discuss the approach before writing new features or making significant changes. Either of us can suggest switching into the brainstorming skill for more structured exploration — use judgment based on complexity.

### DRY Principles
- Before writing new code, check for existing functions, utilities, or abstractions that can be reused.
- When you see duplicated logic, extract it into a shared helper or utility function.
- Do not copy-paste code blocks — abstract shared behavior into reusable components.
- When modifying code, check if similar patterns exist elsewhere that should also be updated or consolidated.

## Architecture

**VinoVault** — a personal wine collection tracker with social features, built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Prisma, and SQLite.

Live at **jadorele.vin**.

See subdirectory CLAUDE.md files for details on each layer:
- `app/CLAUDE.md` — auth, server actions, routes, AI integration
- `components/CLAUDE.md` — component list, styling conventions
- `lib/CLAUDE.md` — i18n system, utilities
- `prisma/CLAUDE.md` — schema models, database setup

## Deployment

The app runs on an **AWS EC2 Ubuntu** instance via `npm run start` (production build).

### Required Environment Variables

```
DATABASE_URL=file:./dev.db      # SQLite DB path
ANTHROPIC_API_KEY=...           # Required for AI wine label analysis (installed on the server)
RP_ID=jadorele.vin              # WebAuthn relying party ID (domain only, no protocol)
ORIGIN=https://jadorele.vin     # WebAuthn expected origin (full URL with protocol)
```

`ANTHROPIC_API_KEY` must be set on the server — the AI image analysis feature will fail without it.

In development, set in `.env.local`: `RP_ID=localhost` and `ORIGIN=http://localhost:3000`
