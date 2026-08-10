import { maximumPairwiseSimilarity } from "@/lib/content-similarity/similarity";
import {
  assertRecentContentDiversity,
  readerProse,
  readerProseSegments,
  type RecentContentContext,
} from "@/lib/content-similarity/recent-context";
import { hasReaderFacingTechnicalLeak } from "@/lib/reader-facing-copy";

export const REPORT_SECTION_SIMILARITY_THRESHOLD = 0.36;

const REPORT_DIVERSITY_FAILURES = new Set([
  "REPORT_SECTION_DUPLICATION_FAILED",
  "REPORT_HISTORICAL_SIMILARITY_FAILED",
  "REPORT_CROSS_TYPE_SIMILARITY_FAILED",
]);

export function assertReportReaderFacingCopy(report: unknown) {
  if (readerProseSegments(report).some(hasReaderFacingTechnicalLeak))
    throw new Error("REPORT_TECHNICAL_COPY_LEAK");
}

export function isReportDiversityFailure(error: unknown) {
  return error instanceof Error && REPORT_DIVERSITY_FAILURES.has(error.message);
}

export function assertReportContentDiversity(
  report: { sections: unknown[] },
  context?: RecentContentContext,
) {
  const sections = report.sections.map((section) => readerProse(section));
  if (
    maximumPairwiseSimilarity(sections).similarity >
    REPORT_SECTION_SIMILARITY_THRESHOLD
  )
    throw new Error("REPORT_SECTION_DUPLICATION_FAILED");
  if (context)
    assertRecentContentDiversity({
      candidate: report,
      context,
      historicalErrorCode: "REPORT_HISTORICAL_SIMILARITY_FAILED",
      crossTypeErrorCode: "REPORT_CROSS_TYPE_SIMILARITY_FAILED",
    });
}
