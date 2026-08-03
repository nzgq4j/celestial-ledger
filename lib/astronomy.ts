import {
  AstroTime,
  Body,
  Ecliptic,
  GeoVector,
  SiderealTime,
  e_tilt,
} from "astronomy-engine";

import type { PlanetName } from "./types";
import { normalizeLongitude } from "./zodiac";

export const ASTRONOMY_ENGINE_VERSION = "2.1.19";
export const CALCULATION_VERSION = "celestial-atlas-astronomy-v1";

const J2000_JULIAN_DAY = 2_451_545;
const SPEED_SAMPLE_DAYS = 1 / 24;

const PLANET_BODIES: Partial<Record<PlanetName, Body>> = {
  Sun: Body.Sun,
  Moon: Body.Moon,
  Mercury: Body.Mercury,
  Venus: Body.Venus,
  Mars: Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn: Body.Saturn,
  Uranus: Body.Uranus,
  Neptune: Body.Neptune,
  Pluto: Body.Pluto,
};

function signedAngularDifference(a: number, b: number): number {
  return ((a - b + 540) % 360) - 180;
}

export function julianDay(date: Date): number {
  return new AstroTime(date).ut + J2000_JULIAN_DAY;
}

export function meanNorthNodeLongitude(date: Date): number {
  const t = (julianDay(date) - J2000_JULIAN_DAY) / 36_525;
  return normalizeLongitude(
    125.0445479 -
      1934.1362891 * t +
      0.0020754 * t ** 2 +
      t ** 3 / 467_441 -
      t ** 4 / 60_616_000,
  );
}

export function geocentricLongitude(name: PlanetName, date: Date): number {
  if (name === "North Node") return meanNorthNodeLongitude(date);
  const body = PLANET_BODIES[name];
  if (!body) throw new Error(`Unsupported astronomical body: ${name}`);
  return normalizeLongitude(Ecliptic(GeoVector(body, date, true)).elon);
}

export function longitudeSpeed(name: PlanetName, date: Date): number {
  const time = new AstroTime(date);
  const before = geocentricLongitude(
    name,
    time.AddDays(-SPEED_SAMPLE_DAYS).date,
  );
  const after = geocentricLongitude(name, time.AddDays(SPEED_SAMPLE_DAYS).date);
  return signedAngularDifference(after, before) / (2 * SPEED_SAMPLE_DAYS);
}

export type ChartAngles = {
  ascendant: number;
  midheaven: number;
  localSiderealTime: number;
  trueObliquity: number;
};

const radians = (degrees: number) => (degrees * Math.PI) / 180;
const degrees = (value: number) => (value * 180) / Math.PI;

export function calculateChartAngles(
  date: Date,
  latitude: number,
  longitude: number,
): ChartAngles {
  if (Math.abs(latitude) >= 89.999)
    throw new RangeError(
      "Exact birth-time angles are undefined at the geographic poles.",
    );
  const localSiderealTime = normalizeLongitude(
    SiderealTime(date) * 15 + longitude,
  );
  const theta = radians(localSiderealTime);
  const phi = radians(latitude);
  const trueObliquity = e_tilt(new AstroTime(date)).tobl;
  const epsilon = radians(trueObliquity);

  const midheaven = normalizeLongitude(
    degrees(Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(epsilon))),
  );
  const ascendant = normalizeLongitude(
    degrees(
      Math.atan2(
        -Math.cos(theta),
        Math.sin(epsilon) * Math.tan(phi) + Math.cos(epsilon) * Math.sin(theta),
      ),
    ) + 180,
  );

  return { ascendant, midheaven, localSiderealTime, trueObliquity };
}
