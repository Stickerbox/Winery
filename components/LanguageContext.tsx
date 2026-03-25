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
