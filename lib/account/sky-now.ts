import "server-only";
import { Body, Illumination, MoonPhase } from "astronomy-engine";
import { geocentricLongitude } from "@/lib/astronomy";
import { longitudeToZodiac } from "@/lib/zodiac";
import { moonPhaseIndex } from "@/lib/account/member-copy";

/**
 * The current Moon, calculated with the same Astronomy Engine pipeline as the
 * Celestial Clock (tropical, geocentric). Returns undefined if the engine
 * cannot produce a value, so callers can omit the line rather than guess.
 */
export function currentMoon(at = new Date()) {
  try {
    const elongation = MoonPhase(at);
    const longitude = geocentricLongitude("Moon", at);
    return {
      phaseIndex: moonPhaseIndex(elongation),
      illuminated: Illumination(Body.Moon, at).phase_fraction,
      sign: longitudeToZodiac(longitude).sign as string,
    };
  } catch {
    return undefined;
  }
}
