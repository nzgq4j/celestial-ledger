"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";

type ReportStatus = "queued" | "generating" | "failed" | "completed";
type LibraryReport = {
  id: string;
  report_type: string;
  status: string;
  expires_at: string | null;
  created_at: string;
};

export function AccountReportList({
  initialReports,
}: {
  initialReports: LibraryReport[];
}) {
  const [reports, setReports] = useState(
    initialReports.map((report) => ({
      ...report,
      status: (["queued", "generating", "failed", "completed"].includes(
        report.status,
      )
        ? report.status
        : "failed") as ReportStatus,
    })),
  );
  const [busyId, setBusyId] = useState<string>();
  const { locale, pack } = useLocale();
  const router = useRouter();
  const copy = pack.messages.account;

  useEffect(() => {
    if (
      !reports.some(
        (report) =>
          report.status === "queued" || report.status === "generating",
      )
    )
      return;
    const poll = window.setInterval(async () => {
      const active = reports.filter(
        (report) =>
          report.status === "queued" || report.status === "generating",
      );
      const updates = await Promise.all(
        active.map(async (report) => {
          try {
            const response = await fetch(
              `/api/reports/${report.id}?summary=1`,
              { cache: "no-store" },
            );
            if (!response.ok) return null;
            return (await response.json()) as {
              id: string;
              status: ReportStatus;
            };
          } catch {
            return null;
          }
        }),
      );
      setReports((current) =>
        current.map((report) => {
          const update = updates.find((item) => item?.id === report.id);
          return update ? { ...report, status: update.status } : report;
        }),
      );
    }, 2000);
    return () => window.clearInterval(poll);
  }, [reports]);

  async function retry(id: string) {
    setBusyId(id);
    const response = await fetch(`/api/reports/${id}`, { method: "POST" });
    if (response.ok)
      setReports((current) =>
        current.map((report) =>
          report.id === id ? { ...report, status: "queued" } : report,
        ),
      );
    setBusyId(undefined);
  }

  async function remove(id: string) {
    if (!window.confirm(copy.deleteReportConfirm)) return;
    setBusyId(id);
    const response = await fetch(`/api/reports/${id}`, { method: "DELETE" });
    if (response.ok)
      setReports((current) => current.filter((report) => report.id !== id));
    if (response.ok) router.refresh();
    setBusyId(undefined);
  }

  const labels: Record<ReportStatus, string> = {
    queued: copy.statusQueued,
    generating: copy.statusGenerating,
    failed: copy.statusFailed,
    completed: copy.statusCompleted,
  };

  return (
    <div className="report-library-list">
      {reports.map((report) => {
        const active =
          report.status === "queued" || report.status === "generating";
        const title =
          report.report_type === "recovery_reflection"
            ? copy.recoveryReflection
            : copy.careerPurpose;
        return (
          <article className="report-library-row" key={report.id}>
            <div className="report-library-row__identity">
              <strong>{title}</strong>
              <small>
                {report.expires_at
                  ? `${copy.availableUntil} ${new Date(report.expires_at).toLocaleDateString(locale)}`
                  : new Date(report.created_at).toLocaleDateString(locale)}
              </small>
            </div>
            <div className="report-library-row__state" aria-live="polite">
              <span data-status={report.status}>{labels[report.status]}</span>
              {active && (
                <div
                  className={`report-row-progress report-row-progress--${report.status}`}
                  role="progressbar"
                  aria-label={copy.reportProgress}
                  aria-valuetext={labels[report.status]}
                >
                  <i />
                </div>
              )}
            </div>
            <div className="report-library-row__actions">
              {report.status === "completed" && (
                <Link href={`/reports/${report.id}`}>{copy.openReport}</Link>
              )}
              {report.status === "completed" && (
                <Link href={`/reports/${report.id}?print=1`} target="_blank">
                  {copy.printReport}
                </Link>
              )}
              {report.status === "failed" && (
                <button
                  type="button"
                  onClick={() => void retry(report.id)}
                  disabled={busyId === report.id}
                >
                  {busyId === report.id ? copy.restarting : copy.retryReport}
                </button>
              )}
              <button
                className="report-delete-action"
                type="button"
                onClick={() => void remove(report.id)}
                disabled={busyId === report.id}
              >
                {busyId === report.id ? copy.deletingReport : copy.deleteReport}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
