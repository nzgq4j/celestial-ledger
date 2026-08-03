import type {
  BirthInput,
  HouseCusp,
  NatalChart,
  Placement,
  PlanetName,
} from "./types";
import { longitudeToZodiac } from "./zodiac";
import { DEFAULT_ASPECT_ORBS, detectAspects } from "./aspects";
import { localBirthTimeToUtc } from "./time";
import { validateChart } from "./validation";
import {
  ASTRONOMY_ENGINE_VERSION,
  CALCULATION_VERSION,
  calculateChartAngles,
  geocentricLongitude,
  julianDay,
  longitudeSpeed,
} from "./astronomy";
import { equalHouseCusps, houseForLongitude, HOUSE_SYSTEM } from "./houses";

const BODIES: PlanetName[] = [
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
  "North Node",
];

function placement(
  name: PlanetName,
  longitude: number,
  speed: number,
  house?: number,
  uncertain?: boolean,
): Placement {
  const z = longitudeToZodiac(longitude);
  return {
    name,
    longitude: z.normalized,
    sign: z.sign,
    degree: z.degree,
    minute: z.minute,
    house,
    retrograde: speed < 0,
    uncertain,
  };
}

function moonLongitudeAt(utc: string) {
  return geocentricLongitude("Moon", new Date(utc));
}

export async function calculateNatalChart(
  input: BirthInput,
): Promise<NatalChart> {
  const utc = localBirthTimeToUtc(input);
  const date = new Date(utc);
  const jd = julianDay(date);
  let cuspLongitudes: number[] = [];
  let ascLongitude: number | undefined;
  let mcLongitude: number | undefined;
  if (!input.timeUnknown) {
    const angles = calculateChartAngles(
      date,
      input.place.latitude,
      input.place.longitude,
    );
    ascLongitude = angles.ascendant;
    mcLongitude = angles.midheaven;
    cuspLongitudes = equalHouseCusps(angles.ascendant);
  }

  let moonMayChangeSign = false;
  if (input.timeUnknown) {
    const startInput = {
      ...input,
      timeUnknown: false,
      time: "00:00",
      disambiguation: "earlier" as const,
    };
    const endInput = {
      ...input,
      timeUnknown: false,
      time: "23:59",
      disambiguation: "later" as const,
    };
    try {
      const a = moonLongitudeAt(localBirthTimeToUtc(startInput));
      const b = moonLongitudeAt(localBirthTimeToUtc(endInput));
      moonMayChangeSign = Math.floor(a / 30) !== Math.floor(b / 30);
    } catch {
      moonMayChangeSign = true;
    }
  }

  const placements: Placement[] = BODIES.map((name) => {
    const lon = geocentricLongitude(name, date);
    return placement(
      name,
      lon,
      longitudeSpeed(name, date),
      houseForLongitude(lon, cuspLongitudes),
      name === "Moon" && moonMayChangeSign,
    );
  });

  const houses: HouseCusp[] = cuspLongitudes.map((longitude, i) => {
    const z = longitudeToZodiac(longitude);
    return {
      house: i + 1,
      longitude,
      sign: z.sign,
      degree: z.degree,
      minute: z.minute,
    };
  });
  const ascendant =
    ascLongitude === undefined
      ? undefined
      : placement("Ascendant", ascLongitude, 0, 1);
  const midheaven =
    mcLongitude === undefined
      ? undefined
      : placement("Midheaven", mcLongitude, 0);

  return validateChart({
    input,
    utc,
    julianDay: jd,
    timeKnown: !input.timeUnknown,
    placements,
    ascendant,
    midheaven,
    houses,
    aspects: detectAspects(placements),
    moonMayChangeSign,
    calculation: {
      zodiac: "Tropical",
      houseSystem: input.timeUnknown ? "None" : HOUSE_SYSTEM,
      ephemeris: "Astronomy Engine (geocentric true ecliptic of date)",
      engineVersion: ASTRONOMY_ENGINE_VERSION,
      calculationVersion: CALCULATION_VERSION,
      aspectOrbs: DEFAULT_ASPECT_ORBS,
    },
  });
}
