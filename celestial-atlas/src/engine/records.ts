// Calculation records and evidence IDs.
//
// Every calculated fact (a planet position, an angle, an aspect, a number, a card
// draw) becomes an Evidence entry whose ID is derived from its content and from
// the ID of the calculation record that produced it. The same inputs always give
// the same IDs, and any change to an input or a value gives a new ID, so a saved
// reading can always be traced back to exactly what was calculated.

export const CALCULATION_VERSION = 'celestial-atlas-android-v1';

/** Deterministic JSON: object keys sorted at every level. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).filter(k => obj[k] !== undefined).sort()
    .map(k => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',')}}`;
}

/** 53-bit string hash (cyrb53). Two seeds are combined for a 106-bit ID. */
function cyrb53(str: string, seed: number): string {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

export function contentId(prefix: string, value: unknown): string {
  const s = canonicalJson(value);
  return `${prefix}_${cyrb53(s, 1)}${cyrb53(s, 2)}`;
}

/* ---------- Records ---------- */

export interface BirthChartRecord {
  kind: 'birth-chart';
  id: string;
  calculationVersion: string;
  engine: string;
  engineVersion: string;
  zodiac: 'tropical';
  coordinateFrame: 'geocentric apparent ecliptic of date';
  houseSystem: 'equal' | 'none';
  nodeType: 'not calculated';
  placeData: string;
  placeId: number;
  latitude: number;
  longitude: number;
  timeZone: string;
  localDate: string;
  /** null when the birth time is unknown */
  localTime: string | null;
  timeResolution: string;
  utc: string;
  utcOffsetMinutes: number;
  timeKnown: boolean;
  moonSignUncertain: boolean;
}

export interface SkyRecord {
  kind: 'sky';
  id: string;
  calculationVersion: string;
  engine: string;
  engineVersion: string;
  zodiac: 'tropical';
  coordinateFrame: 'geocentric apparent ecliptic of date';
  utc: string;
}

export interface NumerologyRecord {
  kind: 'numerology';
  id: string;
  calculationVersion: string;
  method: 'pythagorean';
  masterNumbers: [11, 22, 33];
  birthDate: string;
  /** Local calendar date used for the personal year, month and day. */
  referenceDate: string;
  /** Hash of the normalised birth name; the name itself is not repeated here. */
  nameHash: string;
}

export interface CardDrawRecord {
  kind: 'card-draw';
  id: string;
  calculationVersion: string;
  method: 'seeded' | 'random';
  /** Hash of the seed, for seeded draws. */
  seedHash: string | null;
  deckSize: number;
  count: number;
}

export type CalcRecord = BirthChartRecord | SkyRecord | NumerologyRecord | CardDrawRecord;

/** Fill in the content-derived ID for a record. */
export function sealRecord<R extends CalcRecord>(fields: Omit<R, 'id'>): R {
  const prefix = { 'birth-chart': 'chart', sky: 'sky', numerology: 'num', 'card-draw': 'draw' }[fields.kind];
  return { ...fields, id: contentId(prefix, fields) } as R;
}

/* ---------- Evidence ---------- */

export type EvidenceKind = 'position' | 'angle' | 'house' | 'aspect' | 'phase' | 'number' | 'cycle' | 'card';

export interface Evidence {
  id: string;
  recordId: string;
  kind: EvidenceKind;
  /** What the fact is about, for example "venus" or "lifePath". */
  subject: string;
  /** The calculated value, for example "Leo 4°51′ (124.86°)". */
  value: string;
}

export function makeEvidence(recordId: string, kind: EvidenceKind, subject: string, value: string): Evidence {
  return { id: contentId('ev', { recordId, kind, subject, value }), recordId, kind, subject, value };
}

/** Collected evidence, keyed by ID. */
export type EvidenceMap = Record<string, Evidence>;

export function collect(...items: Evidence[]): EvidenceMap {
  const out: EvidenceMap = {};
  for (const e of items) out[e.id] = e;
  return out;
}
