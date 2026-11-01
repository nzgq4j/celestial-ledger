"use client";

import "@/app/styles/atlas-membership.css";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { PlayBillingButton } from "@/components/native/PlayBillingButton";
import {
  appPlatformFromWindow,
  type AppPlatform,
} from "@/lib/app-shell/detect";
import { membershipCopy } from "@/lib/membership/content";
import { ATLAS_PLAN_KEY, type BillingInterval } from "@/lib/membership/plans";

/**
 * Starts an Atlas subscription. On the web this opens Stripe Checkout; inside
 * the Android app, Google Play Billing is required, so it renders the native
 * PlayBillingButton instead.
 */
export function SubscriptionButton({
  interval,
  label,
  className = "atlas-button atlas-button--hero",
}: {
  interval: BillingInterval;
  label: string;
  className?: string;
}) {
  const { locale } = useLocale();
  const copy = membershipCopy[locale].actions;
  // Resolved after mount so server and first client render agree.
  const [platform, setPlatform] = useState<AppPlatform>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setPlatform(appPlatformFromWindow()), []);

  if (platform === "android")
    return (
      <PlayBillingButton
        interval={interval}
        label={label}
        className={className}
      />
    );

  async function subscribe() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/subscription-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey: ATLAS_PLAN_KEY, interval }),
      });
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.url)
        throw new Error(result.error ?? copy.checkoutFailed);
      window.location.assign(result.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.checkoutFailed);
      setBusy(false);
    }
  }
  return (
    <div className="atlas-membership__action">
      <button
        className={className}
        type="button"
        disabled={busy}
        aria-busy={busy}
        onClick={subscribe}
      >
        {busy ? copy.openingCheckout : label}
      </button>
      {error && (
        <p className="atlas-membership__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
