import { z } from "zod";
import {
  isSameOrigin,
  PRIVATE_RESPONSE_HEADERS,
  readLimitedJson,
  RequestPayloadError,
} from "@/lib/api-security";
import { GooglePlayApiError } from "@/lib/google-play/api";
import { GoogleAuthError } from "@/lib/google-play/service-account";
import {
  currentSubscriptionFor,
  PlaySyncConflict,
} from "@/lib/google-play/store";
import {
  PlaySubscriptionMappingError,
  subscriptionGrantsAccess,
} from "@/lib/google-play/subscription";
import {
  PlayVerificationError,
  syncPlayPurchase,
} from "@/lib/google-play/sync";
import { membershipPlanFor } from "@/lib/membership/plans";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z
  .object({
    purchaseToken: z
      .string()
      .min(10)
      .max(4096)
      .regex(/^[A-Za-z0-9._:-]+$/),
  })
  .strict();

/** Error codes map to localized copy in lib/native/messages.ts. */
type VerifyErrorCode =
  | "origin_rejected"
  | "sign_in_required"
  | "invalid_request"
  | "stripe_subscription_active"
  | "already_subscribed"
  | "account_mismatch"
  | "purchase_not_found"
  | "unknown_product"
  | "unavailable";

const error = (code: VerifyErrorCode, status: number) =>
  Response.json({ error: code }, { status, headers: PRIVATE_RESPONSE_HEADERS });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return error("origin_rejected", 403);

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (authError || typeof userId !== "string")
    return error("sign_in_required", 401);

  let body: unknown;
  try {
    body = await readLimitedJson(request, 8_192);
  } catch (cause) {
    if (cause instanceof RequestPayloadError)
      return error(
        "invalid_request",
        cause.code === "REQUEST_TOO_LARGE" ? 413 : 400,
      );
    throw cause;
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error("invalid_request", 422);

  try {
    // Web (Stripe) members manage Atlas on the website; Play cannot add a
    // second current subscription.
    const current = await currentSubscriptionFor(userId);
    if (current && current.provider !== "google_play")
      return error("stripe_subscription_active", 409);

    const { saved } = await syncPlayPurchase({
      userId,
      purchaseToken: parsed.data.purchaseToken,
      requireAccountMatch: true,
    });
    return Response.json(
      {
        plan: membershipPlanFor(
          subscriptionGrantsAccess(saved) ? saved.plan_key : null,
        ),
        status: saved.status,
        currentPeriodEnd: saved.current_period_end,
      },
      { headers: PRIVATE_RESPONSE_HEADERS },
    );
  } catch (cause) {
    if (cause instanceof PlaySyncConflict) {
      if (cause.code === "STRIPE_SUBSCRIPTION_ACTIVE")
        return error("stripe_subscription_active", 409);
      if (cause.code === "ALREADY_SUBSCRIBED")
        return error("already_subscribed", 409);
      return error("account_mismatch", 403);
    }
    if (cause instanceof PlayVerificationError)
      return cause.code === "ACCOUNT_MISMATCH"
        ? error("account_mismatch", 403)
        : error("unknown_product", 422);
    if (cause instanceof PlaySubscriptionMappingError)
      return error("unknown_product", 422);
    if (
      cause instanceof GooglePlayApiError &&
      cause.code === "PURCHASE_NOT_FOUND"
    )
      return error("purchase_not_found", 404);
    console.error(
      JSON.stringify({
        level: "error",
        message: "Google Play verification failed",
        code:
          cause instanceof GooglePlayApiError ||
          cause instanceof GoogleAuthError
            ? cause.code
            : cause instanceof Error
              ? cause.message.slice(0, 80)
              : "UNKNOWN",
      }),
    );
    return error("unavailable", 503);
  }
}
