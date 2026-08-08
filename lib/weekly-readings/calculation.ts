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

const DAY_MS = 86_400_000;

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
  const dayByDay = days.map((day) => {
    const theme = day.themes[0];
    const fallback = day.evidence[0];
    return {
      date: day.readingDate,
      label: new Intl.DateTimeFormat(input.locale, {
        weekday: "long",
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(new Date(`${day.readingDate}T12:00:00Z`)),
      strength: theme
        ? Math.min(1, (theme.relevance + theme.intensity) / 2)
        : 0.35,
      themeLabel: theme?.label ?? fallback.label,
      narrative: theme
        ? `${theme.label} is the strongest calculated emphasis for this day. Treat it as a reflective focus rather than a predicted outcome.`
        : "The calculated sky carries a quieter signal. Use the day for observation rather than forcing a conclusion.",
      evidenceIds: theme?.evidenceIds.length
        ? theme.evidenceIds
        : [fallback.id],
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
