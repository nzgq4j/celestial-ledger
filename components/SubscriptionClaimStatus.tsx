"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { membershipCopy } from "@/lib/membership/content";

export function SubscriptionClaimStatus({ sessionId }: { sessionId: string }) {
  const { locale } = useLocale();
  const copy = membershipCopy[locale].claim;
  const [message, setMessage] = useState(copy.confirming);
  const [slow, setSlow] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function confirm() {
      setSlow(false);
      for (let attempt = 0; attempt < 9 && !cancelled; attempt += 1) {
        const response = await fetch("/api/stripe/subscription-claim-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const result = (await response.json()) as {
          state?: string;
          redirect?: string;
          error?: string;
        };
        if (response.ok && result.state === "ready" && result.redirect) {
          window.location.replace(result.redirect);
          return;
        }
        if (!response.ok && response.status !== 202) {
          setMessage(result.error ?? copy.failed);
          return;
        }
        setMessage(copy.confirmed);
        await new Promise((resolve) =>
          window.setTimeout(resolve, Math.min(3500, 750 + attempt * 400)),
        );
      }
      if (!cancelled) {
        setMessage(copy.slow);
        setSlow(true);
      }
    }
    void confirm();
    return () => {
      cancelled = true;
    };
  }, [sessionId, retry, copy]);

  return (
    <div className="subscription-claim-status" aria-live="polite">
      <span className="subscription-claim-status__orbit" aria-hidden="true" />
      <p>{message}</p>
      {slow && (
        <button
          className="button-primary"
          type="button"
          onClick={() => setRetry((value) => value + 1)}
        >
          {copy.retry}
        </button>
      )}
    </div>
  );
}
