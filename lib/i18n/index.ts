import { en } from "./en";
import { fr } from "./fr";

export type Lang = "en" | "fr";
export type Translations = typeof en;

const translations = { en, fr } as const;

export function getT(lang: string): Translations {
  return lang === "fr" ? translations.fr : translations.en;
}
