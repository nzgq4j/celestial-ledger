import { z } from "zod";
import { localeTags } from "@/lib/i18n/config";
import {
  dailyEvidenceSchema,
  dailyReadingAnalysisSchema,
  dailyThemeSchema,
} from "@/lib/daily-readings/domain";

export const WEEKLY_READING_SCHEMA_VERSION = "weekly-reading-v3";
export const WEEKLY_READING_METHOD_VERSION = "weekly-method-v3";
export const WEEKLY_READING_RULE_VERSION = "weekly-rules-v3";
export const WEEKLY_READING_CONTENT_VERSION = "weekly-content-v3";
export const WEEKLY_READING_PROMPT_VERSION = "weekly-sectional-diversity-v3";
export const WEEKLY_READING_CAPABILITY = "weekly_reading.primary";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const weeklyDayEmphasisSchema = z
  .object({
    date: isoDate,
    label: z.string().min(1),
    strength: z.number().min(0).max(1),
    themeLabel: z.string().min(1),
    narrative: z.string().min(1),
    evidenceIds: z.array(z.string().min(8)).min(1),
  })
  .strict();

export const weeklyReadingAnalysisSchema = z
  .object({
    schemaVersion: z.literal(WEEKLY_READING_SCHEMA_VERSION),
    weekStartDate: isoDate,
    weekEndDate: isoDate,
    observationTimeZone: z.string().min(1).max(100),
    locale: z.enum(localeTags),
    birthTimeKnown: z.boolean(),
    method: z
      .object({
        id: z.literal("celestial-atlas-weekly"),
        version: z.literal(WEEKLY_READING_METHOD_VERSION),
        ruleVersion: z.literal(WEEKLY_READING_RULE_VERSION),
        dailyMethodVersion: z.string().min(1),
        calculationVersion: z.string().min(1),
        ephemerisVersion: z.string().min(1),
        zodiac: z.literal("Tropical"),
        houseSystem: z.enum(["Equal (Ascendant)", "None"]),
        nodeType: z.literal("Mean"),
      })
      .strict(),
    days: z.array(dailyReadingAnalysisSchema).length(7),
    dayByDay: z.array(weeklyDayEmphasisSchema).length(7),
    dominantThemes: z.array(dailyThemeSchema).min(1).max(5),
    evidence: z.array(dailyEvidenceSchema).min(11),
    limitations: z.array(z.string()),
  })
  .strict()
  .superRefine((analysis, context) => {
    const evidenceIds = new Set(analysis.evidence.map((item) => item.id));
    for (const day of analysis.dayByDay)
      for (const id of day.evidenceIds)
        if (!evidenceIds.has(id))
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Weekly day ${day.date} references unknown evidence ${id}.`,
          });
    if (
      !analysis.birthTimeKnown &&
      analysis.days.some((day) =>
        day.positions.some((position) => position.natalHouse !== undefined),
      )
    )
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unknown birth time cannot produce weekly house evidence.",
      });
  });

const linkedNarrativeSchema = z
  .object({
    narrative: z.string().min(1),
    evidenceIds: z.array(z.string().min(8)).min(1),
  })
  .strict();

export const weeklyReadingContentSchema = z
  .object({
    schemaVersion: z.literal(WEEKLY_READING_CONTENT_VERSION),
    readingId: z.string().uuid(),
    weekStartDate: isoDate,
    weekEndDate: isoDate,
    locale: z.enum(localeTags),
    header: z
      .object({
        headline: z.string().min(1),
        dateLabel: z.string().min(1),
        methodologyLabel: z.string().min(1),
      })
      .strict(),
    bottomLineUpFront: z
      .object({
        title: z.string().min(1),
        overview: linkedNarrativeSchema,
        practicalPriorities: z
          .array(
            z
              .object({
                title: z.string().min(1),
                dayRange: z.string().min(1),
                narrative: z.string().min(1),
                evidenceIds: z.array(z.string().min(8)).min(1),
              })
              .strict(),
          )
          .min(3)
          .max(5),
        forwardLook: linkedNarrativeSchema,
      })
      .strict(),
    dayByDay: z.array(weeklyDayEmphasisSchema).length(7),
    sections: z
      .array(
        z
          .object({
            id: z.string().min(1),
            title: z.string().min(1),
            narrative: z.string().min(1),
            practicalApplications: z.array(z.string().min(1)).min(1),
            evidenceIds: z.array(z.string().min(8)).min(1),
          })
          .strict(),
      )
      .min(3),
    reflectiveQuestions: z.array(z.string().min(1)).min(3).max(6),
    limitations: z.array(z.string()),
  })
  .strict();

export const generateWeeklyReadingRequestSchema = z
  .object({
    birthProfileId: z.string().uuid(),
    weekStartDate: isoDate.optional(),
    locale: z.enum(localeTags).optional(),
  })
  .strict();

export type WeeklyReadingAnalysis = z.infer<typeof weeklyReadingAnalysisSchema>;
export type WeeklyReadingContent = z.infer<typeof weeklyReadingContentSchema>;
