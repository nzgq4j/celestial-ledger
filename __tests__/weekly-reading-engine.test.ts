import { describe, expect, it } from "vitest";
import { calculateNatalChart } from "@/lib/chart";
import { sampleBirthInput } from "@/lib/samples";
import {
  assertIsoWeekStart,
  buildWeeklyReadingAnalysis,
  isoWeekStart,
  weekDates,
  weeklyReadingCacheKey,
} from "@/lib/weekly-readings/calculation";
import { buildWeeklyReadingContent } from "@/lib/weekly-readings/content";
import {
  weeklyReadingAnalysisSchema,
  weeklyReadingContentSchema,
} from "@/lib/weekly-readings/domain";

const readingId = "e5d0c443-1d54-4aae-93e2-a263d96ee0f6";

describe("weekly reading engine", () => {
  it("anchors calendar weeks to Monday and spans month/year boundaries", () => {
    expect(isoWeekStart(new Date("2027-01-01T18:00:00Z"))).toBe("2026-12-28");
    expect(weekDates("2026-12-28")).toEqual([
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
    ]);
    expect(() => assertIsoWeekStart("2026-12-29")).toThrow(
      "INVALID_WEEK_START",
    );
  });

  it("builds seven deterministic evidence-linked daily windows", async () => {
    const natalChart = await calculateNatalChart(sampleBirthInput);
    const first = buildWeeklyReadingAnalysis({
      natalChart,
      weekStartDate: "2026-08-03",
      observationTimeZone: sampleBirthInput.place.timeZone,
      locale: "en-GB",
      calculatedAtUtc: "2026-08-01T12:00:00.000Z",
    });
    const second = buildWeeklyReadingAnalysis({
      natalChart,
      weekStartDate: "2026-08-03",
      observationTimeZone: sampleBirthInput.place.timeZone,
      locale: "en-GB",
      calculatedAtUtc: "2026-08-01T12:00:00.000Z",
    });
    expect(weeklyReadingAnalysisSchema.parse(first)).toEqual(first);
    expect(first).toEqual(second);
    expect(first.days).toHaveLength(7);
    expect(first.dayByDay).toHaveLength(7);
    const evidence = new Set(first.evidence.map((item) => item.id));
    expect(
      first.dayByDay.every((day) =>
        day.evidenceIds.every((id) => evidence.has(id)),
      ),
    ).toBe(true);
  });

  it("preserves unknown-time exclusions throughout the week", async () => {
    const natalChart = await calculateNatalChart({
      ...sampleBirthInput,
      time: undefined,
      timeUnknown: true,
    });
    const analysis = buildWeeklyReadingAnalysis({
      natalChart,
      weekStartDate: "2026-08-03",
      observationTimeZone: sampleBirthInput.place.timeZone,
      locale: "en-GB",
    });
    expect(
      analysis.days.every((day) =>
        day.positions.every((position) => position.natalHouse === undefined),
      ),
    ).toBe(true);
    expect(
      analysis.days.every((day) =>
        day.transits.every(
          (transit) =>
            !["Ascendant", "Midheaven"].includes(transit.natalTarget),
        ),
      ),
    ).toBe(true);
  });

  it("creates validated BLUF-first content and a complete day map", async () => {
    const natalChart = await calculateNatalChart(sampleBirthInput);
    const analysis = buildWeeklyReadingAnalysis({
      natalChart,
      weekStartDate: "2026-08-03",
      observationTimeZone: sampleBirthInput.place.timeZone,
      locale: "en-GB",
    });
    const content = buildWeeklyReadingContent(analysis, readingId);
    expect(weeklyReadingContentSchema.parse(content)).toEqual(content);
    expect(content.dayByDay).toHaveLength(7);
    expect(
      content.bottomLineUpFront.practicalPriorities.length,
    ).toBeGreaterThanOrEqual(3);
    const words = content.bottomLineUpFront.overview.narrative
      .trim()
      .split(/\s+/).length;
    expect(words).toBeGreaterThanOrEqual(500);
    expect(words).toBeLessThanOrEqual(650);
  });

  it("changes the canonical key when week, profile revision, or locale changes", () => {
    const base = {
      userId: "2d8a7a3b-90e0-4715-a2a0-9165733982da",
      birthProfileId: "05ed1c6b-a723-469b-bd60-b3ca46f669f6",
      birthProfileUpdatedAt: "2026-08-05T07:00:00.000Z",
      weekStartDate: "2026-08-03",
      observationTimeZone: "Europe/London",
      locale: "en-GB" as const,
    };
    expect(weeklyReadingCacheKey(base)).not.toBe(
      weeklyReadingCacheKey({ ...base, weekStartDate: "2026-08-10" }),
    );
    expect(weeklyReadingCacheKey(base)).not.toBe(
      weeklyReadingCacheKey({ ...base, locale: "fr-FR" }),
    );
  });
});
