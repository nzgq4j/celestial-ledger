import { isLocaleTag, type LocaleTag } from "@/lib/i18n/config";

/** Android notification channel; created in android MainActivity.java. */
export const MORNING_CHANNEL_ID = "morning_reading";
/** In-app path a morning alert opens (the Today tab). */
export const MORNING_PUSH_PATH = "/account";

const morningCopy: Record<LocaleTag, { title: string; body: string }> = {
  "en-GB": {
    title: "Your reading for today is ready",
    body: "Open Celestial Atlas for today’s sky and what it asks of you.",
  },
  "es-ES": {
    title: "Tu lectura de hoy está lista",
    body: "Abre Celestial Atlas para ver el cielo de hoy y lo que te propone.",
  },
  "fr-FR": {
    title: "Votre lecture du jour est prête",
    body: "Ouvrez Celestial Atlas pour découvrir le ciel du jour et ce qu’il vous invite à faire.",
  },
  "de-DE": {
    title: "Deine Deutung für heute ist bereit",
    body: "Öffne Celestial Atlas für den Himmel von heute und was er dir nahelegt.",
  },
};

export function morningPushCopy(locale: string | null | undefined) {
  return morningCopy[locale && isLocaleTag(locale) ? locale : "en-GB"];
}
