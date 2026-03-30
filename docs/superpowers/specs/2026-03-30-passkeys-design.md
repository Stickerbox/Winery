# Passkeys Auth Design

**Date:** 2026-03-30
**Branch:** feature branch (off `main`)
**Status:** Approved, ready for implementation

## Overview

Replace the username-only cookie auth with passkey (WebAuthn) authentication. Users type their username, then the OS passkey prompt handles identity verification — no passwords. The auto-detect flow creates new accounts on first registration and authenticates returning users transparently.

**Library:** `@simplewebauthn/server` (server) + `@simplewebauthn/browser` (client)

---

## 1. Database

New Prisma model:

```prisma
model Credential {
  id           String   @id @default(cuid())
  userId       Int
  user         User     @relation(fields: [userId], references: [id])
  credentialId String   @unique  // base64url-encoded device credential ID
  publicKey    String            // base64url-encoded public key
  counter      Int               // replay attack prevention
  transports   String?           // JSON array e.g. ["internal","hybrid"]
  createdAt    DateTime @default(now())
}
```

`User` gains a `credentials Credential[]` relation. No other schema changes. Username remains the primary identifier. Sessions continue to use the existing `userId` httpOnly cookie.

---

## 2. API Routes

Four new routes under `app/api/auth/`. API routes are required (not server actions) because the browser's WebAuthn API must run client-side between the options and verify steps.

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/register/options` | POST | Receives `{ username }`. If user already has credentials, returns `409`. Otherwise generates a WebAuthn registration challenge and stores it in a short-lived `webauthn-challenge` cookie. |
| `/api/auth/register/verify` | POST | Receives the browser's credential response. Verifies it with SimpleWebAuthn. Creates the `User` and `Credential` records. Sets the `userId` session cookie. Deletes the challenge cookie. |
| `/api/auth/authenticate/options` | POST | Receives `{ username }`. Looks up the user's credentials. Generates an authentication challenge. Stores it in the challenge cookie. |
| `/api/auth/authenticate/verify` | POST | Verifies the signed challenge response. Updates the credential counter. Sets the `userId` session cookie. Deletes the challenge cookie. |

**Challenge cookie:** `webauthn-challenge`, httpOnly, secure in prod, 5-minute max-age. Deleted immediately after the verify step.

**Auto-detect logic:** Lives on the client. Client always calls `/api/auth/register/options` first. A `409` response means the user already has credentials — client switches to the authenticate flow.

---

## 3. Login Page

The login page becomes a client component. Visual appearance is unchanged (username field + button). The submit handler becomes an async JS flow:

1. User enters username, submits
2. POST `/api/auth/register/options`
   - `409` → user exists, redirect to authenticate flow
   - `200` → new user, proceed with registration
3. Call `startRegistration()` or `startAuthentication()` from `@simplewebauthn/browser` — this triggers the OS passkey prompt
4. POST result to `/api/auth/register/verify` or `/api/auth/authenticate/verify`
5. On success, server sets `userId` cookie and returns `{ redirectTo: "/" }`
6. Client navigates to `redirectTo`

**Error states handled:**
- User cancels the passkey prompt
- Device doesn't support WebAuthn
- Server verification failure

All show inline error messages below the form.

**Removed:** The `login()` server action in `auth-actions.ts`. `logout()` and `getCurrentUser()` are untouched.

---

## 4. Passkey Management

A "Security" section added to the dashboard (the existing `/` route), below the wine collection UI.

**Features:**
- **View** registered passkeys: transport type + date added
- **Add** a new passkey: triggers WebAuthn registration for an already-authenticated user via a dedicated `/api/auth/passkeys/add/options` route (bypasses the 409 new-user check) and the existing `/api/auth/register/verify` route
- **Remove** a passkey: guarded — cannot remove the last credential

**New API route:**
- `POST /api/auth/passkeys/add/options` — same as `/api/auth/register/options` but requires an active session and skips the "user already has credentials" check. Used only for adding additional passkeys.

**New server actions in `auth-actions.ts`:**
- `getPasskeys()` — returns current user's credentials
- `removePasskey(id)` — deletes a credential (enforces minimum-one guard)

---

## 5. Error Handling & Edge Cases

- **WebAuthn not supported** (old browser): Show a message explaining passkeys require a modern browser.
- **Username taken** (race condition on register): Return a clear error; user picks a different username.
- **Counter mismatch on auth**: Log and reject — possible cloned authenticator.
- **Last passkey removal attempt**: Return an error; UI disables the remove button when only one credential exists.

---

## 6. Testing

- Unit tests for the verify route handlers (mock SimpleWebAuthn verify functions)
- Integration-style tests for the Prisma credential creation/lookup
- Manual browser testing for the full registration and authentication flows
- Test multiple passkeys: register two, remove one, confirm the other still works

---

## Out of Scope

- Passkey sync across devices (handled automatically by the OS/platform — iCloud Keychain, Google Password Manager, etc.)
- Account recovery if all passkeys are lost (future feature)
- Email/SMS fallback (out of scope — app is personal/low-stakes)
