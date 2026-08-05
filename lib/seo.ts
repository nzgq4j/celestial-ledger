import type { Metadata } from "next";
import { defaultLocale, localeTags, type LocaleTag } from "@/lib/i18n/config";

export const SITE_NAME = "Celestial Atlas";
export const SITE_URL = "https://www.celestialatlas.app";
export const DEFAULT_SOCIAL_IMAGE = "/opengraph-image";

export const coreKeywords = [
  "astrology",
  "natal chart",
  "birth chart",
  "daily horoscope",
  "planetary transits",
  "astrology reports",
  "ephemeris",
  "house placements",
  "astrological aspects",
] as const;

const openGraphLocales: Record<LocaleTag, string> = {
  "en-GB": "en_US",
  "es-ES": "es_ES",
  "fr-FR": "fr_FR",
  "de-DE": "de_DE",
};

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: readonly string[];
  locale?: LocaleTag;
  type?: "website" | "article";
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
};

export function createPageMetadata({
  title,
  description,
  path,
  keywords = [],
  locale = defaultLocale,
  type = "website",
  image = DEFAULT_SOCIAL_IMAGE,
  publishedTime,
  modifiedTime,
  authors,
}: PageMetadataInput): Metadata {
  const socialTitle = title.includes(SITE_NAME)
    ? title
    : `${title} — ${SITE_NAME}`;
  const imageMetadata = {
    url: image,
    width: 1200,
    height: 630,
    alt: `${socialTitle} featured image`,
  };
  return {
    title,
    description,
    keywords: [...new Set([...coreKeywords, ...keywords])],
    alternates: { canonical: path },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      type,
      locale: openGraphLocales[locale],
      alternateLocale: localeTags
        .filter((tag) => tag !== locale)
        .map((tag) => openGraphLocales[tag]),
      images: [imageMetadata],
      ...(type === "article" ? { publishedTime, modifiedTime, authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image],
    },
  };
}

export function privatePageMetadata(title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: false, noarchive: true },
  };
}

export function localizedPublicUrl(path: string, locale: LocaleTag) {
  if (locale === defaultLocale) return `${SITE_URL}${path}`;
  const url = new URL(path, SITE_URL);
  url.searchParams.set("lang", locale);
  return url.toString();
}

export function localizedAlternates(path: string) {
  return Object.fromEntries([
    ...localeTags.map((locale) => [locale, localizedPublicUrl(path, locale)]),
    ["x-default", localizedPublicUrl(path, defaultLocale)],
  ]);
}
