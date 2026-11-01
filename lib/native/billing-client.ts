"use client";

import type { BillingInterval } from "@/lib/membership/plans";
import { isNativePluginAvailable } from "./platform";

/**
 * Google Play Billing for Atlas inside the Android app, via
 * @capgo/native-purchases (lazy-loaded). The server verifies every purchase
 * token with the Play Developer API before granting Atlas; the client never
 * decides entitlement.
 */

export type PlayCatalog = {
  products: {
    interval: BillingInterval;
    productId: string;
    basePlanId: string;
    trialDays: number;
  }[];
  obfuscatedAccountId: string | null;
};

export type VerifyErrorCode =
  | "sign_in_required"
  | "stripe_subscription_active"
  | "already_subscribed"
  | "account_mismatch"
  | "purchase_not_found"
  | "unknown_product"
  | "unavailable"
  | "invalid_request"
  | "origin_rejected"
  | "generic";

export type BillingOutcome =
  | { kind: "success"; plan: "atlas" | "free" }
  | { kind: "cancelled" }
  | { kind: "pending" }
  | { kind: "billing_unavailable" }
  | { kind: "nothing_to_restore" }
  | { kind: "error"; code: VerifyErrorCode };

const KNOWN_ERRORS = new Set<VerifyErrorCode>([
  "sign_in_required",
  "stripe_subscription_active",
  "already_subscribed",
  "account_mismatch",
  "purchase_not_found",
  "unknown_product",
  "unavailable",
  "invalid_request",
  "origin_rejected",
]);

async function plugin() {
  if (!isNativePluginAvailable("NativePurchases")) return null;
  return import("@capgo/native-purchases");
}

export async function fetchPlayCatalog(): Promise<PlayCatalog> {
  const response = await fetch("/api/google-play/catalog", {
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("CATALOG_UNAVAILABLE");
  return (await response.json()) as PlayCatalog;
}

export async function verifyPurchaseToken(
  purchaseToken: string,
): Promise<BillingOutcome> {
  let response: Response;
  try {
    response = await fetch("/api/google-play/verify", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseToken }),
    });
  } catch {
    return { kind: "error", code: "unavailable" };
  }
  const body = (await response.json().catch(() => ({}))) as {
    plan?: "atlas" | "free";
    error?: string;
  };
  if (response.ok) return { kind: "success", plan: body.plan ?? "free" };
  const code = KNOWN_ERRORS.has(body.error as VerifyErrorCode)
    ? (body.error as VerifyErrorCode)
    : "generic";
  return { kind: "error", code };
}

function errorText(error: unknown) {
  const value = error as { code?: unknown; message?: unknown } | null;
  return `${String(value?.code ?? "")} ${String(value?.message ?? "")}`;
}

/** Starts the Play purchase sheet for Atlas and verifies the result. */
export async function purchaseAtlas(
  interval: BillingInterval,
): Promise<BillingOutcome> {
  const native = await plugin();
  if (!native) return { kind: "billing_unavailable" };
  const { NativePurchases, PURCHASE_TYPE } = native;
  try {
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    if (!isBillingSupported) return { kind: "billing_unavailable" };
  } catch {
    return { kind: "billing_unavailable" };
  }

  let catalog: PlayCatalog;
  try {
    catalog = await fetchPlayCatalog();
  } catch {
    return { kind: "error", code: "unavailable" };
  }
  if (!catalog.obfuscatedAccountId)
    return { kind: "error", code: "sign_in_required" };
  const price = catalog.products.find((item) => item.interval === interval);
  if (!price) return { kind: "error", code: "unknown_product" };

  // Prefer the free-trial offer when Play lists one for this base plan.
  let offerToken: string | undefined;
  try {
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: [price.productId],
      productType: PURCHASE_TYPE.SUBS,
    });
    const offers = products.filter(
      (product) => product.identifier === price.basePlanId,
    );
    if (!offers.length) return { kind: "error", code: "unknown_product" };
    offerToken = (offers.find((offer) => offer.offerId) ?? offers[0])
      .offerToken;
  } catch {
    return { kind: "billing_unavailable" };
  }

  let purchaseToken: string | undefined;
  try {
    const transaction = await NativePurchases.purchaseProduct({
      productIdentifier: price.productId,
      planIdentifier: price.basePlanId,
      offerToken,
      productType: PURCHASE_TYPE.SUBS,
      appAccountToken: catalog.obfuscatedAccountId,
      // The server acknowledges after it has stored the entitlement.
      autoAcknowledgePurchases: false,
    });
    purchaseToken = transaction.purchaseToken;
  } catch (error) {
    const text = errorText(error);
    if (/USER_CANCELED|cancel/i.test(text)) return { kind: "cancelled" };
    if (/pending/i.test(text)) return { kind: "pending" };
    if (/ITEM_ALREADY_OWNED/.test(text)) return restorePlayPurchases();
    if (/BILLING_UNAVAILABLE|SERVICE_/.test(text))
      return { kind: "billing_unavailable" };
    return { kind: "error", code: "generic" };
  }
  if (!purchaseToken) return { kind: "error", code: "purchase_not_found" };
  return verifyPurchaseToken(purchaseToken);
}

/**
 * Sends this Google account's Play subscriptions to the server again
 * ("Restore purchases"). The server ignores purchases made for another
 * Celestial Atlas account.
 */
export async function restorePlayPurchases(): Promise<BillingOutcome> {
  const native = await plugin();
  if (!native) return { kind: "billing_unavailable" };
  const { NativePurchases, PURCHASE_TYPE } = native;
  let tokens: string[];
  try {
    const { purchases } = await NativePurchases.getPurchases({
      productType: PURCHASE_TYPE.SUBS,
    });
    tokens = Array.from(
      new Set(
        purchases
          .map((purchase) => purchase.purchaseToken)
          .filter((token): token is string => !!token),
      ),
    );
  } catch {
    return { kind: "billing_unavailable" };
  }
  if (!tokens.length) return { kind: "nothing_to_restore" };
  let last: BillingOutcome = { kind: "nothing_to_restore" };
  for (const token of tokens) {
    last = await verifyPurchaseToken(token);
    if (last.kind === "success" && last.plan === "atlas") return last;
  }
  return last;
}

/**
 * On app launch (signed in): verifies purchases Play reports as not yet
 * acknowledged, e.g. when the app closed before verification finished.
 * Play refunds subscriptions left unacknowledged for three days.
 */
export async function reconcileUnacknowledgedPurchases() {
  const native = await plugin();
  if (!native) return;
  const { NativePurchases, PURCHASE_TYPE } = native;
  try {
    const { purchases } = await NativePurchases.getPurchases({
      productType: PURCHASE_TYPE.SUBS,
    });
    for (const purchase of purchases)
      if (purchase.purchaseToken && purchase.isAcknowledged === false)
        await verifyPurchaseToken(purchase.purchaseToken);
  } catch {
    // Retried on the next launch; RTDN also covers known tokens.
  }
}

export async function openPlaySubscriptionManagement() {
  const native = await plugin();
  if (native) {
    try {
      await native.NativePurchases.manageSubscriptions();
      return;
    } catch {
      // Fall through to the browser.
    }
  }
  const { Browser } = await import("@capacitor/browser");
  await Browser.open({
    url: "https://play.google.com/store/account/subscriptions",
  });
}
