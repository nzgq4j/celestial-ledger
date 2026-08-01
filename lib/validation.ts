import type { NatalChart } from "./types";
import { angularSeparation, DEFAULT_ASPECT_ORBS } from "./aspects";
import { longitudeToZodiac } from "./zodiac";

export class ChartValidationError extends Error {}

export function validateChart(chart: NatalChart): NatalChart {
  if (!Number.isFinite(Date.parse(chart.utc))) throw new ChartValidationError("Time conversion did not produce a valid UTC timestamp.");
  const { latitude, longitude } = chart.input.place;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) throw new ChartValidationError("Birthplace coordinates are outside valid geographic bounds.");
  for (const p of [...chart.placements, ...(chart.ascendant ? [chart.ascendant] : []), ...(chart.midheaven ? [chart.midheaven] : [])]) {
    if (!Number.isFinite(p.longitude) || p.longitude < 0 || p.longitude >= 360) throw new ChartValidationError(`${p.name} longitude is invalid.`);
    const z = longitudeToZodiac(p.longitude);
    if (z.sign !== p.sign || z.degree !== p.degree || z.minute !== p.minute) throw new ChartValidationError(`${p.name} zodiac conversion is inconsistent.`);
    if (p.house !== undefined && (p.house < 1 || p.house > 12)) throw new ChartValidationError(`${p.name} house is invalid.`);
  }
  for (const h of chart.houses) {
    if (h.house < 1 || h.house > 12 || h.longitude < 0 || h.longitude >= 360) throw new ChartValidationError("A house cusp is invalid.");
  }
  for (const aspect of chart.aspects) {
    const a = chart.placements.find(p => p.name === aspect.body1);
    const b = chart.placements.find(p => p.name === aspect.body2);
    if (!a || !b) throw new ChartValidationError("An aspect references an unknown body.");
    const actual = angularSeparation(a.longitude, b.longitude);
    if (Math.abs(actual - aspect.angle) > 1e-6 || aspect.orb < 0 || aspect.orb > DEFAULT_ASPECT_ORBS[aspect.type] + 1e-6) {
      throw new ChartValidationError("An aspect angle or orb is inconsistent.");
    }
  }
  return chart;
}
