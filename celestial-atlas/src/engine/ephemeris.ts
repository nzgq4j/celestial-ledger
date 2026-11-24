// Astronomical positions from astronomy-engine (MIT). The method matches the
// repository's validated web engine (../lib/astronomy.ts): geocentric apparent
// ecliptic longitudes of date, true obliquity, and apparent sidereal time.
import { AstroTime, Body, Ecliptic, GeoVector, SiderealTime, e_tilt } from 'astronomy-engine';

export const ENGINE_NAME = 'astronomy-engine';
export const ENGINE_VERSION = '2.1.19';

export type BodyName =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';

const BODIES: Record<BodyName, Body> = {
  sun: Body.Sun, moon: Body.Moon, mercury: Body.Mercury, venus: Body.Venus, mars: Body.Mars,
  jupiter: Body.Jupiter, saturn: Body.Saturn, uranus: Body.Uranus, neptune: Body.Neptune, pluto: Body.Pluto,
};

const SPEED_SAMPLE_DAYS = 1 / 24;
const D2R = Math.PI / 180;

export const normalize = (deg: number): number => ((deg % 360) + 360) % 360;
const signedDiff = (a: number, b: number): number => ((a - b + 540) % 360) - 180;

/** Geocentric apparent ecliptic longitude, degrees 0..360. */
export function longitude(body: BodyName, date: Date): number {
  return normalize(Ecliptic(GeoVector(BODIES[body], date, true)).elon);
}

/** Longitude speed in degrees per day; negative means retrograde. */
export function speed(body: BodyName, date: Date): number {
  const t = new AstroTime(date);
  const before = longitude(body, t.AddDays(-SPEED_SAMPLE_DAYS).date);
  const after = longitude(body, t.AddDays(SPEED_SAMPLE_DAYS).date);
  return signedDiff(after, before) / (2 * SPEED_SAMPLE_DAYS);
}

export interface Angles {
  ascendant: number;
  midheaven: number;
  localSiderealTime: number;
  trueObliquity: number;
}

/** Ascendant and Midheaven. Undefined at the geographic poles. */
export function angles(date: Date, latitude: number, longitudeEast: number): Angles {
  if (Math.abs(latitude) >= 89.999) throw new RangeError('Exact birth-time angles are undefined at the geographic poles.');
  const localSiderealTime = normalize(SiderealTime(date) * 15 + longitudeEast);
  const theta = localSiderealTime * D2R, phi = latitude * D2R;
  const trueObliquity = e_tilt(new AstroTime(date)).tobl;
  const eps = trueObliquity * D2R;
  const midheaven = normalize(Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(eps)) / D2R);
  const ascendant = normalize(
    Math.atan2(-Math.cos(theta), Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(theta)) / D2R + 180,
  );
  return { ascendant, midheaven, localSiderealTime, trueObliquity };
}

/** Sun–Moon elongation in degrees, 0..360 (0 = new, 180 = full). */
export function moonElongation(date: Date): number {
  return normalize(longitude('moon', date) - longitude('sun', date));
}
