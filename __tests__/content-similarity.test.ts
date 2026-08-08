import { describe, expect, it } from "vitest";
import {
  contentSimilarity,
  contentTokens,
} from "@/lib/content-similarity/similarity";
import {
  readerProse,
  type RecentContentContext,
} from "@/lib/content-similarity/recent-context";
import { horoscopeSimilarity } from "@/lib/horoscopes/similarity";
import {
  assertWeeklyNarrativeDiversity,
  WEEKLY_NARRATIVE_SIMILARITY_THRESHOLD,
} from "@/lib/weekly-readings/calculation";
import { assertDailyReadingDiversity } from "@/lib/daily-readings/generated";
import { assertReportContentDiversity } from "@/lib/reports/similarity";
import fs from "node:fs";

function legacyHoroscopeSimilarity(left: string, right: string) {
  const shingles = (value: string) => {
    const words = contentTokens(value);
    return new Set(
      words
        .slice(0, -2)
        .map((_, index) => words.slice(index, index + 3).join(" ")),
    );
  };
  const a = shingles(left);
  const b = shingles(right);
  if (!a.size || !b.size) return 0;
  const overlap = [...a].filter((item) => b.has(item)).length;
  return overlap / (a.size + b.size - overlap);
}

function context(
  sameType: RecentContentContext["sameType"] = [],
  crossType: RecentContentContext["crossType"] = [],
): RecentContentContext {
  return {
    sameType,
    crossType,
    all: [...sameType, ...crossType],
  };
}

const repeated =
  "Name the practical boundary clearly before the afternoon conversation gathers momentum, then record what the response teaches you about timing.";

describe("shared generated-content similarity", () => {
  it("uses model-generated prose over immutable daily and weekly evidence", () => {
    const dailyRoute = fs.readFileSync(
      "app/api/daily-readings/route.ts",
      "utf8",
    );
    const weeklyRoute = fs.readFileSync(
      "app/api/weekly-readings/route.ts",
      "utf8",
    );
    const dailyGenerator = fs.readFileSync(
      "lib/daily-readings/generated.ts",
      "utf8",
    );
    const weeklyGenerator = fs.readFileSync(
      "lib/weekly-readings/generated.ts",
      "utf8",
    );
    expect(dailyRoute).toContain("await generateDailyReadingContent");
    expect(weeklyRoute).toContain("await generateWeeklyReadingContent");
    expect(dailyGenerator).toContain("recentContentInstruction");
    expect(weeklyGenerator).toContain("recentContentInstruction");
    expect(dailyGenerator).toContain(
      "DAILY_READING_SECTION_DUPLICATION_FAILED",
    );
    expect(weeklyGenerator).toContain("assertWeeklyNarrativeDiversity");
  });

  it("is bit-for-bit compatible with the horoscope reference algorithm", () => {
    const pairs = [
      [repeated, `${repeated} Keep the next step proportionate.`],
      [
        repeated,
        "A private creative experiment needs silence, play, and enough distance from consensus to reveal its real shape.",
      ],
      ["two short words", "two short words"],
    ];
    for (const [left, right] of pairs) {
      expect(contentSimilarity(left, right)).toBe(
        legacyHoroscopeSimilarity(left, right),
      );
      expect(horoscopeSimilarity(left, right)).toBe(
        legacyHoroscopeSimilarity(left, right),
      );
    }
  });

  it("uses a calibrated weekly threshold that rejects imitation, not shared topics", () => {
    expect(WEEKLY_NARRATIVE_SIMILARITY_THRESHOLD).toBeGreaterThanOrEqual(0.32);
    expect(WEEKLY_NARRATIVE_SIMILARITY_THRESHOLD).toBeLessThanOrEqual(0.38);
    expect(() =>
      assertWeeklyNarrativeDiversity([
        repeated,
        `${repeated} Keep the next step proportionate.`,
      ]),
    ).toThrow("WEEKLY_NARRATIVE_DIVERSITY_FAILED");
    expect(() =>
      assertWeeklyNarrativeDiversity([
        "Saturn asks for a boundary around unfinished work before any new promise is made.",
        "Mercury opens a playful exchange; test the idea aloud and let another perspective reshape it.",
        "The Moon favours restoration through quiet routines, nourishing food, and an earlier ending.",
      ]),
    ).not.toThrow();
  });

  it("fails repetitive daily history and passes genuinely distinct history", () => {
    const candidate = { headline: "Today", narrative: repeated };
    expect(() =>
      assertDailyReadingDiversity(
        candidate,
        context([
          {
            id: "prior",
            kind: "daily",
            periodStart: "2026-08-07",
            periodEnd: "2026-08-07",
            generatedAt: "2026-08-07T12:00:00Z",
            text: repeated,
          },
        ]),
      ),
    ).toThrow("DAILY_READING_HISTORICAL_SIMILARITY_FAILED");
    expect(() =>
      assertDailyReadingDiversity(
        candidate,
        context([
          {
            id: "prior",
            kind: "daily",
            periodStart: "2026-08-07",
            periodEnd: "2026-08-07",
            generatedAt: "2026-08-07T12:00:00Z",
            text: "A creative threshold asks for privacy and patient experimentation before the work is named.",
          },
        ]),
      ),
    ).not.toThrow();
  });

  it("rejects repetitive report sections and accepts distinct interpretations", () => {
    expect(() =>
      assertReportContentDiversity({
        sections: [
          { title: "One", narrative: repeated },
          { title: "Two", narrative: `${repeated} Keep listening.` },
        ],
      }),
    ).toThrow("REPORT_SECTION_DUPLICATION_FAILED");
    expect(() =>
      assertReportContentDiversity({
        sections: [
          { title: "Purpose", narrative: repeated },
          {
            title: "Renewal",
            narrative:
              "Release the role that once secured approval and make room for a quieter form of authority rooted in consistent practice.",
          },
        ],
      }),
    ).not.toThrow();
  });

  it("ignores shared evidence IDs but catches near-identical prose around them", () => {
    const evidenceId = "aspect:moon-saturn";
    const prior = {
      id: "weekly",
      kind: "weekly" as const,
      periodStart: "2026-08-03",
      periodEnd: "2026-08-09",
      generatedAt: "2026-08-03T12:00:00Z",
      text: repeated,
    };
    const distinct = {
      narrative:
        "A measured pause can separate inherited duty from the commitment you consciously choose to keep.",
      evidenceIds: [evidenceId],
    };
    expect(readerProse(distinct)).not.toContain(evidenceId);
    expect(() =>
      assertDailyReadingDiversity(distinct, context([], [prior])),
    ).not.toThrow();
    expect(() =>
      assertDailyReadingDiversity(
        { narrative: `${repeated} Today.`, evidenceIds: [evidenceId] },
        context([], [prior]),
      ),
    ).toThrow("DAILY_READING_CROSS_TYPE_SIMILARITY_FAILED");
  });
});
