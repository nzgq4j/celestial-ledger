import { describe, expect, it } from "vitest";
import {
  contentSimilarity,
  contentTokens,
} from "@/lib/content-similarity/similarity";
import {
  assembleRecentContentContext,
  recentContentInstruction,
  readerProse,
  rollingLookbackStart,
  type RecentContentContext,
  type RecentContentItem,
} from "@/lib/content-similarity/recent-context";
import { horoscopeSimilarity } from "@/lib/horoscopes/similarity";
import {
  assertWeeklyNarrativeDiversity,
  WEEKLY_NARRATIVE_SIMILARITY_THRESHOLD,
} from "@/lib/weekly-readings/calculation";
import { assertDailyReadingDiversity } from "@/lib/daily-readings/generated";
import {
  assertReportContentDiversity,
  isReportDiversityFailure,
} from "@/lib/reports/similarity";
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

  it("catches a copied section even when the rest of a long document dilutes it", () => {
    const distinctCandidate =
      "Choose one unfinished obligation and reduce it to a bounded next action that can be completed without recruiting anyone else today.";
    const distinctPrior =
      "Protect unstructured time for a private experiment, allowing curiosity to lead before deciding whether the result deserves a public form.";
    const candidate = {
      sections: [{ narrative: repeated }, { narrative: distinctCandidate }],
    };
    const prior: RecentContentItem = {
      id: "prior-long",
      kind: "daily",
      periodStart: "2026-08-07",
      periodEnd: "2026-08-07",
      generatedAt: "2026-08-07T12:00:00Z",
      text: `${repeated}\n${distinctPrior}`,
      segments: [repeated, distinctPrior],
    };
    expect(contentSimilarity(readerProse(candidate), prior.text)).toBeLessThan(
      0.38,
    );
    expect(() =>
      assertDailyReadingDiversity(candidate, context([prior])),
    ).toThrow("DAILY_READING_HISTORICAL_SIMILARITY_FAILED");
  });

  it("uses a rolling seven-day window, newest-first ordering, and bounded context", () => {
    expect(rollingLookbackStart("2026-08-09")).toBe("2026-08-03");
    const makeItem = (
      id: string,
      kind: RecentContentItem["kind"],
      periodStart: string,
      generatedAt: string,
    ): RecentContentItem => ({
      id,
      kind,
      periodStart,
      periodEnd: periodStart,
      generatedAt,
      text: `A sufficiently long reader-facing passage for context item ${id} remains distinct from every neighboring example in this regression test.`,
    });
    const sameType = Array.from({ length: 9 }, (_, index) =>
      makeItem(
        `daily-${index}`,
        "daily",
        "2026-07-20",
        `2026-08-${String(index + 1).padStart(2, "0")}T12:00:00Z`,
      ),
    );
    const crossType = Array.from({ length: 9 }, (_, index) =>
      makeItem(
        `weekly-${index}`,
        "weekly",
        index === 0 ? "2026-08-02" : "2026-08-03",
        index === 0
          ? "2026-08-20T13:00:00Z"
          : `2026-08-${String(index + 1).padStart(2, "0")}T13:00:00Z`,
      ),
    );
    const result = assembleRecentContentContext([...sameType, ...crossType], {
      currentKind: "daily",
      periodStart: "2026-08-09",
      periodEnd: "2026-08-09",
    });
    expect(result.sameType).toHaveLength(7);
    expect(result.sameType[0]?.id).toBe("daily-8");
    expect(result.crossType).toHaveLength(7);
    expect(result.crossType.some((item) => item.id === "weekly-0")).toBe(false);
    expect(result.crossType[0]?.id).toBe("weekly-8");
    const source = fs.readFileSync(
      "lib/content-similarity/recent-context.ts",
      "utf8",
    );
    expect(source).toContain('.lte("reading_start_date", input.periodEnd)');
    expect(source).toContain("periodStart: row.reading_start_date");
  });

  it("sends representative prior passages instead of only the opening", () => {
    const segments = [
      "Opening passage establishes a grounded question about work, attention, timing, and the practical boundary that supports all four.",
      "Second passage should not be selected because bounded context needs representative coverage without reproducing the complete private reading.",
      "Middle passage introduces a different decision point and concrete guidance for testing the choice before making a larger commitment.",
      "Fourth passage should also remain absent so that the prompt stays compact while still covering more than the opening words.",
      "Closing passage turns the interpretation into a reflective question about what should continue, change, or be released after this week.",
    ];
    const instruction = recentContentInstruction(
      context([
        {
          id: "prior",
          kind: "daily",
          periodStart: "2026-08-08",
          periodEnd: "2026-08-08",
          generatedAt: "2026-08-08T12:00:00Z",
          text: segments.join("\n"),
          segments,
        },
      ]),
    );
    expect(instruction).toContain("Opening passage establishes");
    expect(instruction).toContain("Middle passage introduces");
    expect(instruction).toContain("Closing passage turns");
    expect(instruction).not.toContain("Second passage should not");
    expect(instruction).not.toContain("Fourth passage should also");
    expect(instruction).toContain("same real evidence");
  });

  it("marks only diversity failures as non-retryable report generation", () => {
    for (const code of [
      "REPORT_SECTION_DUPLICATION_FAILED",
      "REPORT_HISTORICAL_SIMILARITY_FAILED",
      "REPORT_CROSS_TYPE_SIMILARITY_FAILED",
    ])
      expect(isReportDiversityFailure(new Error(code))).toBe(true);
    expect(isReportDiversityFailure(new Error("COMPLETION_FAILED"))).toBe(
      false,
    );
    const worker = fs.readFileSync(
      "app/api/internal/report-worker/route.ts",
      "utf8",
    );
    expect(worker).toContain("!isReportDiversityFailure(error)");
  });
});
