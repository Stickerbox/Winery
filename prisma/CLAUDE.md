# prisma/CLAUDE.md

## Database

SQLite (`prisma/dev.db`) in development via Prisma. Set `DATABASE_URL=file:./dev.db` in `.env`.

## Schema Models

**User** — `id`, `username` (unique), `createdAt`, relations: `wines`, `following`, `followers`, `wishlist`

**Wine** — `id`, `name`, `description`, `rating` (1–5), `imagePath`, `createdAt`, `userId` (FK → User), `shareToken` (unique, nullable), `sharedByUsername` (nullable — set when copied from another user's collection)

**Follow** — `id`, `followerId` (FK → User), `followingId` (FK → User), `createdAt`. Unique on `(followerId, followingId)`.

**WishlistItem** — `id`, `userId` (FK → User), `name`, `description`, `imagePath` (nullable), `addedByUsername`, `createdAt`. Unique on `(userId, name, addedByUsername)` — prevents duplicate wishlist entries silently (P2002 is treated as a no-op in actions).

## Commands

```bash
npx prisma migrate dev --name <name>  # Create and apply a migration (use in development)
npx prisma db push                    # Push schema changes without a migration file
npx prisma generate                   # Regenerate Prisma client after schema changes
npx prisma studio                     # Open database GUI at localhost:5555
```
