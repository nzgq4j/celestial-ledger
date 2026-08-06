import { detectAspects } from "@/lib/aspects";
import { geocentricLongitude, longitudeSpeed } from "@/lib/astronomy";
import type { Aspect, Placement, PlanetName } from "@/lib/types";
import { longitudeToZodiac, SIGNS } from "@/lib/zodiac";
import { defaultLocale, type LocaleTag } from "@/lib/i18n/config";
import { dailyCopy, localizedAspectPhrase } from "@/lib/horoscopes/copy";
import { horoscopeUtcDateKey } from "@/lib/horoscopes/rollover";
import { localizeAstroTerm } from "@/lib/reports/evidence-label";

export const zodiacSlugs = SIGNS.map((sign) => sign.toLowerCase());

const glyphs = [
  "♈︎",
  "♉︎",
  "♊︎",
  "♋︎",
  "♌︎",
  "♍︎",
  "♎︎",
  "♏︎",
  "♐︎",
  "♑︎",
  "♒︎",
  "♓︎",
] as const;
const bodies: PlanetName[] = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
];
const rulers: Record<string, PlanetName> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter",
};
function placement(name: PlanetName, date: Date): Placement {
  const longitude = geocentricLongitude(name, date);
  const zodiac = longitudeToZodiac(longitude);
  return {
    name,
    longitude,
    sign: zodiac.sign,
    degree: zodiac.degree,
    minute: zodiac.minute,
    retrograde: longitudeSpeed(name, date) < 0,
  };
}

function wholeSignHouse(transitSign: string, natalSignIndex: number) {
  return (
    ((SIGNS.indexOf(transitSign as (typeof SIGNS)[number]) -
      natalSignIndex +
      12) %
      12) +
    1
  );
}

export type DailyHoroscope = {
  sign: string;
  slug: string;
  glyph: string;
  date: string;
  displayDate: string;
  theme: string;
  overview: string;
  bottomLine: string;
  relationships: string;
  business: string;
  money: string;
  work: string;
  wellbeing: string;
  opportunity: string;
  caution: string;
  question: string;
  dayParts: Array<{
    period: "morning" | "afternoon" | "evening";
    theme: string;
    guidance: string;
    level: 1 | 2 | 3;
  }>;
  evidence: string[];
};

export type DailySky = {
  date: string;
  displayDate: string;
  placements: Placement[];
  aspects: Aspect[];
  horoscopes: DailyHoroscope[];
};

function stableVariant(value: string) {
  return [...value].reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) >>> 0,
    7,
  );
}

function utcDayNumber(dateKey: string) {
  return Math.floor(Date.parse(`${dateKey}T00:00:00.000Z`) / 86_400_000);
}

function phaseLevel(value: number): 1 | 2 | 3 {
  return ((value % 3) + 1) as 1 | 2 | 3;
}

export function dailySkyFor(
  dateInput = new Date(),
  locale: LocaleTag = defaultLocale,
): DailySky {
  const copy = dailyCopy(locale);
  const dateKey = horoscopeUtcDateKey(dateInput);
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  const dayNumber = utcDayNumber(dateKey);
  const placements = bodies.map((body) => placement(body, date));
  const aspects = detectAspects(placements)
    .filter((aspect) => aspect.orb <= 4)
    .slice(0, 8);
  const moon = placements.find((item) => item.name === "Moon")!;
  const sun = placements.find((item) => item.name === "Sun")!;
  const displayDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

  const horoscopes = SIGNS.map((sign, signIndex): DailyHoroscope => {
    const ruler = rulers[sign];
    const rulerPlacement = placements.find((item) => item.name === ruler)!;
    const keyAspect =
      aspects.find((item) => item.body1 === ruler || item.body2 === ruler) ??
      aspects[0];
    const moonHouse = wholeSignHouse(moon.sign, signIndex);
    const sunHouse = wholeSignHouse(sun.sign, signIndex);
    const rulerHouse = wholeSignHouse(rulerPlacement.sign, signIndex);
    const moonTopic = copy.topics[moonHouse - 1];
    const sunTopic = copy.topics[sunHouse - 1];
    const rulerTopic = copy.topics[rulerHouse - 1];
    const localizedRuler = localizeAstroTerm(ruler, locale) as PlanetName;
    const localizedRulerSign = localizeAstroTerm(rulerPlacement.sign, locale);
    // Advancing the UTC calendar date always advances the editorial variant.
    // Sign-specific offsets retain distinct voices without allowing refreshes
    // within the same GMT day to produce different wording.
    const variantSeed = dayNumber + stableVariant(sign);
    const aspectPhrase = keyAspect
      ? localizedAspectPhrase(keyAspect, locale)
      : "";
    const context = {
      moonTopic,
      sunTopic,
      rulerTopic,
      ruler: localizedRuler,
      rulerSign: localizedRulerSign,
      retrograde: rulerPlacement.retrograde,
      aspectPhrase,
      elementPrompt: copy.elements[signIndex % copy.elements.length],
      variant: variantSeed % 4,
      signature: copy.signatures[signIndex],
    };
    const theme = `${moonTopic[0].toUpperCase()}${moonTopic.slice(1)}`;
    const moonSign = localizeAstroTerm(moon.sign, locale);
    const sunSign = localizeAstroTerm(sun.sign, locale);
    const ordinal =
      locale === "en-GB"
        ? `${moonHouse}${moonHouse === 1 ? "st" : moonHouse === 2 ? "nd" : moonHouse === 3 ? "rd" : "th"}`
        : String(moonHouse);
    const evidence = [
      locale === "es-ES"
        ? `La Luna a ${moon.degree}° ${moon.minute}′ de ${moonSign} activa tu casa ${ordinal} de signo completo.`
        : locale === "fr-FR"
          ? `La Lune à ${moon.degree}° ${moon.minute}′ en ${moonSign} active votre maison ${ordinal} en signes entiers.`
          : locale === "de-DE"
            ? `Der Mond auf ${moon.degree}° ${moon.minute}′ ${moonSign} aktiviert dein ${ordinal}. Ganzzeichenhaus.`
            : `Moon at ${moon.degree}° ${moon.minute}′ ${moonSign} activates your ${ordinal} whole-sign house.`,
      locale === "es-ES"
        ? `El Sol a ${sun.degree}° ${sun.minute}′ de ${sunSign} ilumina ${sunTopic}.`
        : locale === "fr-FR"
          ? `Le Soleil à ${sun.degree}° ${sun.minute}′ en ${sunSign} éclaire ${sunTopic}.`
          : locale === "de-DE"
            ? `Die Sonne auf ${sun.degree}° ${sun.minute}′ ${sunSign} beleuchtet ${sunTopic}.`
            : `Sun at ${sun.degree}° ${sun.minute}′ ${sunSign} illuminates ${sunTopic}.`,
      locale === "es-ES"
        ? `${localizedRuler} en ${localizedRulerSign}${rulerPlacement.retrograde ? " retrógrado" : ""} sitúa al regente de tu signo en el ámbito de ${rulerTopic}.`
        : locale === "fr-FR"
          ? `${localizedRuler} en ${localizedRulerSign}${rulerPlacement.retrograde ? " rétrograde" : ""} place le maître de votre signe dans le domaine de ${rulerTopic}.`
          : locale === "de-DE"
            ? `${localizedRuler} in ${localizedRulerSign}${rulerPlacement.retrograde ? " rückläufig" : ""} stellt deinen Zeichenherrscher in das Feld für ${rulerTopic}.`
            : `${localizedRuler} in ${localizedRulerSign}${rulerPlacement.retrograde ? " retrograde" : ""} places your sign ruler in the field of ${rulerTopic}.`,
      keyAspect
        ? `${localizeAstroTerm(keyAspect.body1, locale)} ${localizeAstroTerm(keyAspect.type, locale).toLowerCase()} ${localizeAstroTerm(keyAspect.body2, locale)}, ${locale === "de-DE" ? "Orbis" : "orb"} ${keyAspect.orb.toFixed(1)}°.`
        : locale === "es-ES"
          ? "Ningún aspecto mayor estrecho domina la instantánea diaria."
          : locale === "fr-FR"
            ? "Aucun aspect majeur serré ne domine le ciel du jour."
            : locale === "de-DE"
              ? "Kein enger Hauptaspekt bestimmt die heutige Momentaufnahme."
              : "No tight major aspect dominates the daily snapshot.",
    ];
    const business = copy.business(context);
    const phaseLevels = [
      phaseLevel(moonHouse + signIndex + variantSeed),
      phaseLevel(rulerHouse + signIndex + variantSeed),
      phaseLevel(sunHouse + signIndex + variantSeed),
    ] as const;
    const dayParts = copy.phases(context).map((phase, index) => ({
      ...phase,
      level: phaseLevels[index],
    }));
    return {
      sign: localizeAstroTerm(sign, locale),
      slug: sign.toLowerCase(),
      glyph: glyphs[signIndex],
      date: dateKey,
      displayDate,
      theme,
      overview: copy.overview(context),
      bottomLine: copy.bottomLine(context),
      relationships: copy.relationships(context),
      business,
      money: copy.money(context),
      work: business,
      wellbeing: copy.wellbeing(context),
      opportunity: copy.opportunity(context),
      caution: copy.caution(context),
      question: copy.question(context),
      dayParts,
      evidence,
    };
  });
  return { date: dateKey, displayDate, placements, aspects, horoscopes };
}

export function horoscopeForSlug(
  slug: string,
  date = new Date(),
  locale: LocaleTag = defaultLocale,
) {
  return dailySkyFor(date, locale).horoscopes.find(
    (item) => item.slug === slug.toLowerCase(),
  );
}
