import { detectAspects } from "@/lib/aspects";
import { geocentricLongitude, longitudeSpeed } from "@/lib/astronomy";
import type { Aspect, Placement, PlanetName } from "@/lib/types";
import { longitudeToZodiac, SIGNS } from "@/lib/zodiac";

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
const houseTopics = [
  "identity and fresh starts",
  "resources and self-worth",
  "conversation and daily movement",
  "home and belonging",
  "creativity and pleasure",
  "routines and useful work",
  "partnership and reciprocity",
  "trust and shared resources",
  "learning and wider horizons",
  "career and public direction",
  "friends and future plans",
  "rest and inner renewal",
] as const;
const elementGuidance: Record<string, string> = {
  fire: "Give inspiration a practical next step before its heat disperses.",
  earth: "Let steady progress count; refinement is more useful than urgency.",
  air: "Name the idea clearly, then notice which conversation gives it life.",
  water:
    "Treat sensitivity as information and choose where it deserves your attention.",
};
const elements = [
  "fire",
  "earth",
  "air",
  "water",
  "fire",
  "earth",
  "air",
  "water",
  "fire",
  "earth",
  "air",
  "water",
] as const;

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

function aspectPhrase(aspect: Aspect) {
  const tone =
    aspect.type === "Trine" || aspect.type === "Sextile"
      ? "opens an easier exchange"
      : aspect.type === "Conjunction"
        ? "concentrates attention"
        : "creates a productive tension";
  return `${aspect.body1} ${aspect.type.toLowerCase()} ${aspect.body2} ${tone} between their two drives`;
}

export type DailyHoroscope = {
  sign: string;
  slug: string;
  glyph: string;
  date: string;
  displayDate: string;
  theme: string;
  overview: string;
  relationships: string;
  work: string;
  wellbeing: string;
  opportunity: string;
  caution: string;
  question: string;
  evidence: string[];
};

export type DailySky = {
  date: string;
  displayDate: string;
  placements: Placement[];
  aspects: Aspect[];
  horoscopes: DailyHoroscope[];
};

export function dailySkyFor(dateInput = new Date()): DailySky {
  const dateKey = dateInput.toISOString().slice(0, 10);
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  const placements = bodies.map((body) => placement(body, date));
  const aspects = detectAspects(placements)
    .filter((aspect) => aspect.orb <= 4)
    .slice(0, 8);
  const moon = placements.find((item) => item.name === "Moon")!;
  const sun = placements.find((item) => item.name === "Sun")!;
  const displayDate = new Intl.DateTimeFormat("en-GB", {
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
    const theme = `${houseTopics[moonHouse - 1][0].toUpperCase()}${houseTopics[moonHouse - 1].slice(1)}`;
    const evidence = [
      `Moon at ${moon.degree}° ${moon.minute}′ ${moon.sign} activates your ${moonHouse}${moonHouse === 1 ? "st" : moonHouse === 2 ? "nd" : moonHouse === 3 ? "rd" : "th"} whole-sign house.`,
      `Sun at ${sun.degree}° ${sun.minute}′ ${sun.sign} illuminates ${houseTopics[sunHouse - 1]}.`,
      `${ruler} in ${rulerPlacement.sign}${rulerPlacement.retrograde ? " retrograde" : ""} places your sign ruler in the field of ${houseTopics[rulerHouse - 1]}.`,
      keyAspect
        ? `${keyAspect.body1} ${keyAspect.type.toLowerCase()} ${keyAspect.body2}, orb ${keyAspect.orb.toFixed(1)}°.`
        : "No tight major aspect dominates the daily snapshot.",
    ];
    return {
      sign,
      slug: sign.toLowerCase(),
      glyph: glyphs[signIndex],
      date: dateKey,
      displayDate,
      theme,
      overview: `The Moon moves through your field of ${houseTopics[moonHouse - 1]}, making this a day to notice what asks for an immediate emotional response. Meanwhile, the Sun keeps the longer arc centred on ${houseTopics[sunHouse - 1]}. ${elementGuidance[elements[signIndex]]}`,
      relationships: `In connection, listen for the need beneath the first reaction. ${ruler} in ${rulerPlacement.sign} favours ${rulerPlacement.retrograde ? "reviewing an old pattern before making a promise" : "clear signals and choices that match your present values"}.`,
      work: `Direct practical effort toward ${houseTopics[rulerHouse - 1]}. ${keyAspect ? `${aspectPhrase(keyAspect)}, so use that contrast to improve the plan rather than forcing a quick conclusion.` : "A simple sequence and one completed task will create useful momentum."}`,
      wellbeing: `Protect enough quiet to distinguish your own rhythm from the atmosphere around you. Small rituals connected with ${houseTopics[moonHouse - 1]} can restore steadiness today.`,
      opportunity: `Make one visible choice that supports ${houseTopics[sunHouse - 1]}; consistency will carry more weight than spectacle.`,
      caution: `Do not treat a passing mood as a final verdict, especially around ${houseTopics[moonHouse - 1]}.`,
      question: `What would a more intentional relationship with ${houseTopics[moonHouse - 1]} look like today?`,
      evidence,
    };
  });
  return { date: dateKey, displayDate, placements, aspects, horoscopes };
}

export function horoscopeForSlug(slug: string, date = new Date()) {
  return dailySkyFor(date).horoscopes.find(
    (item) => item.slug === slug.toLowerCase(),
  );
}
