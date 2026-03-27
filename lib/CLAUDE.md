# lib/CLAUDE.md

## i18n (`lib/i18n/`)

The app supports English and French. Language is detected automatically — no manual toggle.

- `en.ts` / `fr.ts` — translation objects (must stay in sync)
- `index.ts` exports:
  - `getT(lang)` — returns the translation object for a given lang string
  - `detectClientLang()` — reads `navigator.language` (use in client components)
  - `detectServerLang(acceptLanguage)` — reads the `Accept-Language` header value (use in server components/actions)

**Adding new strings:** Add the key to both `en.ts` and `fr.ts`. Use `getT(lang).your.key` to access. Never hardcode user-facing strings in components.

## Utils (`lib/utils.ts`)

- `cn(...inputs)` — combines `clsx` and `tailwind-merge` for safe conditional Tailwind class composition. Use this everywhere instead of string concatenation for class names.
