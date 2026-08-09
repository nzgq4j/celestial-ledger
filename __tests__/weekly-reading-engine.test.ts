import { describe, expect, it } from "vitest";
import { calculateNatalChart } from "@/lib/chart";
import { sampleBirthInput } from "@/lib/samples";
import {
  assertReadingStart,
  assertIsoWeekStart,
  buildWeeklyReadingAnalysis,
  isoDateInTimeZone,
  isoWeekStart,
  readingDates,
  weeklyReadingCacheKey,
} from "@/lib/weekly-readings/calculation";
import { buildWeeklyReadingContent } from "@/lib/weekly-readings/content";
import {
  weeklyReadingAnalysisSchema,
  weeklyReadingContentSchema,
} from "@/lib/weekly-readings/domain";
import { assertWeeklyReaderFacingCopy } from "@/lib/weekly-readings/generated";

const readingId = "e5d0c443-1d54-4aae-93e2-a263d96ee0f6";

describe("weekly reading engine", () => {
  it("keeps the entitlement bucket on Monday but starts the reading on request day", () => {
    expect(isoWeekStart(new Date("2027-01-01T18:00:00Z"))).toBe("2026-12-28");
    expect(readingDates("2026-12-29")).toEqual([
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
      "2027-01-04",
    ]);
    expect(assertReadingStart("2026-12-29")).toBe("2026-12-29");
    expect(() => assertReadingStart("2026-02-30")).toThrow(
      "INVALID_READING_START",
    );
    expect(() => assertIsoWeekStart("2026-12-29")).toThrow(
      "INVALID_WEEK_START",
    );
    expect(
      isoDateInTimeZone(
        new Date("2026-08-09T23:30:00Z"),
        "America/Los_Angeles",
      ),
    ).toBe("2026-08-09");
    expect(
      isoDateInTimeZone(new Date("2026-08-09T23:30:00Z"), "Asia/Tokyo"),
    ).toBe("2026-08-10");
  });

  it("builds seven deterministic evidence-linked daily windows", async () => {
    const natalChart = await calculateNatalChart(sampleBirthInput);
    const first = buildWeeklyReadingAnalysis({
      natalChart,
      readingStartDate: "2026-08-09",
      observationTimeZone: sampleBirthInput.place.timeZone,
      locale: "en-GB",
      calculatedAtUtc: "2026-08-01T12:00:00.000Z",
    });
    const second = buildWeeklyReadingAnalysis({
      natalChart,
      readingStartDate: "2026-08-09",
      observationTimeZone: sampleBirthInput.place.timeZone,
      locale: "en-GB",
      calculatedAtUtc: "2026-08-01T12:00:00.000Z",
    });
    expect(weeklyReadingAnalysisSchema.parse(first)).toEqual(first);
    expect(first).toEqual(second);
    expect(first.days).toHaveLength(7);
    expect(first.weekStartDate).toBe("2026-08-09");
    expect(first.weekEndDate).toBe("2026-08-15");
    expect(first.dayByDay).toHaveLength(7);
    expect(new Set(first.dayByDay.map((day) => day.narrative)).size).toBe(7);
    const themeCounts = first.dayByDay.reduce<Record<string, number>>(
      (counts, day) => ({
        ...counts,
        [day.themeLabel]: (counts[day.themeLabel] ?? 0) + 1,
      }),
      {},
    );
    expect(Object.keys(themeCounts).length).toBeGreaterThanOrEqual(4);
    expect(Math.max(...Object.values(themeCounts))).toBeLessThanOrEqual(2);
    expect(
      first.dayByDay.every((day) =>
        day.narrative.includes(
          first.evidence.find((item) => day.evidenceIds.includes(item.id))
            ?.label ?? "__missing_evidence__",
        ),
      ),
    ).toBe(true);
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
      readingStartDate: "2026-08-09",
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
      readingStartDate: "2026-08-09",
      observationTimeZone: sampleBirthInput.place.timeZone,
      locale: "en-GB",
    });
    const content = buildWeeklyReadingContent(analysis, readingId);
    expect(weeklyReadingContentSchema.parse(content)).toEqual(content);
    expect(content.dayByDay).toHaveLength(7);
    expect(
      content.dayByDay.every(
        (day) => day.guidance && day.guidance.length >= 2 && day.watchFor,
      ),
    ).toBe(true);
    expect(
      content.bottomLineUpFront.practicalPriorities.length,
    ).toBeGreaterThanOrEqual(3);
    expect(
      new Set(
        content.bottomLineUpFront.practicalPriorities.map(
          (priority) => priority.title,
        ),
      ).size,
    ).toBe(content.bottomLineUpFront.practicalPriorities.length);
    const dailyNarratives = new Set(
      content.dayByDay.map((day) => day.narrative),
    );
    expect(
      content.bottomLineUpFront.practicalPriorities.every(
        (priority) => !dailyNarratives.has(priority.narrative),
      ),
    ).toBe(true);
    expect(
      content.sections.every(
        (section) => !dailyNarratives.has(section.narrative),
      ),
    ).toBe(true);
    const words = content.bottomLineUpFront.overview.narrative
      .trim()
      .split(/\s+/).length;
    expect(words).toBeGreaterThanOrEqual(500);
    expect(words).toBeLessThanOrEqual(650);
    expect(() =>
      assertWeeklyReaderFacingCopy({
        header: content.header,
        bottomLineUpFront: {
          overview: content.bottomLineUpFront.overview.narrative,
          priorities: content.bottomLineUpFront.practicalPriorities.map(
            ({ title, narrative }) => ({ title, narrative }),
          ),
          forwardLook: content.bottomLineUpFront.forwardLook.narrative,
        },
        days: content.dayByDay.map(
          ({ narrative, guidance, watchFor, themeLabel }) => ({
            narrative,
            guidance,
            watchFor,
            themeLabel,
          }),
        ),
        sections: content.sections.map(
          ({ title, narrative, practicalApplications }) => ({
            title,
            narrative,
            practicalApplications,
          }),
        ),
      }),
    ).not.toThrow();
    expect(() =>
      assertWeeklyReaderFacingCopy({
        narrative: "Server-calculated labels show transit_abcdef123456.",
      }),
    ).toThrow("WEEKLY_READING_INTERNAL_COPY_FAILED");
  });

  it("changes the canonical key when week, profile revision, or locale changes", () => {
    const base = {
      userId: "2d8a7a3b-90e0-4715-a2a0-9165733982da",
      birthProfileId: "05ed1c6b-a723-469b-bd60-b3ca46f669f6",
      birthProfileUpdatedAt: "2026-08-05T07:00:00.000Z",
      entitlementWeekStart: "2026-08-03",
      readingStartDate: "2026-08-09",
      observationTimeZone: "Europe/London",
      locale: "en-GB" as const,
    };
    expect(weeklyReadingCacheKey(base)).not.toBe(
      weeklyReadingCacheKey({
        ...base,
        entitlementWeekStart: "2026-08-10",
        readingStartDate: "2026-08-10",
      }),
    );
    expect(weeklyReadingCacheKey(base)).not.toBe(
      weeklyReadingCacheKey({ ...base, readingStartDate: "2026-08-08" }),
    );
    expect(weeklyReadingCacheKey(base)).not.toBe(
      weeklyReadingCacheKey({ ...base, locale: "fr-FR" }),
    );
  });
});
