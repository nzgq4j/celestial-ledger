import type { LocaleTag } from "@/lib/i18n/config";
import type { CareerEvidenceItem } from "@/lib/reports/career";

const words: Record<LocaleTag, Record<string, string>> = {
  "en-GB": {},
  "es-ES": {
    Sun: "Sol",
    Moon: "Luna",
    Mercury: "Mercurio",
    Venus: "Venus",
    Mars: "Marte",
    Jupiter: "Júpiter",
    Saturn: "Saturno",
    Uranus: "Urano",
    Neptune: "Neptuno",
    Pluto: "Plutón",
    Aries: "Aries",
    Taurus: "Tauro",
    Gemini: "Géminis",
    Cancer: "Cáncer",
    Leo: "Leo",
    Virgo: "Virgo",
    Libra: "Libra",
    Scorpio: "Escorpio",
    Sagittarius: "Sagitario",
    Capricorn: "Capricornio",
    Aquarius: "Acuario",
    Pisces: "Piscis",
    Conjunction: "conjunción",
    Opposition: "oposición",
    Trine: "trígono",
    Square: "cuadratura",
    Sextile: "sextil",
  },
  "fr-FR": {
    Sun: "Soleil",
    Moon: "Lune",
    Mercury: "Mercure",
    Venus: "Vénus",
    Mars: "Mars",
    Jupiter: "Jupiter",
    Saturn: "Saturne",
    Uranus: "Uranus",
    Neptune: "Neptune",
    Pluto: "Pluton",
    Aries: "Bélier",
    Taurus: "Taureau",
    Gemini: "Gémeaux",
    Cancer: "Cancer",
    Leo: "Lion",
    Virgo: "Vierge",
    Libra: "Balance",
    Scorpio: "Scorpion",
    Sagittarius: "Sagittaire",
    Capricorn: "Capricorne",
    Aquarius: "Verseau",
    Pisces: "Poissons",
    Conjunction: "conjonction",
    Opposition: "opposition",
    Trine: "trigone",
    Square: "carré",
    Sextile: "sextile",
  },
  "de-DE": {
    Sun: "Sonne",
    Moon: "Mond",
    Mercury: "Merkur",
    Venus: "Venus",
    Mars: "Mars",
    Jupiter: "Jupiter",
    Saturn: "Saturn",
    Uranus: "Uranus",
    Neptune: "Neptun",
    Pluto: "Pluto",
    Aries: "Widder",
    Taurus: "Stier",
    Gemini: "Zwillinge",
    Cancer: "Krebs",
    Leo: "Löwe",
    Virgo: "Jungfrau",
    Libra: "Waage",
    Scorpio: "Skorpion",
    Sagittarius: "Schütze",
    Capricorn: "Steinbock",
    Aquarius: "Wassermann",
    Pisces: "Fische",
    Conjunction: "Konjunktion",
    Opposition: "Opposition",
    Trine: "Trigon",
    Square: "Quadrat",
    Sextile: "Sextil",
  },
};

const t = (value: unknown, locale: LocaleTag) =>
  typeof value === "string" ? (words[locale][value] ?? value) : String(value);

export const localizeAstroTerm = (value: string, locale: LocaleTag) =>
  words[locale][value] ?? value;

export function localizeEvidenceLabel(
  item: CareerEvidenceItem,
  locale: LocaleTag,
) {
  const d = item.data;
  if (item.kind === "placement") {
    const base = `${t(d.body, locale)} ${locale === "de-DE" ? "im Zeichen" : locale === "fr-FR" ? "en" : locale === "es-ES" ? "en" : "in"} ${t(d.sign, locale)}`;
    if (!d.retrograde) return base;
    return `${base} (${locale === "de-DE" ? "rückläufig" : locale === "fr-FR" ? "rétrograde" : locale === "es-ES" ? "retrógrado" : "retrograde"})`;
  }
  if (item.kind === "angle") {
    const angle = item.id.includes("ascendant")
      ? locale === "es-ES"
        ? "Ascendente"
        : locale === "de-DE"
          ? "Aszendent"
          : "Ascendant"
      : locale === "es-ES"
        ? "Medio Cielo"
        : locale === "fr-FR"
          ? "Milieu du Ciel"
          : locale === "de-DE"
            ? "Medium Coeli"
            : "Midheaven";
    return `${angle} ${locale === "de-DE" ? "im Zeichen" : locale === "en-GB" ? "in" : "en"} ${t(d.sign, locale)}`;
  }
  if (item.kind === "house") {
    if (locale === "es-ES")
      return `La casa ${d.house} comienza en ${t(d.sign, locale)}`;
    if (locale === "fr-FR")
      return `La maison ${d.house} commence en ${t(d.sign, locale)}`;
    if (locale === "de-DE")
      return `Haus ${d.house} beginnt im Zeichen ${t(d.sign, locale)}`;
    return `House ${d.house} begins in ${t(d.sign, locale)}`;
  }
  return `${t(d.body1, locale)} ${t(d.aspect, locale)} ${t(d.body2, locale)}`;
}
