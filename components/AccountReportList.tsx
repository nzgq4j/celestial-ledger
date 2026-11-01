"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { defaultLocale, isLocaleTag, localeRegistry } from "@/lib/i18n/config";
import { ReportDeleteModal } from "@/components/ReportDeleteModal";
import {
  hasScheduledAutomaticReportRetry,
  reportStatusPollInterval,
} from "@/lib/reports/retry-state";

type ReportStatus = "queued" | "generating" | "failed" | "completed";
type LibraryReport = {
  id: string;
  report_type: string;
  status: string;
  locale: string;
  attempts: number;
  next_attempt_at: string;
  expires_at: string | null;
  created_at: string;
};

function isActiveReport(report: LibraryReport) {
  return (
    report.status === "queued" ||
    report.status === "generating" ||
    hasScheduledAutomaticReportRetry(
      report.status,
      report.next_attempt_at,
      report.attempts,
    )
  );
}

function normalizeReports(reports: LibraryReport[]) {
  return reports.map((report) => ({
    ...report,
    status: (["queued", "generating", "failed", "completed"].includes(
      report.status,
    )
      ? report.status
      : "failed") as ReportStatus,
    locale: isLocaleTag(report.locale) ? report.locale : defaultLocale,
  }));
}

export function AccountReportList({
  initialReports,
  focusReportId,
}: {
  initialReports: LibraryReport[];
  focusReportId?: string;
}) {
  const [reports, setReports] = useState(() =>
    normalizeReports(initialReports),
  );
  const [busyId, setBusyId] = useState<string>();
  const [progressPhase, setProgressPhase] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<string>();
  const focusedReport = useRef<string | undefined>(undefined);
  const { locale, pack } = useLocale();
  const router = useRouter();
  const copy = pack.messages.account;
  const hasActiveReports = reports.some(isActiveReport);

  useEffect(() => {
    setReports(normalizeReports(initialReports));
  }, [initialReports]);

  useEffect(() => {
    if (!focusReportId || focusedReport.current === focusReportId) return;
    const report = document.getElementById(`report-${focusReportId}`);
    if (!report) return;
    focusedReport.current = focusReportId;
    window.requestAnimationFrame(() => {
      report.scrollIntoView({ behavior: "smooth", block: "center" });
      report.focus({ preventScroll: true });
    });
  }, [focusReportId, reports]);

  useEffect(() => {
    if (
      !hasActiveReports ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const interval = window.setInterval(
      () => setProgressPhase((phase) => (phase + 1) % 5),
      3200,
    );
    return () => window.clearInterval(interval);
  }, [hasActiveReports]);

  useEffect(() => {
    const pollIntervals = reports
      .map((report) =>
        reportStatusPollInterval(
          report.status,
          report.next_attempt_at,
          report.attempts,
        ),
      )
      .filter((interval): interval is number => interval !== null);
    if (pollIntervals.length === 0) return;
    const poll = window.setInterval(
      async () => {
        const active = reports.filter(isActiveReport);
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
                attempts: number;
                nextAttemptAt: string;
              };
            } catch {
              return null;
            }
          }),
        );
        setReports((current) =>
          current.map((report) => {
            const update = updates.find((item) => item?.id === report.id);
            return update
              ? {
                  ...report,
                  status: update.status,
                  attempts: update.attempts,
                  next_attempt_at: update.nextAttemptAt,
                }
              : report;
          }),
        );
      },
      Math.min(...pollIntervals),
    );
    return () => window.clearInterval(poll);
  }, [reports]);

  async function retry(id: string) {
    setBusyId(id);
    const response = await fetch(`/api/reports/${id}`, { method: "POST" });
    if (response.ok)
      setReports((current) =>
        current.map((report) =>
          report.id === id
            ? {
                ...report,
                status: "queued",
                attempts: 0,
                next_attempt_at: new Date().toISOString(),
              }
            : report,
        ),
      );
    setBusyId(undefined);
  }

  async function remove(id: string) {
    setBusyId(id);
    const response = await fetch(`/api/reports/${id}`, { method: "DELETE" });
    if (response.ok)
      setReports((current) => current.filter((report) => report.id !== id));
    if (response.ok) router.refresh();
    setBusyId(undefined);
    if (response.ok) setDeleteTarget(undefined);
  }

  const labels: Record<ReportStatus, string> = {
    queued: copy.statusQueued,
    generating: copy.statusGenerating,
    failed: copy.statusFailed,
    completed: copy.statusCompleted,
  };
  const progressPhrases = [
    copy.progressReadingStars,
    copy.progressTracingPatterns,
    copy.progressExploringMeaning,
    copy.progressWeavingReflection,
    copy.progressCheckingEvidence,
  ];

  const shortDate = (date: string) =>
    new Date(date).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
    });

  return (
    <div className="library-list__group">
      {reports.map((report, index) => {
        const retryScheduled = hasScheduledAutomaticReportRetry(
          report.status,
          report.next_attempt_at,
          report.attempts,
        );
        const active = isActiveReport(report);
        const title =
          report.report_type === "recovery_reflection"
            ? copy.recoveryReflection
            : copy.careerPurpose;
        const statusLabel = retryScheduled
          ? copy.retryScheduled
          : active
            ? progressPhrases[(progressPhase + index) % progressPhrases.length]
            : labels[report.status];
        return (
          <article
            className="library-row library-row--report"
            id={`report-${report.id}`}
            key={report.id}
            tabIndex={focusReportId === report.id ? -1 : undefined}
          >
            <div className="library-row__identity">
              <h3 className="library-row__title">{title}</h3>
              <p className="library-row__meta">
                <span
                  className="library-row__status"
                  data-status={report.status}
                  aria-hidden={active}
                >
                  {statusLabel}
                </span>
                {" · "}
                <span lang={report.locale}>
                  {localeRegistry[report.locale].nativeName}
                </span>
                {report.expires_at &&
                  ` · ${copy.availableUntil} ${new Date(report.expires_at).toLocaleDateString(locale)}`}
              </p>
              {active && (
                <div
                  className={`library-row__progress library-row__progress--${retryScheduled ? "queued" : report.status}`}
                  role="progressbar"
                  aria-label={copy.reportProgress}
                  aria-valuetext={
                    retryScheduled ? copy.retryScheduled : labels[report.status]
                  }
                >
                  <i />
                </div>
              )}
            </div>
            <time className="library-row__date" dateTime={report.created_at}>
              {shortDate(report.created_at)}
            </time>
            <div
              className="library-row__actions"
              role="group"
              aria-label={copy.reportActions}
            >
              {report.status === "completed" && (
                <Link
                  className="library-row__open"
                  href={`/reports/${report.id}`}
                >
                  {copy.openReport}
                </Link>
              )}
              {report.status === "completed" && (
                <a
                  className="library-row__action"
                  href={`/api/reports/${report.id}/pdf`}
                  download
                >
                  {copy.printReport}
                </a>
              )}
              {report.status === "failed" && !retryScheduled && (
                <button
                  className="library-row__open"
                  type="button"
                  onClick={() => void retry(report.id)}
                  disabled={busyId === report.id}
                >
                  {busyId === report.id ? copy.restarting : copy.retryReport}
                </button>
              )}
              <button
                className="library-row__action library-row__action--danger"
                type="button"
                onClick={() => setDeleteTarget(report.id)}
                disabled={busyId === report.id}
              >
                {busyId === report.id ? copy.deletingReport : copy.deleteReport}
              </button>
            </div>
          </article>
        );
      })}
      <ReportDeleteModal
        open={Boolean(deleteTarget)}
        busy={Boolean(deleteTarget && busyId === deleteTarget)}
        onCancel={() => setDeleteTarget(undefined)}
        onConfirm={() => deleteTarget && void remove(deleteTarget)}
      />
    </div>
  );
}
