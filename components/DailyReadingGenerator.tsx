"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";

type BirthProfileOption = { id: string; label: string };

function localDateValue() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function DailyReadingGenerator({
  profiles,
  existingReadings,
}: {
  profiles: BirthProfileOption[];
  existingReadings: Array<{
    id: string;
    reading_date: string;
    locale: string;
    generated_at: string;
  }>;
}) {
  const { locale, pack } = useLocale();
  const copy = pack.messages.account;
  const router = useRouter();
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
  const [readingDate, setReadingDate] = useState(localDateValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const existingForDate = useMemo(
    () => existingReadings.find((item) => item.reading_date === readingDate),
    [existingReadings, readingDate],
  );

  async function generate() {
    if (!profileId) return;
    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch("/api/daily-readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthProfileId: profileId,
          readingDate,
          locale,
        }),
      });
      const payload = (await response.json()) as {
        readingId?: string;
        error?: string;
      };
      if (!response.ok || !payload.readingId)
        throw new Error(payload.error ?? copy.dailyReadingFailed);
      router.push(`/daily-readings/${payload.readingId}`);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : copy.dailyReadingFailed,
      );
      setBusy(false);
    }
  }

  if (!profiles.length)
    return (
      <div className="daily-reading-empty">
        <p>{copy.dailyReadingNeedsChart}</p>
        <Link href="/#chart" className="button-secondary">
          {copy.createNatalChart}
        </Link>
      </div>
    );

  return (
    <div className="daily-reading-generator">
      <div className="daily-reading-generator__controls">
        <label>
          <span>{copy.useProfile}</span>
          <select
            value={profileId}
            onChange={(event) => setProfileId(event.target.value)}
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{copy.dailyReadingDate}</span>
          <input
            type="date"
            value={readingDate}
            onChange={(event) => setReadingDate(event.target.value)}
            required
          />
        </label>
        <button
          className="button-secondary"
          type="button"
          onClick={() => void generate()}
          disabled={busy || !readingDate || !profileId}
        >
          {busy ? copy.dailyReadingCalculating : copy.generateDailyReading}
        </button>
      </div>
      {existingForDate && (
        <p>
          <Link
            href={`/daily-readings/${existingForDate.id}`}
            className="text-link"
          >
            {copy.openDailyReading}
          </Link>
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {existingReadings.length > 0 && (
        <div className="daily-reading-history">
          <h3>{copy.dailyReadingHistory}</h3>
          <ul>
            {existingReadings.slice(0, 7).map((reading) => (
              <li key={reading.id}>
                <Link href={`/daily-readings/${reading.id}`}>
                  {new Date(
                    `${reading.reading_date}T12:00:00Z`,
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
