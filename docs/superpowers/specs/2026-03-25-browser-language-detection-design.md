# Browser Language Detection

**Date:** 2026-03-25
**Status:** Approved

## Overview

Replace the manual language toggle buttons with automatic browser language detection. The app detects the user's browser language on mount and sets the UI language accordingly. No user interaction required.

## Supported Languages

- French (`fr`) — detected when `navigator.language` starts with `"fr"` (covers `fr`, `fr-FR`, `fr-CA`, etc.)
- English (`en`) — all other languages, including unsupported ones (e.g. Spanish, German)

## Changes

### `components/LanguageContext.tsx`

Replace `readLangCookie()` with `detectLang()`:

```ts
function detectLang(): Lang {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.startsWith("fr") ? "fr" : "en";
}
```

- Remove `setLang` from `LanguageContextValue` interface and `LanguageProvider` implementation
- Remove the cookie write (`document.cookie = ...`)
- `useEffect` calls `setLangState(detectLang())` instead of `setLangState(readLangCookie())`
- Initial SSR state remains `"en"` (same as before); correct language is applied after hydration

### `components/LanguageToggle.tsx`

Delete the file entirely.

### `components/Dashboard.tsx`

- Remove `import { LanguageToggle }`
- Remove the `<LanguageToggle />` JSX and its `<div className="flex justify-center pb-6">` wrapper at the bottom of `<main>`

## What Does Not Change

- `lib/i18n/` — translation files and `getT()` function are untouched
- All components using `useTranslations()` continue to work unchanged
- `LanguageContext` and `useTranslations` hook remain — only `setLang` is removed

## Behaviour

| Browser language | UI language |
|---|---|
| `fr`, `fr-FR`, `fr-CA`, etc. | Français |
| `en`, `en-US`, `en-GB`, etc. | English |
| Any other (Spanish, German, etc.) | English |
