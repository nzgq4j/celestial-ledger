"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { membershipCopy } from "@/lib/membership/content";

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
  const { locale } = useLocale();
  const copy = membershipCopy[locale].actions;
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
        throw new Error(payload.error ?? copy.checkoutFailed);
      }
      window.location.assign(payload.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.checkoutFailed);
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="checkout-actions">
        {/* Play payments policy: no web purchases inside the Android app. */}
        <button
          type="button"
          data-web-only
          onClick={() => checkout(false)}
          disabled={busy}
          className={
            emphasis === "primary" ? "button-primary" : "button-secondary"
          }
        >
          {busy
            ? copy.openingCheckout
            : `${copy.purchase}${priceLabel ? ` · ${priceLabel}` : ""}`}
        </button>
        {creditAvailable && (
          <button
            type="button"
            onClick={() => checkout(true)}
            disabled={busy}
            className="button-quiet"
          >
            {copy.useIncludedReport}
          </button>
        )}
      </div>
      {error && (
        <div role="alert" className="checkout-guidance">
          <p>{error}</p>
          {actionUrl && <Link href={actionUrl}>{copy.createChart}</Link>}
        </div>
      )}
    </div>
  );
}
