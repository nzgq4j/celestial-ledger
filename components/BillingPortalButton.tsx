"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import {
  GOOGLE_PLAY_SUBSCRIPTIONS_URL,
  type SubscriptionProvider,
} from "@/lib/membership/plans";

/**
 * Opens membership management: the Stripe billing portal for web members, or
 * Google Play's subscriptions page for members who subscribed in the app.
 */
export function BillingPortalButton({
  provider = "stripe",
  label,
  className = "button-quiet",
}: {
  provider?: SubscriptionProvider;
  label?: string;
  className?: string;
}) {
  const { pack } = useLocale();
  const copy = pack.messages.account;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (provider === "google_play")
    return (
      <a
        className={className}
        href={GOOGLE_PLAY_SUBSCRIPTIONS_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {label ?? copy.manageBilling}
      </a>
    );

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
        className={className}
        type="button"
        disabled={busy}
        onClick={openPortal}
      >
        {busy ? copy.openingBilling : (label ?? copy.manageBilling)}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
