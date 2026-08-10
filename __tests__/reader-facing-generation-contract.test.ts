import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertReportReaderFacingCopy,
  assertReportContentDiversity,
} from "@/lib/reports/similarity";

describe("reader-facing generation contracts", () => {
  it("keeps weekly prose interpretive while technical evidence is attached separately", () => {
    const weekly = readFileSync("lib/weekly-readings/generated.ts", "utf8");
    const domain = readFileSync("lib/weekly-readings/domain.ts", "utf8");
    expect(domain).toContain(
      'WEEKLY_READING_PROMPT_VERSION = "weekly-reader-facing-v7"',
    );
    expect(weekly).toContain(
      "Do not put technical evidence in reader-facing prose",
    );
    expect(weekly).toContain(
      "The application will attach technical evidence separately at the end.",
    );
    expect(weekly).toContain("readerFacingTextOrFallback");
    expect(weekly).toContain("WEEKLY_READING_INTERNAL_COPY_FAILED");
    expect(weekly).toContain("Never reuse the sentence");
  });

  it("keeps specialty report prose separate from structured evidence mechanics", () => {
    const career = readFileSync("lib/reports/career.ts", "utf8");
    const recovery = readFileSync("lib/reports/recovery.ts", "utf8");
    const worker = readFileSync(
      "app/api/internal/report-worker/route.ts",
      "utf8",
    );
    expect(career).toContain(
      'CAREER_PROMPT_VERSION = "career-reader-facing-10"',
    );
    expect(recovery).toContain(
      'RECOVERY_PROMPT_VERSION = "recovery-reader-facing-9"',
    );
    expect(career).toContain("keep the technical support out of the prose");
    expect(recovery).toContain("keep technical support out of the prose");
    expect(career).toContain("assertReportReaderFacingCopy(report)");
    expect(recovery).toContain("assertReportReaderFacingCopy(report)");
    expect(worker).toContain(
      "Put evidence IDs only in the structured evidenceIds arrays",
    );
  });

  it("rejects raw evidence mechanics in report prose but still allows evidence arrays", () => {
    expect(() =>
      assertReportReaderFacingCopy({
        title: "Career",
        sections: [
          {
            title: "Direction",
            narrative:
              "Evidence: placement:sun shows a score of 0.91 with a 1.2 deg orb.",
            evidenceIds: ["placement:sun"],
          },
        ],
      }),
    ).toThrow("REPORT_TECHNICAL_COPY_LEAK");
    expect(() =>
      assertReportReaderFacingCopy({
        title: "Career",
        sections: [
          {
            title: "Direction",
            narrative:
              "A purposeful path becomes easier to choose when the work is specific, accountable, and emotionally honest.",
            evidenceIds: ["placement:sun"],
          },
        ],
      }),
    ).not.toThrow();
  });

  it("does not classify technical-copy failures as non-retryable diversity failures", () => {
    expect(
      (() => {
        try {
          assertReportContentDiversity({
            sections: [
              {
                narrative:
                  "A clear path needs one action, one boundary, and one review point.",
              },
              {
                narrative:
                  "A different question asks where visible work and private preparation can cooperate.",
              },
            ],
          });
          assertReportReaderFacingCopy({
            sections: [
              {
                narrative: "The evidence bundle says placement:sun is active.",
              },
            ],
          });
        } catch (error) {
          return error instanceof Error ? error.message : "";
        }
        return "";
      })(),
    ).toBe("REPORT_TECHNICAL_COPY_LEAK");
  });
});
