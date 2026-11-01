"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";

function localDateValue() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

/**
 * One-tap generation of today's personal reading for the member's primary
 * chart, used on the Today screen. The server enforces the allowance; this
 * button only reports what the server says.
 */
export function DailyReadingTodayButton({
  birthProfileId,
  label,
  busyLabel,
  failedLabel,
}: {
  birthProfileId: string;
  label: string;
  busyLabel: string;
  failedLabel: string;
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function generate() {
    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch("/api/daily-readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthProfileId,
          readingDate: localDateValue(),
          locale,
        }),
      });
      const payload = (await response.json()) as {
        readingId?: string;
        error?: string;
      };
      if (!response.ok || !payload.readingId)
        throw new Error(payload.error ?? failedLabel);
      router.refresh();
      setBusy(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : failedLabel);
      setBusy(false);
    }
  }

  return (
    <div className="today-generate">
      <button
        type="button"
        className="atlas-button"
        onClick={() => void generate()}
        disabled={busy}
        aria-busy={busy}
      >
        {busy ? busyLabel : label}
      </button>
      {error && (
        <p className="member-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
