import { en } from "./en";
import { fr } from "./fr";

export type Lang = "en" | "fr";
export type Translations = typeof en;

const translations = { en, fr };

export function getT(lang: string): Translations {
  return (lang === "fr" ? translations.fr : translations.en) as Translations;
}
