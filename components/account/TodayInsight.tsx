"use client";

import { useState } from "react";

/** The dismissible notification-style insight at the top of Today. */
export function TodayInsight({
  title,
  body,
  meta,
  now,
  dismiss,
}: {
  title: string;
  body: string;
  meta: string;
  now: string;
  dismiss: string;
}) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="today2-insight" role="note" aria-label={title}>
      <span className="today2-insight__icon" aria-hidden="true">
        <span />
      </span>
      <span className="today2-insight__text">
        <span className="today2-insight__meta">
          <span>{meta}</span>
          <span>{now}</span>
        </span>
        <span className="today2-insight__title">{title}</span>
        <span className="today2-insight__body">{body}</span>
      </span>
      <button
        type="button"
        className="today2-insight__dismiss"
        aria-label={dismiss}
        onClick={() => setOpen(false)}
      >
        ×
      </button>
    </div>
  );
}
