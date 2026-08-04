import type { LocaleTag } from "@/lib/i18n/config";

const reportLanguageNames: Record<LocaleTag, string> = {
  "en-GB": "British English",
  "es-ES": "Spanish as used in Spain",
  "fr-FR": "French as used in France",
  "de-DE": "German as used in Germany",
};

export function reportLanguageInstruction(locale: LocaleTag) {
  return `- Write every reader-facing field in ${reportLanguageNames[locale]} (${locale}). Preserve supplied evidence IDs exactly, without translating or altering them.`;
}
