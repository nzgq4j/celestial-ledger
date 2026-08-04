"use client";

import { localeRegistry, localeTags, type LocaleTag } from "@/lib/i18n/config";
import { useLocale } from "@/components/LocaleProvider";
import { useRouter } from "next/navigation";

export function SitePreferences() {
  const { locale, pack, selectLocale } = useLocale();
  const router = useRouter();

  async function changeLocale(tag: LocaleTag) {
    await selectLocale(tag);
    router.refresh();
  }

  return (
    <div className="site-preferences">
      <label className="language-picker">
        <span>{pack.messages.preferences.language}</span>
        <select
          aria-label={pack.messages.preferences.language}
          lang={locale}
          value={locale}
          onChange={(event) =>
            void changeLocale(event.target.value as LocaleTag)
          }
        >
          {localeTags.map((tag) => (
            <option key={tag} value={tag} lang={tag}>
              {localeRegistry[tag].flag} {localeRegistry[tag].nativeName}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
