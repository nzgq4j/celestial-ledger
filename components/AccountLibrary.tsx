"use client";
import { useState } from "react";
import Link from "next/link";
import { AccountReportList } from "@/components/AccountReportList";
import type { ComponentProps } from "react";
import type { MemberCopy } from "@/lib/account/member-copy";

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

const filters = ["all", "reports", "daily", "weekly", "tarot"] as const;

/** "Your library": every saved report and reading as one list of rows. */
export function AccountLibrary({
  readings,
  reports,
  copy,
  member,
  locale,
  focusReportId,
}: {
  readings: SavedReading[];
  reports: ComponentProps<typeof AccountReportList>["initialReports"];
  copy: Record<string, string>;
  member: MemberCopy;
  locale: string;
  focusReportId?: string;
}) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const shortDate = (date: string) =>
    new Date(date).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
    });
  const longDate = (date: string) =>
    new Date(date).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const visibleReadings = readings.filter(
    (item) => filter === "all" || filter === item.kind,
  );
  const showReports =
    (filter === "all" || filter === "reports") && reports.length > 0;
  const kindLabel = { tarot: member.kindTarot };
  return (
    <section
      className="member-library"
      id="library"
      aria-labelledby="library-title"
    >
      <div className="member-library__head">
        <h2 id="library-title" className="member-subtitle">
          {member.libraryTitle}
        </h2>
        <div
          className="library-filters"
          role="group"
          aria-label={member.libraryFilters}
        >
          {filters.map((key) => (
            <button
              type="button"
              key={key}
              className="atlas-chip"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
            >
              {key === "tarot" ? member.kindTarot : copy[key]}
            </button>
          ))}
        </div>
      </div>
      {!showReports && !visibleReadings.length ? (
        <p className="library-empty">{member.libraryEmpty}</p>
      ) : (
        <div className="library-list">
          {showReports && (
            <AccountReportList
              initialReports={reports}
              focusReportId={focusReportId}
            />
          )}
          {visibleReadings.map((item) => (
            <article className="library-row" key={`${item.kind}-${item.id}`}>
              <div className="library-row__identity">
                <h3 className="library-row__title">{item.title}</h3>
                <p className="library-row__meta">
                  {[
                    item.kind === "tarot" ? kindLabel.tarot : undefined,
                    item.status,
                    member.keptUntil.replace(
                      "{date}",
                      longDate(item.expiresAt),
                    ),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <time className="library-row__date" dateTime={item.date}>
                {shortDate(item.date)}
              </time>
              <div className="library-row__actions">
                <Link
                  className="library-row__open"
                  href={item.href}
                  aria-label={`${member.open}: ${item.title}, ${longDate(item.date)}`}
                >
                  {member.open}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
