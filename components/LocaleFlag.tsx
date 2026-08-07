import type { LocaleTag } from "@/lib/i18n/config";

export type EnglishFlagRegion = "GB" | "US";

export function englishFlagRegion(
  browserLanguages: readonly string[] | undefined,
): EnglishFlagRegion {
  const primaryLanguage = browserLanguages?.[0];
  if (!primaryLanguage) return "GB";
  try {
    return new Intl.Locale(primaryLanguage).region === "US" ? "US" : "GB";
  } catch {
    return "GB";
  }
}

function UnitedKingdomFlag() {
  return (
    <svg viewBox="0 0 60 36" role="img" aria-label="United Kingdom flag">
      <rect width="60" height="36" fill="#012169" />
      <path d="M0 0l60 36M60 0L0 36" stroke="#fff" strokeWidth="7.2" />
      <path d="M0 0l60 36M60 0L0 36" stroke="#c8102e" strokeWidth="4" />
      <path d="M30 0v36M0 18h60" stroke="#fff" strokeWidth="12" />
      <path d="M30 0v36M0 18h60" stroke="#c8102e" strokeWidth="7.2" />
    </svg>
  );
}

export function LocaleFlag({
  locale,
  englishRegion = "GB",
}: {
  locale: LocaleTag;
  englishRegion?: EnglishFlagRegion;
}) {
  if (locale === "en-GB" && englishRegion === "GB")
    return <UnitedKingdomFlag />;
  if (locale === "en-GB")
    return (
      <svg viewBox="0 0 60 36" role="img" aria-label="United States flag">
        <rect width="60" height="36" fill="#fff" />
        <path
          fill="#b22234"
          d="M0 0h60v2.77H0zm0 5.54h60v2.77H0zm0 5.54h60v2.77H0zm0 5.54h60v2.77H0zm0 5.54h60v2.77H0zm0 5.54h60v2.77H0zm0 5.54h60V36H0z"
        />
        <rect width="25" height="19.39" fill="#3c3b6e" />
        <g fill="#fff">
          <circle cx="3" cy="2.5" r="0.75" />
          <circle cx="8" cy="2.5" r="0.75" />
          <circle cx="13" cy="2.5" r="0.75" />
          <circle cx="18" cy="2.5" r="0.75" />
          <circle cx="23" cy="2.5" r="0.75" />
          <circle cx="5.5" cy="6.5" r="0.75" />
          <circle cx="10.5" cy="6.5" r="0.75" />
          <circle cx="15.5" cy="6.5" r="0.75" />
          <circle cx="20.5" cy="6.5" r="0.75" />
          <circle cx="3" cy="10.5" r="0.75" />
          <circle cx="8" cy="10.5" r="0.75" />
          <circle cx="13" cy="10.5" r="0.75" />
          <circle cx="18" cy="10.5" r="0.75" />
          <circle cx="23" cy="10.5" r="0.75" />
          <circle cx="5.5" cy="14.5" r="0.75" />
          <circle cx="10.5" cy="14.5" r="0.75" />
          <circle cx="15.5" cy="14.5" r="0.75" />
          <circle cx="20.5" cy="14.5" r="0.75" />
          <circle cx="3" cy="18" r="0.75" />
          <circle cx="8" cy="18" r="0.75" />
          <circle cx="13" cy="18" r="0.75" />
          <circle cx="18" cy="18" r="0.75" />
          <circle cx="23" cy="18" r="0.75" />
        </g>
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
