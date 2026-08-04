"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";

type ReportStatus = "queued" | "generating" | "failed" | "completed";

export function ReportGenerationProgress({
  reportId,
  initialStatus,
}: {
  reportId: string;
  initialStatus: ReportStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [retrying, setRetrying] = useState(false);
  const { pack } = useLocale();
  const copy = pack.messages.account;

  useEffect(() => {
    if (status === "completed" || status === "failed") return;
    const poll = window.setInterval(async () => {
      const response = await fetch(`/api/reports/${reportId}?summary=1`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { status: ReportStatus };
      setStatus(payload.status);
      if (payload.status === "completed") router.refresh();
    }, 2000);
    return () => window.clearInterval(poll);
  }, [reportId, router, status]);

  async function retry() {
    setRetrying(true);
    const response = await fetch(`/api/reports/${reportId}`, {
      method: "POST",
    });
    if (response.ok) setStatus("queued");
    setRetrying(false);
  }

  const active = status === "queued" || status === "generating";
  return (
    <section className="generation-progress" aria-live="polite">
      <div className="generation-progress__heading">
        <span className="generation-progress__sigil" aria-hidden="true">
          ✦
        </span>
        <div>
          <p className="eyebrow">{copy.privateReport}</p>
          <h1>
            {status === "failed"
              ? copy.reportDraftFailed
              : copy.reportTakingShape}
          </h1>
        </div>
      </div>
      {active && (
        <>
          <div
            className={`generation-progress__track generation-progress__track--${status}`}
            role="progressbar"
            aria-label={copy.reportProgress}
            aria-valuetext={
              status === "queued"
                ? copy.preparingChartEvidence
                : copy.writingReflection
            }
          >
            <i />
          </div>
          <p className="report-status-copy">
            {status === "queued"
              ? copy.preparingNatalEvidence
              : copy.checkingChartReferences}
          </p>
          <small>{copy.canLeaveReportPage}</small>
        </>
      )}
      {status === "failed" && (
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
