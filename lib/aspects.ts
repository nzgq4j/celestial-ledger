import type { Aspect, AspectName, Placement } from "./types";

export const DEFAULT_ASPECT_ORBS: Record<AspectName, number> = {
  Conjunction: 8,
  Opposition: 8,
  Trine: 7,
  Square: 7,
  Sextile: 5
};

const TARGETS: Record<AspectName, number> = {
  Conjunction: 0,
  Opposition: 180,
  Trine: 120,
  Square: 90,
  Sextile: 60
};

export function angularSeparation(a: number, b: number): number {
  const raw = Math.abs(a - b) % 360;
  return raw > 180 ? 360 - raw : raw;
}

export function detectAspects(
  placements: Placement[],
  orbs: Record<AspectName, number> = DEFAULT_ASPECT_ORBS
): Aspect[] {
  const aspects: Aspect[] = [];
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const angle = angularSeparation(placements[i].longitude, placements[j].longitude);
      let best: { type: AspectName; orb: number } | undefined;
      for (const [type, target] of Object.entries(TARGETS) as [AspectName, number][]) {
        const orb = Math.abs(angle - target);
        if (orb <= orbs[type] && (!best || orb < best.orb)) best = { type, orb };
      }
      if (best) aspects.push({
        body1: placements[i].name,
        body2: placements[j].name,
        type: best.type,
        angle,
        orb: best.orb
      });
    }
  }
  return aspects.sort((a, b) => a.orb - b.orb);
}
