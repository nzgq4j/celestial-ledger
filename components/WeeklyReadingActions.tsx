"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

export function WeeklyReadingActions({ readingId }: { readingId: string }) {
  const router = useRouter();
  const { locale, pack } = useLocale();
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
      <Link className="button-secondary" href="/account">
        {
          {
            "en-GB": "Back to account",
            "de-DE": "Zurück zum Konto",
            "es-ES": "Volver a la cuenta",
            "fr-FR": "Retour au compte",
          }[locale]
        }
      </Link>
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
