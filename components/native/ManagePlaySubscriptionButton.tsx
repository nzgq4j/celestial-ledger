"use client";

import { useEffect, useState } from "react";
import { openPlaySubscriptionManagement } from "@/lib/native/billing-client";
import { documentNativeMessages } from "@/lib/native/messages";
import { isNativeAndroidApp } from "@/lib/native/platform";

/**
 * Opens Google Play's subscription management for Play-billed Atlas members
 * (provider `google_play`). Outside the app it links to the same Play page.
 */
export function ManagePlaySubscriptionButton({
  className,
}: {
  className?: string;
}) {
  const [label, setLabel] = useState("Manage subscription in Google Play");
  const [native, setNative] = useState(false);
  useEffect(() => {
    setLabel(documentNativeMessages().billing.manage);
    setNative(isNativeAndroidApp());
  }, []);

  if (!native)
    return (
      <a
        className={className}
        href="https://play.google.com/store/account/subscriptions"
        target="_blank"
        rel="noopener noreferrer"
      >
        {label}
      </a>
    );
  return (
    <button
      type="button"
      className={className}
      onClick={() => void openPlaySubscriptionManagement()}
    >
      {label}
    </button>
  );
}
