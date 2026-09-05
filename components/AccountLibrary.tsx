"use client";
import { useState } from "react";
import Link from "next/link";
import { AccountReportList } from "@/components/AccountReportList";
import type { ComponentProps } from "react";

export type SavedReading = {
  id: string;
  title: string;
  kind: "daily" | "weekly" | "tarot";
  date: string;
  expiresAt: string;
  locale: string;
  href: string;
  status: string;
};
export function AccountLibrary({
  readings,
  reports,
  copy,
  locale,
  focusReportId,
}: {
  readings: SavedReading[];
  reports: ComponentProps<typeof AccountReportList>["initialReports"];
  copy: Record<string, string>;
  locale: string;
  focusReportId?: string;
}) {
  const [filter, setFilter] = useState("all");
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  return (
    <section className="dashboard-panel account-library" id="library">
      <h2>{copy.library}</h2>
      <div className="library-filters" role="group" aria-label={copy.library}>
        {["all", "reports", "daily", "weekly", "tarot"].map((key) => (
          <button
            type="button"
            key={key}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {copy[key] ?? "Tarot"}
          </button>
        ))}
      </div>
      {!reports.length && !readings.length && <p>{copy.empty}</p>}
      {(filter === "all" || filter === "reports") && reports.length > 0 && (
        <>
          <h3>{copy.reports}</h3>
          <AccountReportList
            initialReports={reports}
            focusReportId={focusReportId}
          />
        </>
      )}
      <div className="saved-reading-list">
        {readings
          .filter((item) => filter === "all" || filter === item.kind)
          .map((item) => (
            <article
              className="saved-reading-row"
              key={`${item.kind}-${item.id}`}
            >
              <div>
                <h3>{item.title}</h3>
                <p>
                  {formatDate(item.date)} · {item.locale} · {item.status}
                </p>
                <small>
                  {copy.until} {formatDate(item.expiresAt)}
                </small>
              </div>
              <Link className="button-secondary" href={item.href}>
                {copy.open}
              </Link>
            </article>
          ))}
      </div>
    </section>
  );
}
