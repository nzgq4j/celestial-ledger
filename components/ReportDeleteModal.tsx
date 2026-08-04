"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

export function ReportDeleteModal({
  open,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { pack } = useLocale();
  const copy = pack.messages.account;

  useEffect(() => {
    if (!open) return;
    setConfirmed(false);
    cancelRef.current?.focus();
  }, [open]);

  if (!open) return null;
  return (
    <div className="report-delete-backdrop" role="presentation">
      <section
        className="report-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-delete-title"
        aria-describedby="report-delete-description"
      >
        <p className="eyebrow">{copy.deleteReportKicker}</p>
        <h2 id="report-delete-title">{copy.deleteReportTitle}</h2>
        <p id="report-delete-description">{copy.deleteReportDescription}</p>
        <label className="report-delete-check">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <span>{copy.deleteReportCheckbox}</span>
        </label>
        <div className="report-delete-modal__actions">
          <button
            ref={cancelRef}
            type="button"
            className="button-quiet"
            onClick={onCancel}
            disabled={busy}
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            className="button-danger"
            onClick={onConfirm}
            disabled={!confirmed || busy}
          >
            {busy ? copy.deletingReport : copy.confirmDeleteReport}
          </button>
        </div>
      </section>
    </div>
  );
}
