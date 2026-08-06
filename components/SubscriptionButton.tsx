"use client";

import { useState } from "react";

export function SubscriptionButton({
  planKey,
}: {
  planKey: "personal" | "premium";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function subscribe() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/subscription-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.url)
        throw new Error(result.error ?? "Checkout could not be opened.");
      window.location.assign(result.url);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Checkout could not be opened.",
      );
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        className="button-primary"
        type="button"
        disabled={busy}
        onClick={subscribe}
      >
        {busy ? "Opening Stripe…" : `Choose ${planKey}`}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
