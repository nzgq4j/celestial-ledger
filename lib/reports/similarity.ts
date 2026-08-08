import { maximumPairwiseSimilarity } from "@/lib/content-similarity/similarity";
import {
  assertRecentContentDiversity,
  readerProse,
  type RecentContentContext,
} from "@/lib/content-similarity/recent-context";

export const REPORT_SECTION_SIMILARITY_THRESHOLD = 0.36;

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
