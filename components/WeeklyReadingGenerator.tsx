"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

export function WeeklyReadingGenerator({
  primaryProfile,
  existingReadings,
}: {
  primaryProfile?: { id: string; label: string };
  existingReadings: Array<{
    id: string;
    week_start_date: string;
    week_end_date: string;
    reading_start_date: string;
    reading_end_date: string;
    locale: string;
    generated_at: string;
  }>;
}) {
  const { locale, pack } = useLocale();
  const copy = pack.messages.account;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  async function generate() {
    if (!primaryProfile) return;
    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch("/api/weekly-readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthProfileId: primaryProfile.id, locale }),
      });
      const payload = (await response.json()) as {
        readingId?: string;
        error?: string;
      };
      if (!response.ok || !payload.readingId)
        throw new Error(payload.error ?? copy.weeklyReadingFailed);
      window.location.assign(`/weekly-readings/${payload.readingId}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : copy.weeklyReadingFailed,
      );
      setBusy(false);
    }
  }
  if (!primaryProfile)
    return (
      <div className="daily-reading-empty">
        <p>{copy.weeklyReadingNeedsChart}</p>
        <Link href="/#chart" className="button-primary">
          {copy.createNatalChart}
        </Link>
      </div>
    );
  return (
    <div className="daily-reading-generator weekly-reading-generator">
      <div className="daily-reading-generator__controls">
        <label>
          <span>{copy.useProfile}</span>
          <select value={primaryProfile.id} disabled>
            <option value={primaryProfile.id}>{primaryProfile.label}</option>
          </select>
        </label>
        <button
          className="button-primary"
          type="button"
          onClick={() => void generate()}
          disabled={busy}
        >
          {busy ? copy.weeklyReadingCalculating : copy.generateWeeklyReading}
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {existingReadings.length > 0 && (
        <div className="daily-reading-history">
          <h3>{copy.weeklyReadingHistory}</h3>
          <ul>
            {existingReadings.slice(0, 8).map((reading) => (
              <li key={reading.id}>
                <Link href={`/weekly-readings/${reading.id}`}>
                  {new Date(
                    `${reading.reading_start_date}T12:00:00Z`,
                  ).toLocaleDateString(locale, {
                    dateStyle: "long",
                    timeZone: "UTC",
                  })}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
