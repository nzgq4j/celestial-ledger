import type { LocaleTag } from "@/lib/i18n/config";

export function LocaleFlag({ locale }: { locale: LocaleTag }) {
  if (locale === "en-GB")
    return (
      <svg viewBox="0 0 60 36" role="img" aria-label="United Kingdom flag">
        <rect width="60" height="36" fill="#012169" />
        <path d="M0 0 60 36M60 0 0 36" stroke="#fff" strokeWidth="8" />
        <path d="M0 0 60 36M60 0 0 36" stroke="#c8102e" strokeWidth="4" />
        <path d="M30 0v36M0 18h60" stroke="#fff" strokeWidth="12" />
        <path d="M30 0v36M0 18h60" stroke="#c8102e" strokeWidth="7" />
      </svg>
    );
  if (locale === "de-DE")
    return (
      <svg viewBox="0 0 60 36" role="img" aria-label="German flag">
        <path fill="#000" d="M0 0h60v12H0z" />
        <path fill="#dd0000" d="M0 12h60v12H0z" />
        <path fill="#ffce00" d="M0 24h60v12H0z" />
      </svg>
    );
  if (locale === "es-ES")
    return (
      <svg viewBox="0 0 60 36" role="img" aria-label="Spanish flag">
        <path fill="#aa151b" d="M0 0h60v36H0z" />
        <path fill="#f1bf00" d="M0 9h60v18H0z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 60 36" role="img" aria-label="French flag">
      <path fill="#002654" d="M0 0h20v36H0z" />
      <path fill="#fff" d="M20 0h20v36H20z" />
      <path fill="#ed2939" d="M40 0h20v36H40z" />
    </svg>
  );
}
