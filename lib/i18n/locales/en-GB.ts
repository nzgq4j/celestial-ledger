import type { TranslationPack } from "@/lib/i18n/config";

const pack = {
  tag: "en-GB",
  name: "English",
  nativeName: "English",
  direction: "ltr",
  messages: {
    navigation: {
      chart: "Chart",
      reports: "Reports",
      library: "Private library",
    },
    preferences: {
      appearance: "Appearance",
      dark: "Dark",
      light: "Light",
      system: "System",
      language: "Language",
    },
  },
} satisfies TranslationPack;

export default pack;
