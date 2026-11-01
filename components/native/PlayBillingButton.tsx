"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BillingInterval } from "@/lib/membership/plans";
import {
  purchaseAtlas,
  restorePlayPurchases,
  type BillingOutcome,
} from "@/lib/native/billing-client";
import { documentNativeMessages } from "@/lib/native/messages";
import { isNativeAndroidApp } from "@/lib/native/platform";

export type PlayBillingButtonProps = {
  interval: BillingInterval;
  label: string;
  className?: string;
};

type Status = { tone: "info" | "success" | "error"; text: string } | null;

/** Maps a billing outcome to localized status copy. */
export function billingOutcomeMessage(
  outcome: BillingOutcome,
  copy = documentNativeMessages().billing,
): Exclude<Status, null> {
  switch (outcome.kind) {
    case "success":
      return outcome.plan === "atlas"
        ? { tone: "success", text: copy.success }
        : { tone: "info", text: copy.pending };
    case "cancelled":
      return { tone: "info", text: copy.cancelled };
    case "pending":
      return { tone: "info", text: copy.pending };
    case "billing_unavailable":
      return { tone: "error", text: copy.unavailable };
    case "nothing_to_restore":
      return { tone: "info", text: copy.nothingToRestore };
    case "error":
      return { tone: "error", text: copy.errors[outcome.code] };
  }
}

function useNativeApp() {
  const [native, setNative] = useState(false);
  useEffect(() => setNative(isNativeAndroidApp()), []);
  return native;
}

function StatusLine({ status }: { status: Status }) {
  return (
    <p
      role="status"
      aria-live="polite"
      style={{
        margin: status ? "10px 0 0" : 0,
        fontSize: 14,
        lineHeight: 1.5,
        color:
          status?.tone === "error"
            ? "var(--atlas-error, #e7a08f)"
            : status?.tone === "success"
              ? "var(--atlas-gold, #c9a75d)"
              : "inherit",
      }}
    >
      {status?.text}
    </p>
  );
}

/**
 * Purchases Atlas through Google Play Billing inside the Android app. The
 * purchase token is verified on the server (/api/google-play/verify), which
 * grants Atlas. Disabled outside the app; mount it in app-only UI
 * (`data-app-only`) and keep Stripe Checkout for the web.
 */
export function PlayBillingButton({
  interval,
  label,
  className,
}: PlayBillingButtonProps) {
  const native = useNativeApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function buy() {
    const copy = documentNativeMessages().billing;
    setBusy(true);
    setStatus({ tone: "info", text: copy.loading });
    try {
      const outcome = await purchaseAtlas(interval);
      setStatus(billingOutcomeMessage(outcome, copy));
      if (outcome.kind === "success") router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className={className}
        disabled={!native || busy}
        aria-busy={busy || undefined}
        onClick={buy}
      >
        {label}
      </button>
      <StatusLine status={status} />
    </div>
  );
}

/** "Restore purchases": re-verifies this Google account's Play subscriptions. */
export function RestorePurchasesButton({ className }: { className?: string }) {
  const native = useNativeApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [label, setLabel] = useState("Restore purchases");
  useEffect(() => setLabel(documentNativeMessages().billing.restore), []);

  async function restore() {
    const copy = documentNativeMessages().billing;
    setBusy(true);
    setStatus({ tone: "info", text: copy.restoring });
    try {
      const outcome = await restorePlayPurchases();
      setStatus(
        outcome.kind === "success" && outcome.plan === "atlas"
          ? { tone: "success", text: copy.restored }
          : billingOutcomeMessage(outcome, copy),
      );
      if (outcome.kind === "success") router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!native) return null;
  return (
    <div>
      <button
        type="button"
        className={className}
        disabled={busy}
        aria-busy={busy || undefined}
        onClick={restore}
      >
        {label}
      </button>
      <StatusLine status={status} />
    </div>
  );
}
