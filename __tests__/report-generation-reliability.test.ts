import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  MAX_AUTOMATIC_REPORT_ATTEMPTS,
  reportGenerationFailureCode,
  reportOutputTokenBudget,
  shouldRetryReportFailure,
} from "@/lib/reports/generation-control";
import {
  ACTIVE_REPORT_POLL_INTERVAL_MS,
  hasScheduledAutomaticReportRetry,
  reportStatusPollInterval,
  SCHEDULED_RETRY_POLL_INTERVAL_MS,
} from "@/lib/reports/retry-state";

describe("report generation reliability", () => {
  it("classifies provider and validation failures without storing raw details", () => {
    expect(reportGenerationFailureCode(new Error("Request timed out."))).toBe(
      "OPENAI_TIMEOUT",
    );
    expect(
      reportGenerationFailureCode({ status: 429, code: "insufficient_quota" }),
    ).toBe("OPENAI_INSUFFICIENT_QUOTA");
    expect(reportGenerationFailureCode({ status: 429 })).toBe(
      "OPENAI_RATE_LIMIT",
    );
    expect(
      reportGenerationFailureCode(
        new Error("UNKNOWN_EVIDENCE_ID:placement:sensitive"),
      ),
    ).toBe("REPORT_EVIDENCE_VALIDATION_FAILED");
  });

  it("maps schema errors to a stable failure code", () => {
    let error: unknown;
    try {
      z.string().parse(42);
    } catch (caught) {
      error = caught;
    }
    expect(reportGenerationFailureCode(error)).toBe(
      "REPORT_SCHEMA_VALIDATION_FAILED",
    );
  });

  it("caps automatic retries while leaving terminal provider failures alone", () => {
    expect(shouldRetryReportFailure("OPENAI_TIMEOUT", 1)).toBe(true);
    expect(shouldRetryReportFailure("RECOVERY_SAFETY_REJECTED", 2)).toBe(true);
    expect(
      shouldRetryReportFailure("OPENAI_TIMEOUT", MAX_AUTOMATIC_REPORT_ATTEMPTS),
    ).toBe(false);
    expect(shouldRetryReportFailure("OPENAI_INSUFFICIENT_QUOTA", 1)).toBe(
      false,
    );
    expect(shouldRetryReportFailure("OPENAI_AUTHENTICATION_FAILED", 1)).toBe(
      false,
    );
    expect(
      shouldRetryReportFailure("REPORT_SECTION_DUPLICATION_FAILED", 1),
    ).toBe(false);
  });

  it("uses a section-aware bounded output budget", () => {
    expect(reportOutputTokenBudget(1)).toBe(5_700);
    expect(reportOutputTokenBudget(3)).toBe(9_100);
    expect(reportOutputTokenBudget(6)).toBe(14_200);
    expect(reportOutputTokenBudget(99)).toBe(14_200);
  });

  it("distinguishes scheduled retries from terminal failures", () => {
    expect(
      hasScheduledAutomaticReportRetry(
        "failed",
        "2026-09-02T21:44:02.265817+00:00",
      ),
    ).toBe(true);
    expect(hasScheduledAutomaticReportRetry("failed", "infinity")).toBe(false);
    expect(hasScheduledAutomaticReportRetry("failed", "not-a-date")).toBe(
      false,
    );
    expect(
      hasScheduledAutomaticReportRetry(
        "failed",
        "2026-09-02T21:44:02.265817+00:00",
        MAX_AUTOMATIC_REPORT_ATTEMPTS,
      ),
    ).toBe(false);
    expect(
      hasScheduledAutomaticReportRetry(
        "completed",
        "2026-09-02T21:44:02.265817+00:00",
      ),
    ).toBe(false);
  });

  it("polls active work promptly and backs off while a retry is waiting", () => {
    const now = Date.parse("2026-09-03T16:00:00.000Z");
    expect(reportStatusPollInterval("generating", null, 1, now)).toBe(
      ACTIVE_REPORT_POLL_INTERVAL_MS,
    );
    expect(
      reportStatusPollInterval("failed", "2026-09-03T16:01:00.000Z", 1, now),
    ).toBe(SCHEDULED_RETRY_POLL_INTERVAL_MS);
    expect(
      reportStatusPollInterval("failed", "2026-09-03T16:00:02.000Z", 1, now),
    ).toBe(ACTIVE_REPORT_POLL_INTERVAL_MS);
    expect(reportStatusPollInterval("failed", "infinity", 1, now)).toBeNull();
  });

  it("makes one bounded low-reasoning model request per worker invocation", () => {
    const worker = fs.readFileSync(
      "app/api/internal/report-worker/route.ts",
      "utf8",
    );
    expect(worker.match(/client\.responses\.create/g)).toHaveLength(1);
    expect(worker).toContain("timeout: REPORT_GENERATION_TIMEOUT_MS");
    expect(worker).toContain('reasoning: { effort: "low" }');
    expect(worker).toContain("reportOutputTokenBudget(sectionCount)");
    expect(worker).not.toContain("for (let attempt = 0; attempt < 2");
  });
});
