"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { memberCopy } from "@/lib/account/member-copy";

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
    <div
      className="member-doc-actions"
      role="group"
      aria-label={copy.reportActions}
    >
      <Link className="member-doc-actions__back" href="/account?view=library">
        ← {memberCopy[locale].backToLibrary}
      </Link>
      <a
        className="atlas-button atlas-button--sm"
        href={`/api/weekly-readings/${readingId}/pdf`}
        download
      >
        {copy.weeklyReadingDownload}
      </a>
      <button
        className="atlas-button-ghost atlas-button--sm member-button-danger-ghost"
        type="button"
        disabled={busy}
        onClick={() => void remove()}
      >
        {busy ? copy.deleting : copy.delete}
      </button>
    </div>
  );
}
