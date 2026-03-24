"use client";

import { useTranslations } from "@/components/LanguageContext";

export function LanguageToggle() {
  const { lang, setLang } = useTranslations();

  return (
    <div className="flex items-center justify-center gap-2 text-sm py-2">
      <span className="text-zinc-400">🌐</span>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={
          lang === "en"
            ? "text-zinc-700 dark:text-zinc-300 font-medium"
            : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400"
        }
      >
        English
      </button>
      <span className="text-zinc-300 dark:text-zinc-600">·</span>
      <button
        type="button"
        onClick={() => setLang("fr")}
        className={
          lang === "fr"
            ? "text-zinc-700 dark:text-zinc-300 font-medium"
            : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400"
        }
      >
        Français
      </button>
    </div>
  );
}
