import "server-only";
import { getGoogleAccessToken, parseServiceAccount } from "./service-account";
import { ANDROID_PUBLISHER_SCOPE, googlePlayPackageName } from "./config";
import type { PlaySubscriptionPurchaseV2 } from "./subscription";

const API = "https://androidpublisher.googleapis.com/androidpublisher/v3";

export class GooglePlayApiError extends Error {
  constructor(
    public readonly code:
      "PURCHASE_NOT_FOUND" | "PLAY_API_UNAVAILABLE" | "PLAY_API_REJECTED",
    public readonly httpStatus?: number,
  ) {
    super(code);
  }
}

async function accessToken() {
  return getGoogleAccessToken(
    parseServiceAccount(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON),
    ANDROID_PUBLISHER_SCOPE,
  );
}

function failure(status: number) {
  if (status === 404 || status === 410)
    return new GooglePlayApiError("PURCHASE_NOT_FOUND", status);
  if (status === 400 || status === 401 || status === 403)
    return new GooglePlayApiError("PLAY_API_REJECTED", status);
  return new GooglePlayApiError("PLAY_API_UNAVAILABLE", status);
}

/** purchases.subscriptionsv2.get */
export async function getSubscriptionPurchase(
  purchaseToken: string,
): Promise<PlaySubscriptionPurchaseV2> {
  const token = await accessToken();
  const url = `${API}/applications/${encodeURIComponent(
    googlePlayPackageName(),
  )}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw failure(response.status);
  return (await response.json()) as PlaySubscriptionPurchaseV2;
}

/** purchases.subscriptions.acknowledge (v2 has no acknowledge method). */
export async function acknowledgeSubscriptionPurchase(
  productId: string,
  purchaseToken: string,
): Promise<void> {
  const token = await accessToken();
  const url = `${API}/applications/${encodeURIComponent(
    googlePlayPackageName(),
  )}/purchases/subscriptions/${encodeURIComponent(
    productId,
  )}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
    cache: "no-store",
  });
  // 400 "already acknowledged" is fine to ignore.
  if (!response.ok && response.status !== 400) throw failure(response.status);
}
