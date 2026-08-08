"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

export function WeeklyReadingActions({ readingId }: { readingId: string }) {
  const router = useRouter();
  const { pack } = useLocale();
  const copy = pack.messages.account;
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!window.confirm(copy.weeklyReadingDeleteConfirm)) return;
    setBusy(true);
    const response = await fetch(`/api/weekly-readings/${readingId}`, {
      method: "DELETE",
    });
    if (response.ok) router.push("/account");
    else setBusy(false);
  }
  return (
    <div className="report-viewer-actions">
      <a
        className="button-primary"
        href={`/api/weekly-readings/${readingId}/pdf`}
        download
      >
        {copy.weeklyReadingDownload}
      </a>
      <button
        className="button-secondary"
        type="button"
        disabled={busy}
        onClick={() => void remove()}
      >
        {busy ? copy.deleting : copy.delete}
      </button>
    </div>
  );
}
