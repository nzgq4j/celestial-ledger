"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReportDeleteModal } from "@/components/ReportDeleteModal";
import { useLocale } from "@/components/LocaleProvider";
import { memberCopy } from "@/lib/account/member-copy";

export function DailyReadingActions({ readingId }: { readingId: string }) {
  const router = useRouter();
  const { locale, pack } = useLocale();
  const copy = pack.messages.account;
  const member = memberCopy[locale];
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    const response = await fetch(`/api/daily-readings/${readingId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      router.push("/account?view=library");
      router.refresh();
      return;
    }
    setBusy(false);
  }

  return (
    <>
      <div
        className="member-doc-actions"
        role="group"
        aria-label={copy.reportActions}
      >
        <a className="member-doc-actions__back" href="/account">
          ← {member.backToToday}
        </a>
        <a
          className="atlas-button atlas-button--sm"
          href={`/api/daily-readings/${readingId}/pdf`}
          download
        >
          {copy.printReport}
        </a>
        <button
          className="atlas-button-ghost atlas-button--sm member-button-danger-ghost"
          type="button"
          onClick={() => setDeleteOpen(true)}
        >
          {copy.deleteReport}
        </button>
      </div>
      <ReportDeleteModal
        open={deleteOpen}
        busy={busy}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void remove()}
      />
    </>
  );
}
