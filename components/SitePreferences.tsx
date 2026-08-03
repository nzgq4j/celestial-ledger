"use client";

import { useEffect, useState } from "react";
import { localeRegistry, localeTags, type LocaleTag } from "@/lib/i18n/config";
import { useLocale } from "@/components/LocaleProvider";

type ThemePreference = "dark" | "light" | "system";

const themeStorageKey = "celestial-atlas-theme";
function applyTheme(preference: ThemePreference) {
  const resolved =
    preference === "system"
      ? window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
      : preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.style.colorScheme = resolved;
}

export function SitePreferences() {
  const [theme, setTheme] = useState<ThemePreference>("system");
  const { locale, pack, selectLocale } = useLocale();

  useEffect(() => {
    const storedTheme = localStorage.getItem(themeStorageKey);
    const preference: ThemePreference =
      storedTheme === "dark" ||
      storedTheme === "light" ||
      storedTheme === "system"
        ? storedTheme
        : "system";
    setTheme(preference);
    applyTheme(preference);

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const handleSystemChange = () => {
      if ((localStorage.getItem(themeStorageKey) ?? "system") === "system")
        applyTheme("system");
    };
    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, []);

  function changeTheme(preference: ThemePreference) {
    setTheme(preference);
    localStorage.setItem(themeStorageKey, preference);
    applyTheme(preference);
  }

  return (
    <div className="site-preferences">
      <label>
        <span className="sr-only">{pack.messages.preferences.appearance}</span>
        <select
          aria-label={pack.messages.preferences.appearance}
          value={theme}
          onChange={(event) =>
            changeTheme(event.target.value as ThemePreference)
          }
        >
          <option value="system">{pack.messages.preferences.system}</option>
          <option value="dark">{pack.messages.preferences.dark}</option>
          <option value="light">{pack.messages.preferences.light}</option>
        </select>
      </label>
      <label>
        <span className="sr-only">{pack.messages.preferences.language}</span>
        <select
          aria-label={pack.messages.preferences.language}
          lang={locale}
          value={locale}
          onChange={(event) =>
            void selectLocale(event.target.value as LocaleTag)
          }
        >
          {localeTags.map((tag) => (
            <option key={tag} value={tag} lang={tag}>
              {localeRegistry[tag].nativeName} ({tag})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
