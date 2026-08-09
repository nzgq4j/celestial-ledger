"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

export function BillingPortalButton() {
  const { pack } = useLocale();
  const copy = pack.messages.account;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function openPortal() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.url)
        throw new Error(result.error ?? copy.billingOpenFailed);
      window.location.assign(result.url);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : copy.billingOpenFailed,
      );
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        className="button-quiet"
        type="button"
        disabled={busy}
        onClick={openPortal}
      >
        {busy ? copy.openingBilling : copy.manageBilling}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
