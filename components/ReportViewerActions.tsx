"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { ReportDeleteModal } from "@/components/ReportDeleteModal";

export function ReportViewerActions({
  reportId,
  autoPrint,
}: {
  reportId: string;
  autoPrint: boolean;
}) {
  const router = useRouter();
  const { pack } = useLocale();
  const copy = pack.messages.account;
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!autoPrint) return;
    const timer = window.setTimeout(() => window.print(), 350);
    return () => window.clearTimeout(timer);
  }, [autoPrint]);

  async function remove() {
    setDeleting(true);
    const response = await fetch(`/api/reports/${reportId}`, {
      method: "DELETE",
    });
    if (response.ok) router.push("/account#reports");
    else setDeleting(false);
  }

  return (
    <>
      <div className="report-viewer-actions" aria-label={copy.reportActions}>
        <button
          type="button"
          className="button-quiet"
          onClick={() => window.print()}
        >
          {copy.printReport}
        </button>
        <button
          type="button"
          className="button-danger"
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
