"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReportDeleteModal } from "@/components/ReportDeleteModal";

export function DailyReadingActions({ readingId }: { readingId: string }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    const response = await fetch(`/api/daily-readings/${readingId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      router.push("/account#daily-reading");
      router.refresh();
      return;
    }
    setBusy(false);
  }

  return (
    <>
      <div className="report-viewer-actions daily-reading-actions">
        <button
          className="button-secondary"
          type="button"
          onClick={() => window.print()}
        >
          Print
        </button>
        <button
          className="button-danger"
          type="button"
          onClick={() => setDeleteOpen(true)}
        >
          Delete
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
