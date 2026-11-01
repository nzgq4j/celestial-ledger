export const localeTags = ["en-GB", "es-ES", "fr-FR", "de-DE"] as const;

export type LocaleTag = (typeof localeTags)[number];

/** Reader-facing copy for the landing page and the free chart calculator. */
export type HomeMessageKey =
  | "heroKicker"
  | "titleFirst"
  | "titleSecond"
  | "introduction"
  | "featuresLabel"
  | "featureBigThree"
  | "featureHouses"
  | "featureInterpretation"
  | "todayLink"
  | "formTitle"
  | "formStep"
  | "formBirthTime"
  | "formDatePrompt"
  | "formTimePrompt"
  | "formUnknownTime"
  | "formBirthplace"
  | "formSelectedPlace"
  | "formCalculate"
  | "formPrivacy"
  | "formAccountPrivacy"
  | "formMarketingConsent"
  | "formRepeatedClock"
  | "formEarlier"
  | "formLater"
  | "resultStep"
  | "resultTitle"
  | "timeUnknown"
  | "sun"
  | "moon"
  | "rising"
  | "houseNumber"
  | "risingUnavailable"
  | "moonMayChange"
  | "tabsLabel"
  | "tabPlanets"
  | "tabHouses"
  | "tabAspects"
  | "retrograde"
  | "housesUnavailable"
  | "aspectsEmpty"
  | "interpretationKicker"
  | "interpretationTitle"
  | "interpretationLoading"
  | "interpretationProgress"
  | "interpretationWaiting"
  | "interpretationEmpty"
  | "openSavedChart"
  | "methodTitle"
  | "methodCopy"
  | "precisionCopy"
  | "revealKicker"
  | "revealTitle"
  | "revealCopy"
  | "revealPlan"
  | "revealContinue"
  | "ritualsKicker"
  | "ritualsTitle"
  | "ritualsPreview"
  | "ritualReadingWhen"
  | "ritualReadingTitle"
  | "ritualReadingCopy"
  | "ritualReadingPlan"
  | "ritualTarotWhen"
  | "ritualTarotTitle"
  | "ritualTarotCopy"
  | "ritualTarotPlan"
  | "ritualWeeklyWhen"
  | "ritualWeeklyTitle"
  | "ritualWeeklyCopy"
  | "ritualWeeklyPlan"
  | "plansTitleFirst"
  | "plansTitleSecond"
  | "plansCopy"
  | "planFree"
  | "planFreeLine"
  | "planAtlas"
  | "planAtlasLine"
  | "perMonth"
  | "plansCompare";

export type TranslationPack = {
  tag: LocaleTag;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  messages: {
    navigation: {
      tarot: string;
      homeLabel: string;
      tagline: string;
      primaryLabel: string;
      birthChart: string;
      horoscopes: string;
      weekly: string;
      reports: string;
      membership: string;
      samples: string;
      journal: string;
      library: string;
      menu: string;
      dailyHoroscopes: string;
      weeklyReadings: string;
      privateReports: string;
      membershipPlans: string;
      sampleReports: string;
      signIn: string;
      dashboard: string;
      accountSettings: string;
      billing: string;
      signOut: string;
      identityMenu: string;
      signedInAs: string;
      today: string;
      myChart: string;
      chartTab: string;
      libraryTab: string;
      accountTab: string;
      getMyChart: string;
      atlasMember: string;
      freeMember: string;
      contact: string;
      appTabsLabel: string;
    };
    preferences: {
      language: string;
    };
    account: Record<string, string>;
    horoscopes: Record<string, string>;
    tarot: Record<string, string>;
    home: Record<HomeMessageKey, string>;
    clock: Record<string, string>;
    chartForm: {
      accountKicker: string;
      accountTitle: string;
      accountCopy: string;
      accountSaving: string;
      accountSaved: string;
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
    chartReveal: {
      hookLabel: string;
      openingCheckout: string;
      freeAccount: string;
      signIn: string;
      compare: string;
      checkoutError: string;
    };
    footer: {
      kicker: string;
      title: string;
      description: string;
      chartAction: string;
      explore: string;
      yourAtlas: string;
      trust: string;
      language: string;
      languageCopy: string;
      rights: string;
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

export const localeRequestHeader = "x-celestial-locale";

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
    flag: "🇺🇸",
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
