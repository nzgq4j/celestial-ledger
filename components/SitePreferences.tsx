"use client";

import { useEffect, useRef, useState } from "react";
import { localeRegistry, localeTags, type LocaleTag } from "@/lib/i18n/config";
import { useLocale } from "@/components/LocaleProvider";
import { useRouter } from "next/navigation";
import { LocaleFlag } from "@/components/LocaleFlag";

export function SitePreferences() {
  const { locale, pack, selectLocale } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function changeLocale(tag: LocaleTag) {
    await selectLocale(tag);
    setOpen(false);
    const url = new URL(window.location.href);
    const hadExplicitLocale = url.searchParams.has("lang");
    url.searchParams.delete("lang");
    if (hadExplicitLocale)
      router.replace(`${url.pathname}${url.search}${url.hash}`);
    else router.refresh();
  }

  return (
    <div className="site-preferences">
      <div className="language-picker" ref={pickerRef}>
        <button
          type="button"
          className="language-picker__trigger"
          aria-label={pack.messages.preferences.language}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="locale-flag">
            <LocaleFlag locale={locale} />
          </span>
          <span>{localeRegistry[locale].nativeName}</span>
        </button>
        {open && (
          <div
            className="language-picker__menu"
            role="listbox"
            aria-label={pack.messages.preferences.language}
          >
            {localeTags.map((tag) => (
              <button
                key={tag}
                type="button"
                role="option"
                aria-selected={tag === locale}
                lang={tag}
                onClick={() => void changeLocale(tag)}
              >
                <span className="locale-flag">
                  <LocaleFlag locale={tag} />
                </span>
                <span>{localeRegistry[tag].nativeName}</span>
                {tag === locale && <i aria-hidden="true">✓</i>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
