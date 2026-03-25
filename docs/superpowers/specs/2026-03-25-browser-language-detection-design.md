# Browser Language Detection

**Date:** 2026-03-25
**Status:** Approved

## Overview

Replace the manual language toggle buttons with automatic language detection. Client-side pages use `navigator.language`; server-rendered pages use the `Accept-Language` HTTP header. No user interaction required.

## Supported Languages

- French (`fr`) — detected when the language string starts with `"fr"` (covers `fr`, `fr-FR`, `fr-CA`, etc.)
- English (`en`) — all other languages, including unsupported ones (e.g. Spanish, German)

## Shared Detection Utility

Add two exported functions to `lib/i18n/index.ts`:

```ts
// Client-side: reads navigator.language
export function detectClientLang(): Lang {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.startsWith("fr") ? "fr" : "en";
}

// Server-side: reads Accept-Language header value
export function detectServerLang(acceptLanguage: string | null | undefined): Lang {
  if (!acceptLanguage) return "en";
  return acceptLanguage.toLowerCase().includes("fr") ? "fr" : "en";
}
```

Both functions live alongside `getT()` in `lib/i18n/index.ts`. This keeps the detection logic in one place.

## Changes

### `lib/i18n/index.ts`

Add `detectClientLang()` and `detectServerLang()` as described above. No other changes to this file.

### `components/LanguageContext.tsx`

- Remove `readLangCookie()` entirely
- In `LanguageProvider`, replace `setLangState(readLangCookie())` in the `useEffect` with `setLangState(detectClientLang())`
- Remove `setLang` callback and cookie write (`document.cookie = ...`)
- Remove `setLang` from the `LanguageContextValue` interface — this is an intentional, breaking removal of a public API. No other code calls `setLang` once `LanguageToggle` is deleted.
- Import `detectClientLang` from `@/lib/i18n`

### `components/LanguageToggle.tsx`

Delete the file entirely.

### `components/Dashboard.tsx`

- Remove `import { LanguageToggle }`
- Remove the `<LanguageToggle />` JSX and its `<div className="flex justify-center pb-6">` wrapper at the bottom of `<main>`

### `app/layout.tsx`

- Remove the `cookies()` import and the `const lang = (await cookies()).get("lang")?.value ?? "en"` line
- Import `headers` from `next/headers` and `detectServerLang` from `@/lib/i18n`
- Replace the cookie read with:
  ```ts
  const lang = detectServerLang((await headers()).get("accept-language"));
  ```
- The `<html lang={lang}>` attribute continues to work as before

### `app/login/page.tsx`

- Remove `import { cookies } from "next/headers"` (no longer needed)
- Remove `const lang = (await cookies()).get("lang")?.value ?? "en"`
- Import `headers` from `next/headers` and `detectServerLang` from `@/lib/i18n`
- Replace the cookie read with:
  ```ts
  const lang = detectServerLang((await headers()).get("accept-language"));
  ```
- Remove `import { LanguageToggle }` and `<LanguageToggle />` from the JSX

### `app/share/[token]/page.tsx`

- Remove `cookieStore.get("lang")?.value ?? "en"` and the `cookieStore` variable (keep the `cookies()` call only if still needed for other purposes — it is not, so remove it entirely)
- Import `headers` from `next/headers` and `detectServerLang` from `@/lib/i18n`
- Replace the cookie read with:
  ```ts
  const lang = detectServerLang((await headers()).get("accept-language"));
  ```
- Remove `import { LanguageToggle }` and `<LanguageToggle />` from the JSX

## What Does Not Change

- `lib/i18n/en.ts` and `lib/i18n/fr.ts` — translation files are untouched
- `getT()` — untouched
- All components using `useTranslations()` continue to work unchanged
- `LanguageContext` and `useTranslations` hook remain in place

## Behaviour

| Language signal | UI language |
|---|---|
| `fr`, `fr-FR`, `fr-CA`, etc. | Français |
| `en`, `en-US`, `en-GB`, etc. | English |
| Any other (Spanish, German, etc.) | English |
| No signal at all | English |
