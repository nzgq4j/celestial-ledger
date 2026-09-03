export const MAX_AUTOMATIC_REPORT_ATTEMPTS = 3;
export const ACTIVE_REPORT_POLL_INTERVAL_MS = 5_000;
export const SCHEDULED_RETRY_POLL_INTERVAL_MS = 15_000;

function scheduledRetryTimestamp(nextAttemptAt: string | null | undefined) {
  if (!nextAttemptAt) return;
  const timestamp = Date.parse(nextAttemptAt);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

export function hasScheduledAutomaticReportRetry(
  status: string,
  nextAttemptAt: string | null | undefined,
  attempts?: number,
) {
  if (status !== "failed") return false;
  if (typeof attempts === "number" && attempts >= MAX_AUTOMATIC_REPORT_ATTEMPTS)
    return false;
  return scheduledRetryTimestamp(nextAttemptAt) !== undefined;
}

export function reportStatusPollInterval(
  status: string,
  nextAttemptAt: string | null | undefined,
  attempts?: number,
  now = Date.now(),
) {
  if (status === "queued" || status === "generating")
    return ACTIVE_REPORT_POLL_INTERVAL_MS;
  if (!hasScheduledAutomaticReportRetry(status, nextAttemptAt, attempts))
    return null;

  const retryAt = scheduledRetryTimestamp(nextAttemptAt)!;
  const untilRetry = retryAt - now;
  return Math.max(
    ACTIVE_REPORT_POLL_INTERVAL_MS,
    Math.min(SCHEDULED_RETRY_POLL_INTERVAL_MS, untilRetry),
  );
}
