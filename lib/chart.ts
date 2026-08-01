import type { BirthInput, HouseCusp, NatalChart, Placement, PlanetName } from "./types";
import { longitudeToZodiac, normalizeLongitude } from "./zodiac";
import { DEFAULT_ASPECT_ORBS, detectAspects } from "./aspects";
import { localBirthTimeToUtc } from "./time";
import { validateChart } from "./validation";

const BODIES: [PlanetName, string][] = [
  ["Sun", "Sun"], ["Moon", "Moon"], ["Mercury", "Mercury"], ["Venus", "Venus"],
  ["Mars", "Mars"], ["Jupiter", "Jupiter"], ["Saturn", "Saturn"], ["Uranus", "Uranus"],
  ["Neptune", "Neptune"], ["Pluto", "Pluto"], ["North Node", "MeanNode"]
];

function placement(name: PlanetName, longitude: number, speed: number, house?: number, uncertain?: boolean): Placement {
  const z = longitudeToZodiac(longitude);
  return { name, longitude: z.normalized, sign: z.sign, degree: z.degree, minute: z.minute, house, retrograde: speed < 0, uncertain };
}

function inArc(value: number, start: number, end: number) {
  value = normalizeLongitude(value); start = normalizeLongitude(start); end = normalizeLongitude(end);
  return start <= end ? value >= start && value < end : value >= start || value < end;
}

function houseFor(longitude: number, cusps: number[]): number | undefined {
  if (cusps.length !== 12) return undefined;
  for (let i = 0; i < 12; i++) if (inArc(longitude, cusps[i], cusps[(i + 1) % 12])) return i + 1;
  return undefined;
}

async function loadEngine() {
  const mod: any = await import("@swisseph/browser");
  const swe = new mod.SwissEphemeris();
  await swe.init();
  return { swe, mod };
}

async function moonLongitudeAt(swe: any, mod: any, utc: string) {
  const jd = swe.dateToJulianDay(new Date(utc));
  return normalizeLongitude(swe.calculatePosition(jd, mod.Planet.Moon).longitude);
}

export async function calculateNatalChart(input: BirthInput): Promise<NatalChart> {
  const utc = localBirthTimeToUtc(input);
  let engine: Awaited<ReturnType<typeof loadEngine>>;
  try { engine = await loadEngine(); } catch (error) { throw new Error(`Ephemeris initialization failure: ${error instanceof Error ? error.message : "Unknown error"}`); }
  const { swe, mod } = engine;
  const jd = swe.dateToJulianDay(new Date(utc));
  let cuspLongitudes: number[] = [];
  let ascLongitude: number | undefined;
  let mcLongitude: number | undefined;
  if (!input.timeUnknown) {
    const housesResult = swe.calculateHouses(jd, input.place.latitude, input.place.longitude, mod.HouseSystem.Placidus);
    cuspLongitudes = Array.from(housesResult.cusps ?? housesResult.houseCusps ?? []).slice(-12).map(Number).map(normalizeLongitude);
    ascLongitude = normalizeLongitude(Number(housesResult.ascendant));
    mcLongitude = normalizeLongitude(Number(housesResult.mc ?? housesResult.midheaven));
  }

  let moonMayChangeSign = false;
  if (input.timeUnknown) {
    const startInput = { ...input, timeUnknown: false, time: "00:00", disambiguation: "earlier" as const };
    const endInput = { ...input, timeUnknown: false, time: "23:59", disambiguation: "later" as const };
    try {
      const a = await moonLongitudeAt(swe, mod, localBirthTimeToUtc(startInput));
      const b = await moonLongitudeAt(swe, mod, localBirthTimeToUtc(endInput));
      moonMayChangeSign = Math.floor(a / 30) !== Math.floor(b / 30);
    } catch { moonMayChangeSign = true; }
  }

  const placements: Placement[] = BODIES.map(([name, enumName]) => {
    const body = mod.Planet[enumName] ?? mod.Planet.TrueNode;
    const result = swe.calculatePosition(jd, body);
    const lon = normalizeLongitude(Number(result.longitude));
    return placement(name, lon, Number(result.longitudeSpeed ?? result.speedLongitude ?? 0), houseFor(lon, cuspLongitudes), name === "Moon" && moonMayChangeSign);
  });

  const houses: HouseCusp[] = cuspLongitudes.map((longitude, i) => {
    const z = longitudeToZodiac(longitude);
    return { house: i + 1, longitude, sign: z.sign, degree: z.degree, minute: z.minute };
  });
  const ascendant = ascLongitude === undefined ? undefined : placement("Ascendant", ascLongitude, 0, 1);
  const midheaven = mcLongitude === undefined ? undefined : placement("Midheaven", mcLongitude, 0);

  return validateChart({
    input, utc, julianDay: jd, timeKnown: !input.timeUnknown, placements, ascendant, midheaven, houses,
    aspects: detectAspects(placements), moonMayChangeSign,
    calculation: { zodiac: "Tropical", houseSystem: input.timeUnknown ? "None" : "Placidus", ephemeris: "Swiss Ephemeris-compatible WebAssembly (Moshier built-in unless configured otherwise)", aspectOrbs: DEFAULT_ASPECT_ORBS }
  });
}
