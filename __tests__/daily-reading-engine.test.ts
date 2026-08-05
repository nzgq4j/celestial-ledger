import { describe, expect, it } from "vitest";
import { calculateNatalChart } from "@/lib/chart";
import { sampleBirthInput } from "@/lib/samples";
import {
  buildDailyReadingAnalysis,
  dailyReadingCacheKey,
  localCivilNoonUtc,
} from "@/lib/daily-readings/calculation";
import {
  DAILY_READING_BLUF_MAX_WORDS,
  DAILY_READING_BLUF_MIN_WORDS,
  bottomLineWordCount,
  buildDailyReadingContent,
} from "@/lib/daily-readings/content";
import {
  dailyReadingAnalysisSchema,
  dailyReadingContentSchema,
} from "@/lib/daily-readings/domain";
import { resolveRegisteredDailyReadingEntitlement } from "@/lib/daily-readings/entitlement";
import { projectLongitude } from "@/components/DailyReadingVisuals";

const readingId = "44bd14d1-cb20-4f63-88a0-6badcc14f632";
const generatedAt = "2026-08-05T08:00:00.000Z";

describe("registered daily reading foundation", () => {
  it("projects recorded zodiac longitudes onto the report sky map", () => {
    expect(projectLongitude(0, 40)).toEqual({ x: 50, y: 10 });
    expect(projectLongitude(90, 40)).toEqual({ x: 90, y: 50 });
    expect(projectLongitude(180, 40)).toEqual({ x: 50, y: 90 });
    expect(projectLongitude(270, 40)).toEqual({ x: 10, y: 50 });
  });

  it("resolves the reading civil date in its IANA time zone", () => {
    expect(
      localCivilNoonUtc("2026-08-05", "America/Chicago").toISOString(),
    ).toBe("2026-08-05T17:00:00.000Z");
  });

  it("builds a deterministic evidence-linked transit analysis", async () => {
    const natalChart = await calculateNatalChart(sampleBirthInput);
    const first = buildDailyReadingAnalysis({
      natalChart,
      readingDate: "2026-08-05",
      observationTimeZone: sampleBirthInput.place.timeZone,
      locale: "en-GB",
      calculatedAtUtc: generatedAt,
    });
    const second = buildDailyReadingAnalysis({
      natalChart,
      readingDate: "2026-08-05",
      observationTimeZone: sampleBirthInput.place.timeZone,
      locale: "en-GB",
      calculatedAtUtc: generatedAt,
    });

    expect(dailyReadingAnalysisSchema.parse(first)).toEqual(first);
    expect(first).toEqual(second);
    expect(first.positions).toHaveLength(11);
    expect(first.transits.length).toBeGreaterThan(0);
    expect(first.signals.length).toBeGreaterThan(0);
    expect(first.themes.length).toBeGreaterThan(0);
    expect(
      first.transits.every((transit) =>
        ["building", "exact", "separating"].includes(transit.state),
      ),
    ).toBe(true);
  });

  it("suppresses houses and angles when birth time is unknown", async () => {
    const natalChart = await calculateNatalChart({
      ...sampleBirthInput,
      time: undefined,
      timeUnknown: true,
    });
    const analysis = buildDailyReadingAnalysis({
      natalChart,
      readingDate: "2026-08-05",
      observationTimeZone: sampleBirthInput.place.timeZone,
      locale: "en-GB",
      calculatedAtUtc: generatedAt,
    });

    expect(
      analysis.positions.every((item) => item.natalHouse === undefined),
    ).toBe(true);
    expect(
      analysis.transits.every(
        (item) => !["Ascendant", "Midheaven"].includes(item.natalTarget),
      ),
    ).toBe(true);
    expect(analysis.limitations[0]).toMatch(/Birth time is unknown/);
  });

  it("renders the BLUF first with the contracted length and valid links", async () => {
    const natalChart = await calculateNatalChart(sampleBirthInput);
    const analysis = buildDailyReadingAnalysis({
      natalChart,
      readingDate: "2026-08-05",
      observationTimeZone: sampleBirthInput.place.timeZone,
      locale: "en-GB",
      calculatedAtUtc: generatedAt,
    });
    const content = buildDailyReadingContent(analysis, readingId);

    expect(dailyReadingContentSchema.parse(content)).toEqual(content);
    expect(content.bottomLineUpFront.sectionId).toBe("bottom-line-up-front");
    expect(bottomLineWordCount(content)).toBeGreaterThanOrEqual(
      DAILY_READING_BLUF_MIN_WORDS,
    );
    expect(bottomLineWordCount(content)).toBeLessThanOrEqual(
      DAILY_READING_BLUF_MAX_WORDS,
    );
    expect(content.sections[0].id).toBe("strategic-context");
  });

  it("allows a detailed BLUF of up to 1,000 words", async () => {
    const natalChart = await calculateNatalChart(sampleBirthInput);
    const analysis = buildDailyReadingAnalysis({
      natalChart,
      readingDate: "2026-08-05",
      observationTimeZone: sampleBirthInput.place.timeZone,
      locale: "en-GB",
      calculatedAtUtc: generatedAt,
    });
    const detailedAnalysis = {
      ...analysis,
      themes: analysis.themes.map((theme, index) =>
        index === 0
          ? {
              ...theme,
              label:
                "Purposeful communication, practical discernment, patient collaboration and accountable follow-through",
            }
          : theme,
      ),
    };

    const content = buildDailyReadingContent(detailedAnalysis, readingId);
    const wordCount = bottomLineWordCount(content);

    expect(wordCount).toBeGreaterThan(575);
    expect(wordCount).toBeLessThanOrEqual(DAILY_READING_BLUF_MAX_WORDS);
  });

  it("changes the cache key when a calculation input or versioned profile changes", () => {
    const base = {
      userId: "2d8a7a3b-90e0-4715-a2a0-9165733982da",
      birthProfileId: "05ed1c6b-a723-469b-bd60-b3ca46f669f6",
      birthProfileUpdatedAt: "2026-08-05T07:00:00.000Z",
      readingDate: "2026-08-05",
      observationTimeZone: "Europe/London",
      locale: "en-GB" as const,
    };
    expect(dailyReadingCacheKey(base)).not.toBe(
      dailyReadingCacheKey({ ...base, readingDate: "2026-08-06" }),
    );
  });

  it("grants the capability only to an authenticated owner with an active profile", () => {
    const profile = {
      id: "05ed1c6b-a723-469b-bd60-b3ca46f669f6",
      userId: "2d8a7a3b-90e0-4715-a2a0-9165733982da",
      expiresAt: "2027-08-05T00:00:00.000Z",
    };
    expect(
      resolveRegisteredDailyReadingEntitlement({
        userId: profile.userId,
        birthProfile: profile,
        now: new Date("2026-08-05T00:00:00.000Z"),
      }),
    ).toMatchObject({
      capability: "registered_daily_reading",
      basis: "authenticated_account",
    });
    expect(
      resolveRegisteredDailyReadingEntitlement({
        userId: "ac04f4be-9542-4f7e-8b87-2d0dfaf3114c",
        birthProfile: profile,
      }),
    ).toBeNull();
  });
});
