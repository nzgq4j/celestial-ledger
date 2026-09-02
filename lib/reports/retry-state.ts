export const MAX_AUTOMATIC_REPORT_ATTEMPTS = 3;

export function hasScheduledAutomaticReportRetry(
  status: string,
  nextAttemptAt: string | null | undefined,
  attempts?: number,
) {
  if (status !== "failed" || !nextAttemptAt) return false;
  if (typeof attempts === "number" && attempts >= MAX_AUTOMATIC_REPORT_ATTEMPTS)
    return false;
  const normalized = nextAttemptAt.toLowerCase();
  return normalized !== "infinity" && normalized !== "-infinity";
}
