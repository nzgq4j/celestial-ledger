import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildSampleWeeklyReading } from "@/lib/sample-reports/weekly-reading";
import { assertWeeklyReaderFacingCopy } from "@/lib/weekly-readings/generated";
import {
  WEEKLY_READING_CONTENT_VERSION,
  weeklyReadingAnalysisSchema,
  weeklyReadingContentSchema,
} from "@/lib/weekly-readings/domain";

const samplePage = readFileSync("app/samples/[report]/page.tsx", "utf8");

describe("weekly reading sample", () => {
  it("renders the weekly sample through the current subscriber view", () => {
    expect(samplePage).toContain('reportKey === "weekly-reading"');
    expect(samplePage).toContain("buildSampleWeeklyReading()");
    expect(samplePage).toContain("<WeeklyReadingView");
    expect(samplePage).toContain("isSample");
  });

  it("builds current evidence-linked content from the existing sample chart", async () => {
    const sample = await buildSampleWeeklyReading();
    expect(weeklyReadingAnalysisSchema.parse(sample.analysis)).toEqual(
      sample.analysis,
    );
    expect(weeklyReadingContentSchema.parse(sample.content)).toEqual(
      sample.content,
    );
    expect(sample.content.schemaVersion).toBe(WEEKLY_READING_CONTENT_VERSION);
    expect(sample.analysis.weekStartDate).toBe("2026-08-09");
    expect(sample.analysis.weekEndDate).toBe("2026-08-15");
    expect(sample.content.dayByDay).toHaveLength(7);
    expect(sample.profileLabel).toContain("Atlas Sample");

    const evidenceIds = new Set(
      sample.analysis.evidence.map((item) => item.id),
    );
    expect(
      sample.content.dayByDay.every((day) =>
        day.evidenceIds.every((id) => evidenceIds.has(id)),
      ),
    ).toBe(true);
    expect(
      new Set(sample.content.dayByDay.map((day) => day.narrative)).size,
    ).toBe(7);
    expect(() =>
      assertWeeklyReaderFacingCopy({
        header: sample.content.header,
        overview: sample.content.bottomLineUpFront.overview.narrative,
        priorities: sample.content.bottomLineUpFront.practicalPriorities.map(
          ({ title, narrative }) => ({ title, narrative }),
        ),
        forwardLook: sample.content.bottomLineUpFront.forwardLook.narrative,
        days: sample.content.dayByDay.map(
          ({ narrative, guidance, watchFor, themeLabel }) => ({
            narrative,
            guidance,
            watchFor,
            themeLabel,
          }),
        ),
        sections: sample.content.sections.map(
          ({ title, narrative, practicalApplications }) => ({
            title,
            narrative,
            practicalApplications,
          }),
        ),
        questions: sample.content.reflectiveQuestions,
      }),
    ).not.toThrow();
  });
});
