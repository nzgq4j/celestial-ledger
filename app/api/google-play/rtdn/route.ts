import { PRIVATE_RESPONSE_HEADERS, readLimitedJson } from "@/lib/api-security";
import { GooglePlayApiError } from "@/lib/google-play/api";
import { googlePlayPackageName } from "@/lib/google-play/config";
import {
  PubSubAuthError,
  verifyPubSubOidcToken,
} from "@/lib/google-play/pubsub-auth";
import {
  decodeDeveloperNotification,
  pubSubPushSchema,
  subscriptionTokenFrom,
} from "@/lib/google-play/rtdn";
import {
  PlaySyncConflict,
  subscriptionByPurchaseToken,
} from "@/lib/google-play/store";
import {
  PlayVerificationError,
  syncPlayPurchase,
} from "@/lib/google-play/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

function log(message: string, code?: string) {
  console.log(
    JSON.stringify({ level: "info", message, ...(code ? { code } : {}) }),
  );
}

/**
 * Google Play Real-time Developer Notifications (Cloud Pub/Sub push).
 * Authenticated with the Pub/Sub OIDC token. The notification is only a hint:
 * the handler re-fetches the subscription from Google and re-upserts it.
 * 2xx acknowledges the message; 5xx makes Pub/Sub retry.
 */
export async function POST(request: Request) {
  try {
    await verifyPubSubOidcToken(request.headers.get("authorization"), {
      audience: process.env.GOOGLE_PLAY_RTDN_AUDIENCE,
      serviceAccountEmail: process.env.GOOGLE_PLAY_RTDN_SERVICE_ACCOUNT,
    });
  } catch (cause) {
    const code = cause instanceof PubSubAuthError ? cause.code : "AUTH_FAILED";
    log("Google Play RTDN rejected", code);
    return json(
      { error: "Unauthorized." },
      code === "NOT_CONFIGURED" ? 503 : 401,
    );
  }

  let envelope;
  try {
    envelope = pubSubPushSchema.safeParse(
      await readLimitedJson(request, 32_768),
    );
  } catch {
    return json({ ignored: "invalid_json" });
  }
  // Malformed messages are acknowledged so they are not redelivered forever.
  if (!envelope.success) return json({ ignored: "invalid_envelope" });
  const notification = decodeDeveloperNotification(envelope.data.message.data);
  if (!notification) return json({ ignored: "invalid_notification" });
  if (notification.packageName !== googlePlayPackageName())
    return json({ ignored: "other_package" });
  if (notification.testNotification) {
    log("Google Play RTDN test notification received");
    return json({ ok: true, test: true });
  }
  const purchaseToken = subscriptionTokenFrom(notification);
  if (!purchaseToken) return json({ ignored: "not_a_subscription" });

  try {
    const existing = await subscriptionByPurchaseToken(purchaseToken);
    // Unknown token: the app has not verified it yet. The app verifies
    // unacknowledged purchases on launch, so nothing is lost.
    if (!existing?.user_id) return json({ ignored: "unknown_token" });
    const { saved } = await syncPlayPurchase({
      userId: existing.user_id,
      purchaseToken,
      requireAccountMatch: true,
    });
    log("Google Play subscription synced", saved.status);
    return json({ ok: true });
  } catch (cause) {
    if (
      cause instanceof PlaySyncConflict ||
      cause instanceof PlayVerificationError ||
      (cause instanceof GooglePlayApiError &&
        cause.code === "PURCHASE_NOT_FOUND")
    ) {
      log("Google Play RTDN not applied", cause.code);
      return json({ ignored: cause.code });
    }
    console.error(
      JSON.stringify({
        level: "error",
        message: "Google Play RTDN processing failed",
        code:
          cause instanceof GooglePlayApiError
            ? cause.code
            : cause instanceof Error
              ? cause.message.slice(0, 80)
              : "UNKNOWN",
      }),
    );
    return json({ error: "Retry later." }, 500);
  }
}
