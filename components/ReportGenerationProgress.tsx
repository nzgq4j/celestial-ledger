"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { hasScheduledAutomaticReportRetry } from "@/lib/reports/retry-state";

type ReportStatus = "queued" | "generating" | "failed" | "completed";

export function ReportGenerationProgress({
  reportId,
  initialStatus,
  initialAttempts,
  initialNextAttemptAt,
}: {
  reportId: string;
  initialStatus: ReportStatus;
  initialAttempts: number;
  initialNextAttemptAt: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [nextAttemptAt, setNextAttemptAt] = useState(initialNextAttemptAt);
  const [retrying, setRetrying] = useState(false);
  const { pack } = useLocale();
  const copy = pack.messages.account;
  const retryScheduled = hasScheduledAutomaticReportRetry(
    status,
    nextAttemptAt,
    attempts,
  );

  useEffect(() => {
    if (status === "completed" || (status === "failed" && !retryScheduled))
      return;
    const poll = window.setInterval(async () => {
      const response = await fetch(`/api/reports/${reportId}?summary=1`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        status: ReportStatus;
        attempts: number;
        nextAttemptAt: string;
      };
      setStatus(payload.status);
      setAttempts(payload.attempts);
      setNextAttemptAt(payload.nextAttemptAt);
      if (payload.status === "completed") router.refresh();
    }, 2000);
    return () => window.clearInterval(poll);
  }, [reportId, retryScheduled, router, status]);

  async function retry() {
    setRetrying(true);
    const response = await fetch(`/api/reports/${reportId}`, {
      method: "POST",
    });
    if (response.ok) {
      setStatus("queued");
      setAttempts(0);
      setNextAttemptAt(new Date().toISOString());
    }
    setRetrying(false);
  }

  const active =
    status === "queued" || status === "generating" || retryScheduled;
  const terminalFailure = status === "failed" && !retryScheduled;
  return (
    <section className="generation-progress" aria-live="polite">
      <div className="generation-progress__heading">
        <span className="generation-progress__sigil" aria-hidden="true">
          ✦
        </span>
        <div>
          <p className="eyebrow">{copy.privateReport}</p>
          <h1>
            {terminalFailure ? copy.reportDraftFailed : copy.reportTakingShape}
          </h1>
        </div>
      </div>
      {active && (
        <>
          <div
            className={`generation-progress__track generation-progress__track--${retryScheduled ? "queued" : status}`}
            role="progressbar"
            aria-label={copy.reportProgress}
            aria-valuetext={
              status === "queued" || retryScheduled
                ? copy.preparingChartEvidence
                : copy.writingReflection
            }
          >
            <i />
          </div>
          <p className="report-status-copy">
            {status === "queued" || retryScheduled
              ? copy.preparingNatalEvidence
              : copy.checkingChartReferences}
          </p>
          <small>{copy.canLeaveReportPage}</small>
        </>
      )}
      {terminalFailure && (
        <div className="generation-progress__recovery">
          <p>{copy.reportEvidenceFailed}</p>
          <button
            className="button-primary"
            type="button"
            onClick={retry}
            disabled={retrying}
          >
            {retrying ? copy.restarting : copy.tryGenerationAgain}
          </button>
        </div>
      )}
    </section>
  );
}
