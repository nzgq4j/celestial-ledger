import { z } from "zod";
import { MAX_AUTOMATIC_REPORT_ATTEMPTS } from "@/lib/reports/retry-state";

export const REPORT_GENERATION_TIMEOUT_MS = 120_000;
export { MAX_AUTOMATIC_REPORT_ATTEMPTS };

const retryableFailureCodes = new Set([
  "OPENAI_TIMEOUT",
  "OPENAI_RATE_LIMIT",
  "OPENAI_SERVER_ERROR",
  "REPORT_GENERATION_FAILED",
  "REPORT_JSON_INVALID",
  "REPORT_SCHEMA_VALIDATION_FAILED",
  "REPORT_EVIDENCE_VALIDATION_FAILED",
  "COMPLETION_FAILED",
  "INCOMPLETE_RECOVERY_SECTION_FORMAT",
  "RECOVERY_SECTION_TOO_SHORT",
  "RECOVERY_SECTION_TOO_LONG",
  "RECOVERY_SAFETY_REJECTED",
  "UNSELECTED_RECOVERY_THEME",
  "DUPLICATE_RECOVERY_THEME",
  "MISSING_RECOVERY_THEME",
  "INCOMPLETE_CAREER_SECTION_FORMAT",
  "CAREER_SECTION_TOO_SHORT",
  "CAREER_SECTION_TOO_LONG",
  "UNSELECTED_CAREER_THEME",
  "DUPLICATE_CAREER_THEME",
  "MISSING_CAREER_THEME",
  "REPORT_TECHNICAL_COPY_LEAK",
]);

function errorProperty(error: unknown, property: string) {
  if (!error || typeof error !== "object" || !(property in error)) return;
  return (error as Record<string, unknown>)[property];
}

export function reportOutputTokenBudget(sectionCount: number) {
  const sections = Math.max(1, Math.min(6, Math.trunc(sectionCount) || 1));
  return Math.min(14_200, 4_000 + sections * 1_700);
}

export function reportGenerationFailureCode(error: unknown) {
  const name = errorProperty(error, "name");
  const status = errorProperty(error, "status");
  const providerCode = errorProperty(error, "code");
  const message = error instanceof Error ? error.message : undefined;

  if (
    name === "APIConnectionTimeoutError" ||
    message?.toLowerCase() === "request timed out."
  )
    return "OPENAI_TIMEOUT";
  if (status === 401 || providerCode === "invalid_api_key")
    return "OPENAI_AUTHENTICATION_FAILED";
  if (status === 403 || providerCode === "model_not_found")
    return "OPENAI_ACCESS_DENIED";
  if (status === 429)
    return providerCode === "insufficient_quota"
      ? "OPENAI_INSUFFICIENT_QUOTA"
      : "OPENAI_RATE_LIMIT";
  if (typeof status === "number" && status >= 500) return "OPENAI_SERVER_ERROR";
  if (error instanceof SyntaxError) return "REPORT_JSON_INVALID";
  if (error instanceof z.ZodError) return "REPORT_SCHEMA_VALIDATION_FAILED";
  if (message?.startsWith("UNKNOWN_EVIDENCE_ID:"))
    return "REPORT_EVIDENCE_VALIDATION_FAILED";
  if (message && /^[A-Z][A-Z0-9_]+$/.test(message)) return message.slice(0, 80);
  return "REPORT_GENERATION_FAILED";
}

export function shouldRetryReportFailure(code: string, attempts: number) {
  return (
    attempts < MAX_AUTOMATIC_REPORT_ATTEMPTS && retryableFailureCodes.has(code)
  );
}
