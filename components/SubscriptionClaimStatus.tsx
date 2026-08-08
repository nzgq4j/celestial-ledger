"use client";

import { useEffect, useState } from "react";

export function SubscriptionClaimStatus({ sessionId }: { sessionId: string }) {
  const [message, setMessage] = useState("Confirming your subscription…");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function confirm() {
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
          setMessage(
            result.error ?? "Your subscription could not be confirmed.",
          );
          return;
        }
        setMessage("Your payment is confirmed. Preparing your private atlas…");
        await new Promise((resolve) =>
          window.setTimeout(resolve, Math.min(3500, 750 + attempt * 400)),
        );
      }
      if (!cancelled)
        setMessage(
          "This is taking longer than expected. Your payment is safe; try confirmation again.",
        );
    }
    void confirm();
    return () => {
      cancelled = true;
    };
  }, [sessionId, retry]);

  return (
    <div className="subscription-claim-status" aria-live="polite">
      <span className="subscription-claim-status__orbit" aria-hidden="true" />
      <p>{message}</p>
      {message.startsWith("This is taking") && (
        <button
          className="button-primary"
          type="button"
          onClick={() => setRetry((value) => value + 1)}
        >
          Try confirmation again
        </button>
      )}
    </div>
  );
}
