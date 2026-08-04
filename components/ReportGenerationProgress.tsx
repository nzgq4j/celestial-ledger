"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
          <p className="eyebrow">Private report</p>
          <h1>
            {status === "failed"
              ? "The first draft could not be completed"
              : "Your reflection is taking shape"}
          </h1>
        </div>
      </div>
      {active && (
        <>
          <div
            className={`generation-progress__track generation-progress__track--${status}`}
            role="progressbar"
            aria-label="Report generation progress"
            aria-valuetext={
              status === "queued"
                ? "Preparing your chart evidence"
                : "Writing and verifying your reflection"
            }
          >
            <i />
          </div>
          <p className="report-status-copy">
            {status === "queued"
              ? "Preparing your natal evidence and selected themes…"
              : "Writing your reflection and checking every chart reference…"}
          </p>
          <small>
            You can leave this page; your private report will continue
            unfolding.
          </small>
        </>
      )}
      {status === "failed" && (
        <div className="generation-progress__recovery">
          <p>
            The draft did not pass its chart-evidence check. No report was
            saved.
          </p>
          <button
            className="button-primary"
            type="button"
            onClick={retry}
            disabled={retrying}
          >
            {retrying ? "Restarting…" : "Try generation again"}
          </button>
        </div>
      )}
    </section>
  );
}
