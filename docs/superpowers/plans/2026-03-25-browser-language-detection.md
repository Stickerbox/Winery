# Browser Language Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace manual language toggle buttons with automatic detection — `navigator.language` on the client, `Accept-Language` header on the server.

**Architecture:** Two utility functions are added to `lib/i18n/index.ts` as the single source of truth for language detection. `LanguageContext.tsx` is updated to use the client function; all server pages are updated to use the server function. `LanguageToggle.tsx` is deleted and removed from all consumers.

**Tech Stack:** Next.js App Router, React context, `next/headers` (`headers()` and `cookies()`), TypeScript

---

## File Map

| File | Change |
|------|--------|
| `lib/i18n/index.ts` | Add `detectClientLang()` and `detectServerLang()` |
| `components/LanguageContext.tsx` | Replace `readLangCookie()` with `detectClientLang()`, remove `setLang` |
| `components/LanguageToggle.tsx` | **Delete** |
| `components/Dashboard.tsx` | Remove `LanguageToggle` import and JSX |
| `app/layout.tsx` | Replace cookie read with `detectServerLang(Accept-Language header)` |
| `app/login/page.tsx` | Replace cookie read with `detectServerLang()`, remove `LanguageToggle` |
| `app/share/[token]/page.tsx` | Replace cookie read with `detectServerLang()`, remove `cookies()` and `LanguageToggle` |

---

### Task 1: Add detection utilities to `lib/i18n/index.ts`

**Files:**
- Modify: `lib/i18n/index.ts`

This is the foundation for all other tasks. Both detection functions live here so the "fr vs everything else" logic is defined in one place.

- [ ] **Step 1: Add `detectClientLang` and `detectServerLang` to `lib/i18n/index.ts`**

Open `lib/i18n/index.ts`. The current file is:

```ts
import { en } from "./en";
import { fr } from "./fr";

export type Lang = "en" | "fr";
export type Translations = typeof en;

const translations = { en, fr } as const;

export function getT(lang: string): Translations {
  return lang === "fr" ? translations.fr : translations.en;
}
```

Add the two new functions after `getT`:

```ts
import { en } from "./en";
import { fr } from "./fr";

export type Lang = "en" | "fr";
export type Translations = typeof en;

const translations = { en, fr } as const;

export function getT(lang: string): Translations {
  return lang === "fr" ? translations.fr : translations.en;
}

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

- [ ] **Step 2: Verify lint passes**

Run: `npm run lint`

Expected: no new errors in `lib/i18n/index.ts`. (Pre-existing errors in `Input.tsx`, `Textarea.tsx`, and `share/[token]/page.tsx` are unrelated — ignore them.)

- [ ] **Step 3: Commit**

```bash
git add lib/i18n/index.ts
git commit -m "feat: add detectClientLang and detectServerLang utilities"
```

---

### Task 2: Update `LanguageContext.tsx` and delete `LanguageToggle.tsx`

**Files:**
- Modify: `components/LanguageContext.tsx`
- Delete: `components/LanguageToggle.tsx`

`LanguageToggle.tsx` is the only consumer of `setLang`. Both files are changed together so that after this task `setLang` has no call sites and can be cleanly removed from the context interface.

- [ ] **Step 1: Rewrite `components/LanguageContext.tsx`**

Replace the entire file with:

```tsx
"use client";

import * as React from "react";
import { getT, detectClientLang, type Lang, type Translations } from "@/lib/i18n";

interface LanguageContextValue {
  lang: Lang;
  t: Translations;
}

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("en");

  React.useEffect(() => {
    setLangState(detectClientLang());
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t: getT(lang) }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslations(): LanguageContextValue {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslations must be used inside LanguageProvider");
  return ctx;
}
```

Key changes vs the original:
- `readLangCookie()` removed; `detectClientLang()` used instead
- `setLang` callback and `document.cookie` write removed
- `setLang` removed from `LanguageContextValue` interface
- `detectClientLang` imported from `@/lib/i18n`

- [ ] **Step 2: Delete `components/LanguageToggle.tsx`**

```bash
rm components/LanguageToggle.tsx
```

- [ ] **Step 3: Verify lint passes**

Run: `npm run lint`

Expected: no errors in `LanguageContext.tsx`. There will now be errors in `Dashboard.tsx`, `login/page.tsx`, and `share/[token]/page.tsx` about missing `LanguageToggle` — these are expected and will be fixed in Tasks 3 and 4.

- [ ] **Step 4: Commit**

```bash
git add components/LanguageContext.tsx
git rm components/LanguageToggle.tsx
git commit -m "feat: replace cookie-based lang with browser language detection, remove LanguageToggle"
```

---

### Task 3: Remove `LanguageToggle` from `components/Dashboard.tsx`

**Files:**
- Modify: `components/Dashboard.tsx`

- [ ] **Step 1: Remove the import**

Find line 10 in `components/Dashboard.tsx`:

```tsx
import { LanguageToggle } from "@/components/LanguageToggle";
```

Delete that line entirely.

- [ ] **Step 2: Remove the JSX**

Find the `LanguageToggle` usage near the bottom of `<main>` (around line 163):

```tsx
<div className="flex justify-center pb-6">
    <LanguageToggle />
</div>
```

Delete both lines (the wrapper `<div>` and `<LanguageToggle />`).

- [ ] **Step 3: Verify lint passes**

Run: `npm run lint`

Expected: no errors in `Dashboard.tsx`.

- [ ] **Step 4: Commit**

```bash
git add components/Dashboard.tsx
git commit -m "feat: remove LanguageToggle from Dashboard"
```

---

### Task 4: Update server pages to use `Accept-Language` header

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/login/page.tsx`
- Modify: `app/share/[token]/page.tsx`

All three server pages currently read a `lang` cookie. Replace each with `detectServerLang()` reading the `Accept-Language` header. Remove `LanguageToggle` from `login` and `share` pages.

- [ ] **Step 1: Update `app/layout.tsx`**

Current relevant lines:

```ts
import { cookies } from "next/headers";
// ...
const lang = (await cookies()).get("lang")?.value ?? "en";
```

Replace with:

```ts
import { headers } from "next/headers";
import { detectServerLang } from "@/lib/i18n";
// ...
const lang = detectServerLang((await headers()).get("accept-language"));
```

Remove the `import { cookies } from "next/headers"` line. The `<html lang={lang}>` line is unchanged.

- [ ] **Step 2: Update `app/login/page.tsx`**

Current relevant lines:

```ts
import { cookies } from "next/headers";
import { LanguageToggle } from "@/components/LanguageToggle";
// ...
const lang = (await cookies()).get("lang")?.value ?? "en";
// ...
<LanguageToggle />
```

Make these changes:
- Replace `import { cookies } from "next/headers"` with `import { headers } from "next/headers"`
- Add `import { detectServerLang } from "@/lib/i18n"` (alongside the existing `import { getT } from "@/lib/i18n"` — merge into one import statement: `import { getT, detectServerLang } from "@/lib/i18n"`)
- Remove `import { LanguageToggle } from "@/components/LanguageToggle"`
- Replace `const lang = (await cookies()).get("lang")?.value ?? "en"` with `const lang = detectServerLang((await headers()).get("accept-language"))`
- Remove `<LanguageToggle />` from the JSX

- [ ] **Step 3: Update `app/share/[token]/page.tsx`**

Current relevant lines:

```ts
import { cookies } from "next/headers";
import { LanguageToggle } from "@/components/LanguageToggle";
// ...
const cookieStore = await cookies();
const lang = cookieStore.get("lang")?.value ?? "en";
// ...
<LanguageToggle />
```

`cookies()` is used solely for the lang cookie in this file — `getCurrentUser()` manages its own cookie internally — so the entire `cookies()` import and `cookieStore` variable can be removed.

Make these changes:
- Remove `import { cookies } from "next/headers"`
- Add `import { headers } from "next/headers"`
- Add `detectServerLang` to the existing `import { getT } from "@/lib/i18n"` line: `import { getT, detectServerLang } from "@/lib/i18n"`
- Remove `import { LanguageToggle } from "@/components/LanguageToggle"`
- Remove `const cookieStore = await cookies();` and `const lang = cookieStore.get("lang")?.value ?? "en"`
- Add `const lang = detectServerLang((await headers()).get("accept-language"));` in their place
- Remove `<LanguageToggle />` from the JSX (around line 87)

- [ ] **Step 4: Verify build passes**

Run: `npm run build`

Expected: clean build with no errors. The pre-existing `@next/next/no-html-link-for-pages` lint warning in `share/[token]/page.tsx` is unrelated — ignore it.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/login/page.tsx app/share/\[token\]/page.tsx
git commit -m "feat: use Accept-Language header for server-side language detection"
```
