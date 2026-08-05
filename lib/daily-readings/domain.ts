import { z } from "zod";
import { localeTags } from "@/lib/i18n/config";

export const DAILY_READING_SCHEMA_VERSION = "daily-reading-v1";
export const DAILY_READING_RULE_VERSION = "daily-rules-v1";
export const DAILY_READING_METHOD_VERSION = "daily-method-v1";

export const dailyBodySchema = z.enum([
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
]);

export const dailyAspectSchema = z.enum([
  "Conjunction",
  "Opposition",
  "Trine",
  "Square",
  "Sextile",
]);

export const temporalStateSchema = z.enum([
  "emerging",
  "building",
  "exact",
  "separating",
  "integrating",
  "recurring",
]);

export const durationClassSchema = z.enum([
  "intraday",
  "daily",
  "short-term",
  "developmental",
  "structural",
]);

export const lifeDomainSchema = z.enum([
  "communication",
  "work",
  "relationships",
  "resources",
  "home",
  "creativity",
  "self-direction",
  "restoration",
  "shared-responsibility",
]);

const provenanceSchema = z
  .object({
    provider: z.literal("astronomy-engine"),
    providerVersion: z.string().min(1),
    calculationVersion: z.string().min(1),
    calculatedAtUtc: z.string().datetime(),
    zodiac: z.literal("Tropical"),
    houseSystem: z.enum(["Equal (Ascendant)", "None"]),
    nodeType: z.literal("Mean"),
  })
  .strict();

export const dailyPositionSchema = z
  .object({
    evidenceId: z.string().min(8),
    body: dailyBodySchema,
    observedAtUtc: z.string().datetime(),
    longitudeDegrees: z.number().finite().min(0).lt(360),
    sign: z.string().min(1),
    degreeInSign: z.number().int().min(0).max(29),
    minuteInSign: z.number().int().min(0).max(59),
    speedDegreesPerDay: z.number().finite(),
    motion: z.enum(["direct", "stationary", "retrograde"]),
    natalHouse: z.number().int().min(1).max(12).optional(),
    provenance: provenanceSchema,
  })
  .strict();

export const dailyTransitSchema = z
  .object({
    evidenceId: z.string().min(8),
    transitingBody: dailyBodySchema,
    natalTarget: z.string().min(1),
    natalTargetLongitude: z.number().finite().min(0).lt(360),
    aspect: dailyAspectSchema,
    exactAngleDegrees: z.number().finite().min(0).max(180),
    actualAngleDegrees: z.number().finite().min(0).max(180),
    orbDegrees: z.number().finite().min(0).max(8),
    maximumOrbDegrees: z.number().finite().positive().max(8),
    state: temporalStateSchema,
    strength: z.number().finite().min(0).max(1),
    durationClass: durationClassSchema,
    observedAtUtc: z.string().datetime(),
    provenance: provenanceSchema,
  })
  .strict();

export const dailyEvidenceSchema = z
  .object({
    id: z.string().min(8),
    kind: z.enum(["current_position", "transit", "lunar_phase"]),
    label: z.string().min(1),
    observedAtUtc: z.string().datetime(),
    facts: z.record(z.union([z.string(), z.number(), z.boolean()])),
    provenance: provenanceSchema,
  })
  .strict();

export const dailySignalSchema = z
  .object({
    id: z.string().min(8),
    ruleId: z.string().min(1),
    ruleVersion: z.literal(DAILY_READING_RULE_VERSION),
    evidenceIds: z.array(z.string().min(8)).min(1),
    theme: z.string().min(1),
    lifeDomains: z.array(lifeDomainSchema).min(1),
    temporalState: temporalStateSchema,
    durationClass: durationClassSchema,
    confidence: z.number().min(0).max(1),
    relevance: z.number().min(0).max(1),
    intensity: z.number().min(0).max(1),
    interpretation: z.string().min(1),
    practicalApplications: z.array(z.string().min(1)).min(1),
    watchFor: z.array(z.string().min(1)),
  })
  .strict();

export const dailyThemeSchema = z
  .object({
    id: z.string().min(8),
    label: z.string().min(1),
    signalIds: z.array(z.string().min(8)).min(1),
    evidenceIds: z.array(z.string().min(8)).min(1),
    lifeDomains: z.array(lifeDomainSchema).min(1),
    relevance: z.number().min(0).max(1),
    intensity: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    durationClass: durationClassSchema,
    temporalState: temporalStateSchema,
  })
  .strict();

export const dailyReadingAnalysisSchema = z
  .object({
    schemaVersion: z.literal(DAILY_READING_SCHEMA_VERSION),
    readingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    observationTimeZone: z.string().min(1).max(100),
    locale: z.enum(localeTags),
    observedAtUtc: z.string().datetime(),
    birthTimeKnown: z.boolean(),
    method: z
      .object({
        id: z.literal("celestial-atlas-daily"),
        version: z.literal(DAILY_READING_METHOD_VERSION),
        zodiac: z.literal("Tropical"),
        natalHouseSystem: z.enum(["Equal (Ascendant)", "None"]),
        nodeType: z.literal("Mean"),
        ephemeris: z.literal("astronomy-engine"),
        ephemerisVersion: z.string().min(1),
        calculationVersion: z.string().min(1),
        transitOrbProfile: z.literal("daily-major-v1"),
        interpretationRuleVersion: z.literal(DAILY_READING_RULE_VERSION),
      })
      .strict(),
    positions: z.array(dailyPositionSchema).min(10),
    transits: z.array(dailyTransitSchema),
    lunarPhase: z
      .object({
        evidenceId: z.string().min(8),
        name: z.string().min(1),
        angleDegrees: z.number().min(0).lt(360),
        illumination: z.number().min(0).max(1),
      })
      .strict(),
    evidence: z.array(dailyEvidenceSchema).min(11),
    signals: z.array(dailySignalSchema),
    themes: z.array(dailyThemeSchema),
    timeline: z
      .object({
        recentPastSignalIds: z.array(z.string()),
        presentSignalIds: z.array(z.string()),
        emergingSignalIds: z.array(z.string()),
      })
      .strict(),
    limitations: z.array(z.string()),
  })
  .strict()
  .superRefine((analysis, context) => {
    const evidenceIds = new Set(analysis.evidence.map((item) => item.id));
    const signalIds = new Set(analysis.signals.map((item) => item.id));
    for (const signal of analysis.signals)
      for (const evidenceId of signal.evidenceIds)
        if (!evidenceIds.has(evidenceId))
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Signal ${signal.id} references unknown evidence ${evidenceId}.`,
          });
    for (const theme of analysis.themes)
      for (const signalId of theme.signalIds)
        if (!signalIds.has(signalId))
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Theme ${theme.id} references unknown signal ${signalId}.`,
          });
    if (!analysis.birthTimeKnown) {
      const invalidHouseFact = analysis.positions.some(
        (position) => position.natalHouse !== undefined,
      );
      if (invalidHouseFact)
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Unknown birth time cannot produce natal-house positions.",
        });
    }
  });

const evidenceLinkedTextSchema = z
  .object({
    narrative: z.string().min(1),
    evidenceIds: z.array(z.string().min(8)).min(1),
    sourceSectionIds: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const dailyReadingContentSchema = z
  .object({
    schemaVersion: z.literal(DAILY_READING_SCHEMA_VERSION),
    readingId: z.string().uuid(),
    civilDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    locale: z.enum(localeTags),
    header: z
      .object({
        headline: z.string().min(1),
        dateLabel: z.string().min(1),
        observationTimeZoneLabel: z.string().min(1),
        methodologyLabel: z.string().min(1),
      })
      .strict(),
    bottomLineUpFront: z
      .object({
        sectionId: z.literal("bottom-line-up-front"),
        title: z.string().min(1),
        overview: evidenceLinkedTextSchema,
        activeNow: evidenceLinkedTextSchema,
        practicalPriorities: z
          .array(
            z
              .object({
                title: z.string().min(1),
                narrative: z.string().min(1),
                evidenceIds: z.array(z.string().min(8)).min(1),
                sourceSectionIds: z.array(z.string().min(1)).min(1),
              })
              .strict(),
          )
          .min(3)
          .max(5),
        forwardLook: evidenceLinkedTextSchema,
        tensionToHold: evidenceLinkedTextSchema.optional(),
      })
      .strict(),
    dominantThemes: z.array(dailyThemeSchema).max(5),
    sections: z
      .array(
        z
          .object({
            id: z.string().min(1),
            title: z.string().min(1),
            narrative: z.string().min(1),
            practicalApplications: z.array(z.string().min(1)).min(1),
            evidenceIds: z.array(z.string().min(8)).min(1),
            signalIds: z.array(z.string().min(8)),
            themeIds: z.array(z.string().min(8)),
          })
          .strict(),
      )
      .min(4),
    reflectiveQuestions: z.array(z.string().min(1)).min(3).max(6),
    technicalAppendix: z
      .object({
        methodVersion: z.string().min(1),
        calculationVersion: z.string().min(1),
        ephemerisVersion: z.string().min(1),
        birthTimeStatus: z.enum(["known", "unknown"]),
        positionEvidenceIds: z.array(z.string().min(8)),
        transitEvidenceIds: z.array(z.string().min(8)),
      })
      .strict(),
    limitations: z.array(z.string()),
  })
  .strict()
  .superRefine((content, context) => {
    const sectionIds = new Set(content.sections.map((section) => section.id));
    const linked = [
      content.bottomLineUpFront.overview,
      content.bottomLineUpFront.activeNow,
      ...content.bottomLineUpFront.practicalPriorities,
      content.bottomLineUpFront.forwardLook,
      ...(content.bottomLineUpFront.tensionToHold
        ? [content.bottomLineUpFront.tensionToHold]
        : []),
    ];
    for (const item of linked)
      for (const sectionId of item.sourceSectionIds)
        if (!sectionIds.has(sectionId))
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `BLUF references unknown section ${sectionId}.`,
          });
  });

export const generateDailyReadingRequestSchema = z
  .object({
    birthProfileId: z.string().uuid(),
    readingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    locale: z.enum(localeTags).optional(),
  })
  .strict();

export type DailyReadingAnalysis = z.infer<typeof dailyReadingAnalysisSchema>;
export type DailyReadingContent = z.infer<typeof dailyReadingContentSchema>;
export type DailyTransit = z.infer<typeof dailyTransitSchema>;
export type DailySignal = z.infer<typeof dailySignalSchema>;
export type DailyTheme = z.infer<typeof dailyThemeSchema>;
