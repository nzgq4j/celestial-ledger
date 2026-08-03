"use client";

import { useState } from "react";
import Link from "next/link";

export function CheckoutButton({ reportType }: { reportType: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [actionUrl, setActionUrl] = useState("");

  async function checkout() {
    setBusy(true);
    setError("");
    setActionUrl("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType }),
      });
      const payload = await response.json();
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
      <button
        type="button"
        onClick={checkout}
        disabled={busy}
        className="rounded-lg bg-[#c9a75d] px-4 py-2 font-semibold text-[#07111f]"
      >
        {busy ? "Opening Stripe…" : "Purchase"}
      </button>
      {error && (
        <div role="alert" className="checkout-guidance">
          <p>{error}</p>
          {actionUrl && <Link href={actionUrl}>Create my natal chart</Link>}
        </div>
      )}
    </div>
  );
}
