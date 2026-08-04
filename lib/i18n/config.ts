export const localeTags = ["en-GB", "es-ES", "fr-FR", "de-DE"] as const;

export type LocaleTag = (typeof localeTags)[number];

export type TranslationPack = {
  tag: LocaleTag;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  messages: {
    navigation: {
      homeLabel: string;
      tagline: string;
      primaryLabel: string;
      birthChart: string;
      horoscopes: string;
      weekly: string;
      reports: string;
      samples: string;
      library: string;
      menu: string;
      dailyHoroscopes: string;
      weeklyReadings: string;
      privateReports: string;
      sampleReports: string;
    };
    preferences: {
      language: string;
    };
    account: Record<string, string>;
    horoscopes: Record<string, string>;
    home: {
      eyebrow: string;
      titleFirst: string;
      titleSecond: string;
      introduction: string;
      exploreChart: string;
      readSample: string;
      privacy: string;
      principlesLabel: string;
      personalisedTitle: string;
      personalisedCopy: string;
      depthTitle: string;
      depthCopy: string;
      methodTitle: string;
      methodCopy: string;
      calculatorKicker: string;
      calculatorTitle: string;
      calculatorCopy: string;
      planets: string;
      planetsCopy: string;
      signs: string;
      signsCopy: string;
      houses: string;
      housesCopy: string;
    };
    chartForm: {
      kicker: string;
      title: string;
      name: string;
      namePlaceholder: string;
      email: string;
      birthDate: string;
      birthTime: string;
      unknownTime: string;
      birthplace: string;
      birthplacePlaceholder: string;
      search: string;
      searching: string;
      selectBirthplace: string;
      calculate: string;
      calculating: string;
      clear: string;
    };
    footer: {
      description: string;
      collection: string;
      signIn: string;
      privacy: string;
      method: string;
      terms: string;
      privateByDesign: string;
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
    flag: string;
    load: () => Promise<TranslationPack>;
  }
> = {
  "en-GB": {
    name: "English",
    nativeName: "English",
    direction: "ltr",
    flag: "🇬🇧",
    load: () => import("./locales/en-GB").then(({ default: pack }) => pack),
  },
  "es-ES": {
    name: "Spanish",
    nativeName: "Español",
    direction: "ltr",
    flag: "🇪🇸",
    load: () => import("./locales/es-ES").then(({ default: pack }) => pack),
  },
  "fr-FR": {
    name: "French",
    nativeName: "Français",
    direction: "ltr",
    flag: "🇫🇷",
    load: () => import("./locales/fr-FR").then(({ default: pack }) => pack),
  },
  "de-DE": {
    name: "German",
    nativeName: "Deutsch",
    direction: "ltr",
    flag: "🇩🇪",
    load: () => import("./locales/de-DE").then(({ default: pack }) => pack),
  },
};

export function isLocaleTag(value: string): value is LocaleTag {
  return localeTags.includes(value as LocaleTag);
}
