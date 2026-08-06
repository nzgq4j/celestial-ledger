"use client";

import { useState } from "react";

export function BillingPortalButton() {
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
        throw new Error(result.error ?? "Billing portal could not be opened.");
      window.location.assign(result.url);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Billing portal could not be opened.",
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
        {busy ? "Opening billing…" : "Manage billing"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
