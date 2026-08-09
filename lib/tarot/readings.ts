import type { PlanKey } from "@/lib/entitlements/domain";
import type {
  TarotReading,
  TarotReadingBlueprint,
  TarotReadingId,
} from "@/lib/tarot/types";

export const TAROT_READING_BLUEPRINTS = [
  {
    id: "daily",
    name: "Daily Draw",
    cardCount: 1,
    durationLabel: "1 min",
    positions: ["Today"],
    blurb: "One card. One clear reflection to carry into your day.",
  },
  {
    id: "ppf",
    name: "Past, Present & Future",
    cardCount: 3,
    durationLabel: "3 min",
    positions: ["Past", "Present", "Possible Future"],
    blurb:
      "A quick reflection on what shaped this moment and the direction you may consider.",
  },
  {
    id: "love5",
    name: "Love Reading",
    cardCount: 5,
    durationLabel: "5 min",
    positions: [
      "You",
      "Your View of Them",
      "The Connection as You See It",
      "Challenge",
      "Potential",
    ],
    blurb:
      "A focused look at your experience of connection, needs, and choices.",
  },
  {
    id: "celtic",
    name: "Celtic Cross",
    cardCount: 10,
    durationLabel: "10 min",
    positions: [
      "Present",
      "Challenge",
      "Foundation",
      "Recent Past",
      "Possible Direction",
      "Near-Term Focus",
      "Your Approach",
      "External Influences",
      "Hopes & Fears",
      "Longer-Term Perspective",
    ],
    blurb: "The classic ten-card spread for a full, layered reflection.",
  },
  {
    id: "grand",
    name: "Life & Love Grand Spread",
    cardCount: 14,
    durationLabel: "15+ min",
    positions: [
      "Where You Are Now",
      "Core Desire",
      "Past Influence",
      "Love: Current State",
      "Love: What You Need",
      "Love: Obstacle",
      "Career & Purpose",
      "Money & Security",
      "Personal Growth",
      "Family & Home",
      "Hidden Influence",
      "Advice",
      "Near-Term Direction",
      "Long-Term Perspective",
    ],
    blurb:
      "The deepest spread—life and love together, with the full arcana in play.",
  },
] as const satisfies readonly TarotReadingBlueprint[];

export type TarotReadingPlanMatrix = Record<TarotReadingId, PlanKey>;

export const TAROT_READING_PLAN_MATRIX = {
  daily: "free",
  ppf: "personal",
  love5: "personal",
  celtic: "premium",
  grand: "premium",
} as const satisfies TarotReadingPlanMatrix;

/**
 * Adds commercial access policy to the static spread definitions.
 *
 * The product matrix is deliberately supplied by the caller so access policy
 * remains explicit and independently testable from the spread content.
 */
export function configureTarotReadings(
  minimumPlans: TarotReadingPlanMatrix,
): readonly TarotReading[] {
  return TAROT_READING_BLUEPRINTS.map((reading) => ({
    ...reading,
    positions: [...reading.positions],
    minimumPlan: minimumPlans[reading.id],
  }));
}

export function findTarotReading(
  readings: readonly TarotReading[],
  id: TarotReadingId,
) {
  return readings.find((reading) => reading.id === id) ?? null;
}

export const TAROT_READINGS = configureTarotReadings(TAROT_READING_PLAN_MATRIX);
