import { createHash } from "node:crypto";
import {
  ASTRONOMY_ENGINE_VERSION,
  CALCULATION_VERSION,
  geocentricLongitude,
  longitudeSpeed,
} from "@/lib/astronomy";
import { angularSeparation } from "@/lib/aspects";
import { houseForLongitude } from "@/lib/houses";
import { resolveLocalDateTime } from "@/lib/time";
import type { NatalChart, PlanetName } from "@/lib/types";
import { normalizeLongitude, longitudeToZodiac } from "@/lib/zodiac";
import type { LocaleTag } from "@/lib/i18n/config";
import {
  DAILY_READING_METHOD_VERSION,
  DAILY_READING_RULE_VERSION,
  DAILY_READING_SCHEMA_VERSION,
  dailyReadingAnalysisSchema,
  type DailyReadingAnalysis,
  type DailySignal,
  type DailyTheme,
  type DailyTransit,
} from "./domain";

const TRANSITING_BODIES = [
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
] as const satisfies readonly PlanetName[];

const ASPECTS = [
  { name: "Conjunction", angle: 0, maximumOrb: 4 },
  { name: "Opposition", angle: 180, maximumOrb: 4 },
  { name: "Trine", angle: 120, maximumOrb: 3 },
  { name: "Square", angle: 90, maximumOrb: 3 },
  { name: "Sextile", angle: 60, maximumOrb: 2.5 },
] as const;

type TransitBody = (typeof TRANSITING_BODIES)[number];

const bodyRules: Record<
  TransitBody,
  {
    theme: string;
    domains: DailySignal["lifeDomains"];
    interpretation: string;
    applications: string[];
    watchFor: string[];
  }
> = {
  Sun: {
    theme: "Visibility and self-direction",
    domains: ["self-direction", "work"],
    interpretation:
      "The Sun brings the natal point into clearer view and asks for conscious ownership of the pattern.",
    applications: [
      "Name the priority that deserves visible commitment.",
      "Make one decision that reflects your central direction.",
    ],
    watchFor: ["Performing certainty before the decision is ready."],
  },
  Moon: {
    theme: "Emotional timing and daily rhythm",
    domains: ["restoration", "relationships"],
    interpretation:
      "The Moon acts as a fast trigger, bringing the natal pattern into the immediate emotional and practical weather.",
    applications: [
      "Notice which response arrives before analysis and give it a name.",
      "Use a short pause to distinguish signal from passing mood.",
    ],
    watchFor: ["Treating a brief emotional crest as a permanent condition."],
  },
  Mercury: {
    theme: "Communication and discernment",
    domains: ["communication", "work"],
    interpretation:
      "Mercury activates language, decisions, documentation and the order in which information is handled.",
    applications: [
      "Put the important point in writing before the conversation begins.",
      "Check names, dates, assumptions and hand-offs before committing.",
    ],
    watchFor: ["Letting speed replace precision."],
  },
  Venus: {
    theme: "Reciprocity and value",
    domains: ["relationships", "resources"],
    interpretation:
      "Venus draws attention to reciprocity, attraction, value and the terms that make an exchange sustainable.",
    applications: [
      "Clarify what a fair exchange looks like in practical terms.",
      "Choose quality and alignment over automatic agreement.",
    ],
    watchFor: ["Using harmony to avoid a necessary distinction."],
  },
  Mars: {
    theme: "Decisive action and boundaries",
    domains: ["self-direction", "work"],
    interpretation:
      "Mars concentrates initiative, friction and the need to direct effort deliberately.",
    applications: [
      "Choose one action that can be completed cleanly.",
      "State the boundary before frustration has to state it for you.",
    ],
    watchFor: ["Escalating urgency when a narrower action would work."],
  },
  Jupiter: {
    theme: "Growth with perspective",
    domains: ["work", "self-direction"],
    interpretation:
      "Jupiter enlarges the field of view and tests which opportunities belong to a coherent longer arc.",
    applications: [
      "Compare the immediate opening with the larger direction you want to build.",
      "Expand through a bounded experiment rather than an unlimited promise.",
    ],
    watchFor: ["Assuming that more automatically means better."],
  },
  Saturn: {
    theme: "Structure and accountability",
    domains: ["work", "shared-responsibility"],
    interpretation:
      "Saturn asks the natal pattern to take form through limits, sequence, responsibility and durable standards.",
    applications: [
      "Define the standard, owner and deadline before work expands.",
      "Protect the part of the plan that must remain dependable.",
    ],
    watchFor: ["Confusing a useful limit with a verdict on possibility."],
  },
  Uranus: {
    theme: "Change and liberation",
    domains: ["self-direction", "work"],
    interpretation:
      "Uranus unsettles the established pattern so that a truer or more responsive arrangement can emerge.",
    applications: [
      "Identify the convention that no longer serves the actual problem.",
      "Test one reversible change before rebuilding the whole system.",
    ],
    watchFor: ["Breaking continuity merely to escape temporary discomfort."],
  },
  Neptune: {
    theme: "Imagination and discernment",
    domains: ["creativity", "restoration"],
    interpretation:
      "Neptune opens the symbolic and imaginative field while making clear boundaries and verification more important.",
    applications: [
      "Give intuition a form you can revisit: a sketch, note or draft.",
      "Verify practical terms before relying on an appealing impression.",
    ],
    watchFor: ["Mistaking ambiguity for agreement."],
  },
  Pluto: {
    theme: "Depth and transformation",
    domains: ["shared-responsibility", "self-direction"],
    interpretation:
      "Pluto exposes the deeper allocation of power, attachment and consequence within the natal pattern.",
    applications: [
      "Name what has become non-negotiable and why.",
      "Work at the root of the pattern instead of managing its surface repeatedly.",
    ],
    watchFor: ["Turning intensity into a contest for control."],
  },
  "North Node": {
    theme: "Direction and developmental emphasis",
    domains: ["self-direction", "work"],
    interpretation:
      "The mean North Node marks a developmental emphasis that asks for repeated, deliberate practice.",
    applications: [
      "Choose the unfamiliar practice that serves the direction you are building.",
      "Notice where repetition is creating capacity rather than merely effort.",
    ],
    watchFor: ["Expecting direction to feel immediately comfortable."],
  },
};

function stableId(prefix: string, input: string): string {
  return `${prefix}_${createHash("sha256").update(input).digest("hex").slice(0, 18)}`;
}

function dateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    !year ||
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  )
    throw new RangeError("Reading date must be a real calendar date.");
  return { year, month, day };
}

export function localCivilNoonUtc(readingDate: string, timeZone: string): Date {
  const parts = dateParts(readingDate);
  const matches = resolveLocalDateTime(
    { ...parts, hour: 12, minute: 0 },
    timeZone,
  );
  if (matches.length !== 1)
    throw new RangeError("The selected civil date could not be resolved.");
  return new Date(matches[0]);
}

function aspectOrb(
  transitLongitude: number,
  natalLongitude: number,
  exactAngle: number,
): number {
  return Math.abs(
    angularSeparation(transitLongitude, natalLongitude) - exactAngle,
  );
}

function durationClass(body: TransitBody): DailyTransit["durationClass"] {
  if (body === "Moon") return "intraday";
  if (["Sun", "Mercury", "Venus", "Mars"].includes(body)) return "short-term";
  if (["Jupiter", "Saturn"].includes(body)) return "developmental";
  return "structural";
}

function lunarPhaseName(angle: number) {
  const names = [
    "New Moon",
    "Waxing Crescent",
    "First Quarter",
    "Waxing Gibbous",
    "Full Moon",
    "Waning Gibbous",
    "Last Quarter",
    "Waning Crescent",
  ];
  return names[Math.floor(((angle + 22.5) % 360) / 45)];
}

function stateLanguage(state: DailySignal["temporalState"]): string {
  if (state === "exact") return "concentrates the pattern today";
  if (state === "building") return "is gathering and deserves preparation";
  if (state === "separating")
    return "has peaked and is moving into integration";
  return "is entering the field";
}

export function buildDailyReadingAnalysis(input: {
  natalChart: NatalChart;
  readingDate: string;
  observationTimeZone: string;
  locale: LocaleTag;
  calculatedAtUtc?: string;
}): DailyReadingAnalysis {
  const observedAt = localCivilNoonUtc(
    input.readingDate,
    input.observationTimeZone,
  );
  const observedAtUtc = observedAt.toISOString();
  const calculatedAtUtc = input.calculatedAtUtc ?? new Date().toISOString();
  const provenance = {
    provider: "astronomy-engine" as const,
    providerVersion: ASTRONOMY_ENGINE_VERSION,
    calculationVersion: CALCULATION_VERSION,
    calculatedAtUtc,
    zodiac: "Tropical" as const,
    houseSystem: input.natalChart.calculation.houseSystem,
    nodeType: "Mean" as const,
  };
  const cuspLongitudes = input.natalChart.houses.map(
    (house) => house.longitude,
  );
  const positions = TRANSITING_BODIES.map((body) => {
    const longitude = geocentricLongitude(body, observedAt);
    const zodiac = longitudeToZodiac(longitude);
    const speed = longitudeSpeed(body, observedAt);
    const evidenceId = stableId(
      "position",
      `${DAILY_READING_METHOD_VERSION}|${observedAtUtc}|${body}|${longitude.toFixed(8)}`,
    );
    return {
      evidenceId,
      body,
      observedAtUtc,
      longitudeDegrees: longitude,
      sign: zodiac.sign,
      degreeInSign: zodiac.degree,
      minuteInSign: zodiac.minute,
      speedDegreesPerDay: speed,
      motion:
        Math.abs(speed) < 0.01
          ? ("stationary" as const)
          : speed < 0
            ? ("retrograde" as const)
            : ("direct" as const),
      natalHouse: input.natalChart.timeKnown
        ? houseForLongitude(longitude, cuspLongitudes)
        : undefined,
      provenance,
    };
  });

  const natalTargets = [
    ...input.natalChart.placements,
    ...(input.natalChart.timeKnown && input.natalChart.ascendant
      ? [input.natalChart.ascendant]
      : []),
    ...(input.natalChart.timeKnown && input.natalChart.midheaven
      ? [input.natalChart.midheaven]
      : []),
  ];
  const nextSample = new Date(observedAt.getTime() + 6 * 60 * 60 * 1000);
  const transits: DailyTransit[] = [];
  for (const position of positions) {
    const nextLongitude = geocentricLongitude(position.body, nextSample);
    for (const natalTarget of natalTargets) {
      for (const definition of ASPECTS) {
        const orb = aspectOrb(
          position.longitudeDegrees,
          natalTarget.longitude,
          definition.angle,
        );
        if (orb > definition.maximumOrb) continue;
        const laterOrb = aspectOrb(
          nextLongitude,
          natalTarget.longitude,
          definition.angle,
        );
        const state =
          orb <= 0.15
            ? ("exact" as const)
            : laterOrb < orb
              ? ("building" as const)
              : ("separating" as const);
        const evidenceId = stableId(
          "transit",
          `${DAILY_READING_METHOD_VERSION}|${input.readingDate}|${position.body}|${definition.name}|${natalTarget.name}|${orb.toFixed(6)}`,
        );
        transits.push({
          evidenceId,
          transitingBody: position.body,
          natalTarget: natalTarget.name,
          natalTargetLongitude: natalTarget.longitude,
          aspect: definition.name,
          exactAngleDegrees: definition.angle,
          actualAngleDegrees: angularSeparation(
            position.longitudeDegrees,
            natalTarget.longitude,
          ),
          orbDegrees: orb,
          maximumOrbDegrees: definition.maximumOrb,
          state,
          strength: Number(
            Math.max(0, 1 - orb / definition.maximumOrb).toFixed(4),
          ),
          durationClass: durationClass(position.body),
          observedAtUtc,
          provenance,
        });
        break;
      }
    }
  }
  transits.sort(
    (a, b) => b.strength - a.strength || a.orbDegrees - b.orbDegrees,
  );

  const sun = positions.find((position) => position.body === "Sun")!;
  const moon = positions.find((position) => position.body === "Moon")!;
  const phaseAngle = normalizeLongitude(
    moon.longitudeDegrees - sun.longitudeDegrees,
  );
  const phaseEvidenceId = stableId(
    "lunar",
    `${DAILY_READING_METHOD_VERSION}|${observedAtUtc}|${phaseAngle.toFixed(6)}`,
  );
  const lunarPhase = {
    evidenceId: phaseEvidenceId,
    name: lunarPhaseName(phaseAngle),
    angleDegrees: phaseAngle,
    illumination: Number(
      ((1 - Math.cos((phaseAngle * Math.PI) / 180)) / 2).toFixed(4),
    ),
  };

  const evidence: DailyReadingAnalysis["evidence"] = [
    ...positions.map((position) => ({
      id: position.evidenceId,
      kind: "current_position" as const,
      label: `${position.body} at ${position.degreeInSign}° ${position.minuteInSign}′ ${position.sign}${position.natalHouse ? ` in natal house ${position.natalHouse}` : ""}`,
      observedAtUtc,
      facts: {
        body: position.body,
        longitudeDegrees: position.longitudeDegrees,
        sign: position.sign,
        degreeInSign: position.degreeInSign,
        minuteInSign: position.minuteInSign,
        speedDegreesPerDay: position.speedDegreesPerDay,
        motion: position.motion,
        ...(position.natalHouse ? { natalHouse: position.natalHouse } : {}),
      },
      provenance,
    })),
    ...transits.map((transit) => ({
      id: transit.evidenceId,
      kind: "transit" as const,
      label: `Transiting ${transit.transitingBody} ${transit.aspect.toLowerCase()} natal ${transit.natalTarget}, ${transit.orbDegrees.toFixed(2)}° orb, ${transit.state}`,
      observedAtUtc,
      facts: {
        transitingBody: transit.transitingBody,
        natalTarget: transit.natalTarget,
        aspect: transit.aspect,
        orbDegrees: transit.orbDegrees,
        state: transit.state,
        strength: transit.strength,
      },
      provenance,
    })),
    {
      id: phaseEvidenceId,
      kind: "lunar_phase" as const,
      label: `${lunarPhase.name}, ${phaseAngle.toFixed(1)}° phase angle`,
      observedAtUtc,
      facts: {
        phase: lunarPhase.name,
        phaseAngleDegrees: phaseAngle,
        illumination: lunarPhase.illumination,
      },
      provenance,
    },
  ];

  const signals: DailySignal[] = transits.slice(0, 18).map((transit) => {
    const rule = bodyRules[transit.transitingBody];
    const state = transit.state;
    return {
      id: stableId(
        "signal",
        `${transit.evidenceId}|${DAILY_READING_RULE_VERSION}`,
      ),
      ruleId: `transit-${transit.transitingBody.toLowerCase().replaceAll(" ", "-")}-major-aspect`,
      ruleVersion: DAILY_READING_RULE_VERSION,
      evidenceIds: [transit.evidenceId],
      theme: rule.theme,
      lifeDomains: rule.domains,
      temporalState: state,
      durationClass: transit.durationClass,
      confidence: input.natalChart.timeKnown ? 0.96 : 0.9,
      relevance: Number((0.45 + transit.strength * 0.55).toFixed(4)),
      intensity: Number(
        Math.min(1, transit.strength * (state === "exact" ? 1 : 0.9)).toFixed(
          4,
        ),
      ),
      interpretation: `${rule.interpretation} This ${transit.aspect.toLowerCase()} to natal ${transit.natalTarget} ${stateLanguage(state)}.`,
      practicalApplications: rule.applications,
      watchFor: rule.watchFor,
    };
  });
  signals.push({
    id: stableId("signal", `${phaseEvidenceId}|${DAILY_READING_RULE_VERSION}`),
    ruleId: "lunar-phase-pacing",
    ruleVersion: DAILY_READING_RULE_VERSION,
    evidenceIds: [phaseEvidenceId, moon.evidenceId],
    theme: "Lunar rhythm and pacing",
    lifeDomains: ["restoration", "self-direction"],
    temporalState: phaseAngle < 180 ? "building" : "integrating",
    durationClass: "daily",
    confidence: 0.99,
    relevance: 0.58,
    intensity: 0.5,
    interpretation: `${lunarPhase.name} describes the day's underlying rhythm and the stage of the current lunar cycle.`,
    practicalApplications: [
      phaseAngle < 180
        ? "Build the next useful step without demanding final form too early."
        : "Review what has developed and decide what deserves completion or release.",
    ],
    watchFor: [
      "Forcing the day's pace to carry more than the current phase supports.",
    ],
  });

  const themeGroups = new Map<string, DailySignal[]>();
  for (const signal of signals) {
    const group = themeGroups.get(signal.theme) ?? [];
    group.push(signal);
    themeGroups.set(signal.theme, group);
  }
  const themes: DailyTheme[] = [...themeGroups.entries()]
    .map(([label, group]) => {
      const relevance = Math.min(
        1,
        group.reduce((sum, signal) => sum + signal.relevance, 0) /
          Math.max(1, group.length) +
          Math.max(0, group.length - 1) * 0.08,
      );
      const leading = [...group].sort((a, b) => b.relevance - a.relevance)[0];
      return {
        id: stableId(
          "theme",
          `${DAILY_READING_RULE_VERSION}|${label}|${group
            .map((item) => item.id)
            .sort()
            .join("|")}`,
        ),
        label,
        signalIds: group.map((item) => item.id),
        evidenceIds: [...new Set(group.flatMap((item) => item.evidenceIds))],
        lifeDomains: [...new Set(group.flatMap((item) => item.lifeDomains))],
        relevance: Number(relevance.toFixed(4)),
        intensity: Number(
          (
            group.reduce((sum, item) => sum + item.intensity, 0) / group.length
          ).toFixed(4),
        ),
        confidence: Number(
          (
            group.reduce((sum, item) => sum + item.confidence, 0) / group.length
          ).toFixed(4),
        ),
        durationClass: leading.durationClass,
        temporalState: leading.temporalState,
      };
    })
    .sort((a, b) => b.relevance - a.relevance || b.intensity - a.intensity);

  const limitations = [
    "Exact transit times, ingresses, stations and void-of-course periods are not yet included in this foundation release.",
    "Current-location angles are not calculated; the reading uses the saved birth profile time zone for its civil date.",
  ];
  if (!input.natalChart.timeKnown)
    limitations.unshift(
      "Birth time is unknown, so natal houses, Ascendant, Midheaven and angle-dependent interpretations are excluded.",
    );

  return dailyReadingAnalysisSchema.parse({
    schemaVersion: DAILY_READING_SCHEMA_VERSION,
    readingDate: input.readingDate,
    observationTimeZone: input.observationTimeZone,
    locale: input.locale,
    observedAtUtc,
    birthTimeKnown: input.natalChart.timeKnown,
    method: {
      id: "celestial-atlas-daily",
      version: DAILY_READING_METHOD_VERSION,
      zodiac: "Tropical",
      natalHouseSystem: input.natalChart.calculation.houseSystem,
      nodeType: "Mean",
      ephemeris: "astronomy-engine",
      ephemerisVersion: ASTRONOMY_ENGINE_VERSION,
      calculationVersion: CALCULATION_VERSION,
      transitOrbProfile: "daily-major-v1",
      interpretationRuleVersion: DAILY_READING_RULE_VERSION,
    },
    positions,
    transits,
    lunarPhase,
    evidence,
    signals,
    themes,
    timeline: {
      recentPastSignalIds: signals
        .filter((signal) =>
          ["separating", "integrating"].includes(signal.temporalState),
        )
        .map((signal) => signal.id),
      presentSignalIds: signals
        .filter((signal) => signal.temporalState === "exact")
        .map((signal) => signal.id),
      emergingSignalIds: signals
        .filter((signal) =>
          ["building", "emerging"].includes(signal.temporalState),
        )
        .map((signal) => signal.id),
    },
    limitations,
  });
}

export function dailyReadingCacheKey(input: {
  userId: string;
  birthProfileId: string;
  birthProfileUpdatedAt: string;
  readingDate: string;
  observationTimeZone: string;
  locale: LocaleTag;
}) {
  return createHash("sha256")
    .update(
      [
        input.userId,
        input.birthProfileId,
        input.birthProfileUpdatedAt,
        input.readingDate,
        input.observationTimeZone,
        input.locale,
        DAILY_READING_METHOD_VERSION,
        DAILY_READING_RULE_VERSION,
        CALCULATION_VERSION,
        ASTRONOMY_ENGINE_VERSION,
      ].join("|"),
    )
    .digest("hex");
}
