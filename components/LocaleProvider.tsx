"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  defaultLocale,
  isLocaleTag,
  localeRegistry,
  type LocaleTag,
  type TranslationPack,
} from "@/lib/i18n/config";
import englishPack from "@/lib/i18n/locales/en-GB";
import { useRouter } from "next/navigation";

const localeStorageKey = "celestial-atlas-locale";

type LocaleContextValue = {
  locale: LocaleTag;
  pack: TranslationPack;
  selectLocale: (tag: LocaleTag) => Promise<void>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocale] = useState<LocaleTag>(defaultLocale);
  const [pack, setPack] = useState<TranslationPack>(englishPack);

  const selectLocale = useCallback(
    async (tag: LocaleTag) => {
      const nextPack = await localeRegistry[tag].load();
      setLocale(tag);
      setPack(nextPack);
      localStorage.setItem(localeStorageKey, tag);
      document.cookie = `${localeStorageKey}=${encodeURIComponent(tag)}; Path=/; Max-Age=31536000; SameSite=Lax`;
      document.documentElement.lang = tag;
      document.documentElement.dir = nextPack.direction;
      router.refresh();
    },
    [router],
  );

  useEffect(() => {
    const stored = localStorage.getItem(localeStorageKey);
    if (!stored || !isLocaleTag(stored)) return;
    let active = true;
    void localeRegistry[stored].load().then((storedPack) => {
      if (!active) return;
      setLocale(stored);
      setPack(storedPack);
      document.documentElement.lang = stored;
      document.documentElement.dir = storedPack.direction;
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({ locale, pack, selectLocale }),
    [locale, pack, selectLocale],
  );
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}
