"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { ReportDeleteModal } from "@/components/ReportDeleteModal";

export function ReportViewerActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const { pack } = useLocale();
  const copy = pack.messages.account;
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function remove() {
    setDeleting(true);
    const response = await fetch(`/api/reports/${reportId}`, {
      method: "DELETE",
    });
    if (response.ok) router.push("/account?view=library");
    else setDeleting(false);
  }

  return (
    <>
      <div
        className="member-doc-actions"
        role="group"
        aria-label={copy.reportActions}
      >
        <Link className="member-doc-actions__back" href="/account?view=library">
          ← {copy.returnToLibrary}
        </Link>
        <a
          className="atlas-button atlas-button--sm"
          href={`/api/reports/${reportId}/pdf`}
          download
        >
          {copy.printReport}
        </a>
        <button
          type="button"
          className="atlas-button-ghost atlas-button--sm member-button-danger-ghost"
          onClick={() => setDeleteOpen(true)}
          disabled={deleting}
        >
          {deleting ? copy.deletingReport : copy.deleteReport}
        </button>
      </div>
      <ReportDeleteModal
        open={deleteOpen}
        busy={deleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void remove()}
      />
    </>
  );
}
