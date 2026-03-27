# app/CLAUDE.md

## Auth

Cookie-based sessions, no passwords. Users log in by username only — account is auto-created on first login.

- `auth-actions.ts` — `login()`, `logout()`, `getCurrentUser()`
- Sets an HTTP-only `userId` cookie with 7-day expiry
- `getCurrentUser()` is called from server components and actions to guard all protected routes

## Routes

| Route | File | Description |
|---|---|---|
| `/` | `page.tsx` | Checks auth, renders `<Dashboard>` |
| `/login` | `login/page.tsx` | Username login form |
| `/u/[username]` | `u/[username]/page.tsx` | Public profile page |
| `/share/[token]` | `share/[token]/page.tsx` | Shareable wine link (no auth required to view) |

## Database Access Pattern

All DB access goes through server actions in `actions.ts` — with one exception: `app/share/[token]/page.tsx` queries Prisma directly. This is intentional — it's a public-facing, read-only page that was kept self-contained. Don't treat it as a precedent; new routes should use actions.

## Server Actions (`actions.ts`)

All DB writes go through server actions. All actions call `getCurrentUser()` first and throw `"Unauthorized"` if no session.

**Wine CRUD**
- `addWine(formData)` — uploads image via `uploadWineImage()`, creates Wine record
- `deleteWine(id)` — deletes wine and its image file (unless shared by another record)
- `getWines()` — returns current user's wines, newest first

**AI Image Analysis**
- `analyzeWineImage(formData)` — sends wine label image to Claude (`claude-opus-4-6`) via `@anthropic-ai/sdk`, returns `{ name, description }`. Requires `ANTHROPIC_API_KEY` on the server. Detects language from `Accept-Language` header and responds in English or French accordingly.

**Sharing**
- `generateShareToken(wineId)` — creates a UUID share token on the Wine record (idempotent)
- `addSharedWine(token)` — copies a shared wine into the current user's collection

**Social**
- `followUser(userId)` / `unfollowUser(userId)` — manage Follow records
- `getIsFollowing(userId)` — returns boolean
- `getFollowingFeed()` — returns wines from all followed users, newest first
- `getUserProfile(username)` — returns user + their wines for public profile pages

**Wishlist**
- `addToWishlist(wineId)` — saves a wine from another user's collection to current user's wishlist
- `addToWishlistManual(formData)` — adds a wishlist item manually with image upload
- `removeFromWishlist(itemId)` — removes wishlist item
- `getWishlist()` — returns current user's wishlist, newest first
- `moveToCollection(itemId, formData)` — promotes wishlist item to wine collection in a single transaction

## Image Handling

Images are processed with `sharp` on upload: resized to max 1200px wide, converted to JPEG at 80% quality, saved to `public/uploads/<uuid>.jpg`. The relative path (`/uploads/<filename>`) is stored in the DB. Wishlist items snapshot the image path from the original wine — they do not own the file.
