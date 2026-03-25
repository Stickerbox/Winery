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
