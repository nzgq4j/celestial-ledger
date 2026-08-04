"use client";

import { localeRegistry, localeTags, type LocaleTag } from "@/lib/i18n/config";
import { useLocale } from "@/components/LocaleProvider";

export function SitePreferences() {
  const { locale, pack, selectLocale } = useLocale();

  return (
    <div className="site-preferences">
      <label className="language-picker">
        <span>{pack.messages.preferences.language}</span>
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
              {localeRegistry[tag].nativeName} · {tag}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
