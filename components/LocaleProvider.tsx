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

const localeStorageKey = "celestial-atlas-locale";

type LocaleContextValue = {
  locale: LocaleTag;
  pack: TranslationPack;
  selectLocale: (tag: LocaleTag) => Promise<void>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initialLocale = defaultLocale,
  initialPack = englishPack,
}: {
  children: React.ReactNode;
  initialLocale?: LocaleTag;
  initialPack?: TranslationPack;
}) {
  const [locale, setLocale] = useState<LocaleTag>(initialLocale);
  const [pack, setPack] = useState<TranslationPack>(initialPack);

  const selectLocale = useCallback(async (tag: LocaleTag) => {
    const nextPack = await localeRegistry[tag].load();
    setLocale(tag);
    setPack(nextPack);
    localStorage.setItem(localeStorageKey, tag);
    document.cookie = `${localeStorageKey}=${encodeURIComponent(tag)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = tag;
    document.documentElement.dir = nextPack.direction;
  }, []);

  useEffect(() => {
    const explicit = new URLSearchParams(window.location.search).get("lang");
    if (explicit && isLocaleTag(explicit)) {
      localStorage.setItem(localeStorageKey, explicit);
      document.cookie = `${localeStorageKey}=${encodeURIComponent(explicit)}; Path=/; Max-Age=31536000; SameSite=Lax`;
      return;
    }
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
