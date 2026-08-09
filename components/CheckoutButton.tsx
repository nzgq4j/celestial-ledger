"use client";

import { useState } from "react";
import Link from "next/link";

export function CheckoutButton({
  reportType,
  priceLabel,
  creditAvailable = false,
  emphasis = "primary",
}: {
  reportType: string;
  priceLabel?: string;
  creditAvailable?: boolean;
  emphasis?: "primary" | "secondary";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [actionUrl, setActionUrl] = useState("");

  async function checkout(useCredit = false) {
    setBusy(true);
    setError("");
    setActionUrl("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType,
          ...(useCredit
            ? { useCredit: true, idempotencyKey: crypto.randomUUID() }
            : {}),
        }),
      });
      const payload = await response.json();
      if (response.ok && payload.usedCredit && payload.actionUrl) {
        window.location.assign(payload.actionUrl);
        return;
      }
      if (!response.ok || typeof payload.url !== "string") {
        if (typeof payload.actionUrl === "string")
          setActionUrl(payload.actionUrl);
        throw new Error(payload.error ?? "Checkout could not be started.");
      }
      window.location.assign(payload.url);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Checkout could not be started.",
      );
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="checkout-actions">
        <button
          type="button"
          onClick={() => checkout(false)}
          disabled={busy}
          className={
            emphasis === "primary" ? "button-primary" : "button-secondary"
          }
        >
          {busy
            ? "Opening Stripe…"
            : `Purchase${priceLabel ? ` · ${priceLabel}` : ""}`}
        </button>
        {creditAvailable && (
          <button
            type="button"
            onClick={() => checkout(true)}
            disabled={busy}
            className="button-quiet"
          >
            Use report credit
          </button>
        )}
      </div>
      {error && (
        <div role="alert" className="checkout-guidance">
          <p>{error}</p>
          {actionUrl && <Link href={actionUrl}>Create my natal chart</Link>}
        </div>
      )}
    </div>
  );
}
