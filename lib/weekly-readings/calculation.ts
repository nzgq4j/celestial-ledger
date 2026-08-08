import { createHash } from "node:crypto";
import type { LocaleTag } from "@/lib/i18n/config";
import type { NatalChart } from "@/lib/types";
import { ASTRONOMY_ENGINE_VERSION, CALCULATION_VERSION } from "@/lib/astronomy";
import { buildDailyReadingAnalysis } from "@/lib/daily-readings/calculation";
import { DAILY_READING_METHOD_VERSION } from "@/lib/daily-readings/domain";
import {
  WEEKLY_READING_METHOD_VERSION,
  WEEKLY_READING_RULE_VERSION,
  WEEKLY_READING_SCHEMA_VERSION,
  weeklyReadingAnalysisSchema,
  type WeeklyReadingAnalysis,
} from "./domain";
import { contentSimilarity } from "@/lib/content-similarity/similarity";

const DAY_MS = 86_400_000;

export const WEEKLY_NARRATIVE_SIMILARITY_THRESHOLD = 0.36;

export function assertWeeklyNarrativeDiversity(narratives: string[]) {
  for (let left = 0; left < narratives.length; left += 1)
    for (let right = left + 1; right < narratives.length; right += 1)
      if (
        contentSimilarity(narratives[left], narratives[right]) >
        WEEKLY_NARRATIVE_SIMILARITY_THRESHOLD
      )
        throw new Error("WEEKLY_NARRATIVE_DIVERSITY_FAILED");
}

export function isoWeekStart(value = new Date()) {
  const date = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - weekday + 1);
  return date.toISOString().slice(0, 10);
}

export function assertIsoWeekStart(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || isoWeekStart(date) !== value)
    throw new Error("INVALID_WEEK_START");
  return value;
}

export function weekDates(weekStartDate: string) {
  const start = Date.parse(`${assertIsoWeekStart(weekStartDate)}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, index) =>
    new Date(start + index * DAY_MS).toISOString().slice(0, 10),
  );
}

export function buildWeeklyReadingAnalysis(input: {
  natalChart: NatalChart;
  weekStartDate: string;
  observationTimeZone: string;
  locale: LocaleTag;
  calculatedAtUtc?: string;
}): WeeklyReadingAnalysis {
  const dates = weekDates(input.weekStartDate);
  const calculatedAtUtc = input.calculatedAtUtc ?? new Date().toISOString();
  const days = dates.map((readingDate) =>
    buildDailyReadingAnalysis({
      natalChart: input.natalChart,
      readingDate,
      observationTimeZone: input.observationTimeZone,
      locale: input.locale,
      calculatedAtUtc,
    }),
  );
  const evidence = Array.from(
    new Map(
      days.flatMap((day) => day.evidence).map((item) => [item.id, item]),
    ).values(),
  );
  const themeRows = days.flatMap((day) => day.themes);
  const dominantThemes = Array.from(
    new Map(themeRows.map((theme) => [theme.label, theme])).values(),
  )
    .sort(
      (left, right) =>
        right.relevance + right.intensity - left.relevance - left.intensity,
    )
    .slice(0, 5);
  const themeOccurrences = new Map<string, number>();
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const dayByDay = days.map((day, dayIndex) => {
    const fallback = day.evidence[0];
    const strongestByTheme = Array.from(
      new Map(day.signals.map((signal) => [signal.theme, signal])).values(),
    ).sort(
      (left, right) =>
        right.relevance + right.intensity - left.relevance - left.intensity,
    );
    const themeSignal =
      strongestByTheme.find(
        (signal) => (themeOccurrences.get(signal.theme) ?? 0) < 2,
      ) ?? strongestByTheme[0];
    const supportingSignal = day.signals.find(
      (signal) =>
        signal.id !== themeSignal?.id && signal.theme !== themeSignal?.theme,
    );
    const occurrence = themeSignal
      ? (themeOccurrences.get(themeSignal.theme) ?? 0) + 1
      : 1;
    if (themeSignal) themeOccurrences.set(themeSignal.theme, occurrence);
    const primaryEvidence = themeSignal?.evidenceIds[0]
      ? evidenceById.get(themeSignal.evidenceIds[0])
      : fallback;
    const supportingEvidence = supportingSignal?.evidenceIds[0]
      ? evidenceById.get(supportingSignal.evidenceIds[0])
      : undefined;
    const expressions = [
      "sets the opening terms",
      "asks for a practical adjustment",
      "changes the question from reaction to choice",
      "marks the week's pivot",
      "tests what can hold under pressure",
      "creates space for integration",
      "closes the sequence with a decision about what to carry forward",
    ];
    const evidenceBridges = [
      "The decisive signature is",
      "The calculation turns on",
      "The most exact thread comes from",
      "The day is distinguished by",
      "The clearest pressure point is",
      "The evidence becomes specific through",
      "The final emphasis is anchored by",
    ];
    const counterpointBridges = [
      "Alongside it",
      "A different register appears through",
      "The picture is complicated productively by",
      "Balancing that signal",
      "A second demand enters through",
      "The surrounding context comes from",
      "In the background",
    ];
    const cleanApplication = themeSignal?.practicalApplications[
      (dayIndex + occurrence) % themeSignal.practicalApplications.length
    ]?.replace(/[.;]+$/, "");
    const cleanCaution = themeSignal?.watchFor[0]
      ?.replace(/^[A-Z]/, (letter) => letter.toLowerCase())
      .replace(/[.;]+$/, "");
    const narrative = themeSignal
      ? `${themeSignal.theme} ${expressions[dayIndex]} on ${new Intl.DateTimeFormat(input.locale, { weekday: "long", timeZone: "UTC" }).format(new Date(`${day.readingDate}T12:00:00Z`))}. ${themeSignal.interpretation} ${evidenceBridges[dayIndex]} ${primaryEvidence?.label ?? fallback.label}.${supportingEvidence ? ` ${counterpointBridges[dayIndex]} ${supportingEvidence.label}, shifting the interpretation toward ${supportingSignal?.lifeDomains.join(" and ")}.` : ""} The useful experiment is simple: ${cleanApplication ?? "observe before deciding"}. Measure the result against direct experience, especially if you notice ${cleanCaution ?? "certainty arriving before evidence"}.`
      : "The calculated sky carries a quieter signal. Use the day for observation rather than forcing a conclusion.";
    return {
      date: day.readingDate,
      label: new Intl.DateTimeFormat(input.locale, {
        weekday: "long",
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(new Date(`${day.readingDate}T12:00:00Z`)),
      strength: themeSignal
        ? Math.min(1, (themeSignal.relevance + themeSignal.intensity) / 2)
        : 0.35,
      themeLabel: themeSignal?.theme ?? fallback.label,
      narrative,
      evidenceIds: [
        ...new Set(
          [
            ...(themeSignal?.evidenceIds.length
              ? themeSignal.evidenceIds
              : [fallback.id]),
            ...(supportingSignal?.evidenceIds ?? []),
          ].filter(Boolean),
        ),
      ],
    };
  });
  return weeklyReadingAnalysisSchema.parse({
    schemaVersion: WEEKLY_READING_SCHEMA_VERSION,
    weekStartDate: dates[0],
    weekEndDate: dates[6],
    observationTimeZone: input.observationTimeZone,
    locale: input.locale,
    birthTimeKnown: days[0].birthTimeKnown,
    method: {
      id: "celestial-atlas-weekly",
      version: WEEKLY_READING_METHOD_VERSION,
      ruleVersion: WEEKLY_READING_RULE_VERSION,
      dailyMethodVersion: DAILY_READING_METHOD_VERSION,
      calculationVersion: CALCULATION_VERSION,
      ephemerisVersion: ASTRONOMY_ENGINE_VERSION,
      zodiac: "Tropical",
      houseSystem: days[0].method.natalHouseSystem,
      nodeType: "Mean",
    },
    days,
    dayByDay,
    dominantThemes,
    evidence,
    limitations: Array.from(new Set(days.flatMap((day) => day.limitations))),
  });
}

export function weeklyReadingCacheKey(input: {
  userId: string;
  birthProfileId: string;
  birthProfileUpdatedAt: string;
  weekStartDate: string;
  observationTimeZone: string;
  locale: LocaleTag;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        ...input,
        schema: WEEKLY_READING_SCHEMA_VERSION,
        method: WEEKLY_READING_METHOD_VERSION,
        rules: WEEKLY_READING_RULE_VERSION,
        calculation: CALCULATION_VERSION,
        ephemeris: ASTRONOMY_ENGINE_VERSION,
      }),
    )
    .digest("hex");
}
