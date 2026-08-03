export const localeTags = ["en-GB"] as const;

export type LocaleTag = (typeof localeTags)[number];

export type TranslationPack = {
  tag: LocaleTag;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  messages: {
    navigation: {
      chart: string;
      reports: string;
      library: string;
    };
    preferences: {
      appearance: string;
      dark: string;
      light: string;
      system: string;
      language: string;
    };
  };
};

export const defaultLocale: LocaleTag = "en-GB";

export const localeRegistry: Record<
  LocaleTag,
  {
    name: string;
    nativeName: string;
    direction: "ltr" | "rtl";
    load: () => Promise<TranslationPack>;
  }
> = {
  "en-GB": {
    name: "English",
    nativeName: "English",
    direction: "ltr",
    load: () => import("./locales/en-GB").then(({ default: pack }) => pack),
  },
};

export function isLocaleTag(value: string): value is LocaleTag {
  return localeTags.includes(value as LocaleTag);
}
