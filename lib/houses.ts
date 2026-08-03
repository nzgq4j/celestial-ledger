import { normalizeLongitude } from "./zodiac";

export const HOUSE_SYSTEM = "Equal (Ascendant)" as const;

export function equalHouseCusps(ascendant: number): number[] {
  return Array.from({ length: 12 }, (_, index) =>
    normalizeLongitude(ascendant + index * 30),
  );
}

function inArc(value: number, start: number, end: number): boolean {
  const normalized = normalizeLongitude(value);
  const from = normalizeLongitude(start);
  const to = normalizeLongitude(end);
  return from <= to
    ? normalized >= from && normalized < to
    : normalized >= from || normalized < to;
}

export function houseForLongitude(
  longitude: number,
  cusps: number[],
): number | undefined {
  if (cusps.length !== 12) return undefined;
  for (let index = 0; index < 12; index += 1) {
    if (inArc(longitude, cusps[index], cusps[(index + 1) % 12]))
      return index + 1;
  }
  return undefined;
}
