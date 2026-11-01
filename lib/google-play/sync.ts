import "server-only";
import {
  acknowledgeSubscriptionPurchase,
  getSubscriptionPurchase,
} from "./api";
import { purchaseBelongsToUser } from "./account-id";
import {
  findPlayPrice,
  playDb,
  upsertPlaySubscription,
  type PlayDb,
} from "./store";
import { mapPlaySubscription } from "./subscription";
import { ATLAS_PLAN_KEY } from "@/lib/membership/plans";

export class PlayVerificationError extends Error {
  constructor(public readonly code: "ACCOUNT_MISMATCH" | "UNKNOWN_PRODUCT") {
    super(code);
  }
}

/**
 * Fetches a purchase from Google, checks it belongs to `userId`, upserts the
 * subscription row and acknowledges it. Shared by /api/google-play/verify and
 * the RTDN handler.
 */
export async function syncPlayPurchase(
  input: {
    userId: string;
    purchaseToken: string;
    requireAccountMatch: boolean;
  },
  db: PlayDb = playDb(),
) {
  const purchase = await getSubscriptionPurchase(input.purchaseToken);
  if (
    input.requireAccountMatch &&
    !purchaseBelongsToUser(
      purchase.externalAccountIdentifiers?.obfuscatedExternalAccountId,
      input.userId,
    )
  )
    throw new PlayVerificationError("ACCOUNT_MISMATCH");

  const mapped = mapPlaySubscription(purchase);
  const price = await findPlayPrice(mapped.productId, mapped.basePlanId, db);
  if (!price) throw new PlayVerificationError("UNKNOWN_PRODUCT");

  const saved = await upsertPlaySubscription(
    {
      userId: input.userId,
      purchaseToken: input.purchaseToken,
      linkedPurchaseToken: purchase.linkedPurchaseToken,
      mapped,
      price,
    },
    db,
  );
  // Acknowledge only after the entitlement is stored; Play refunds purchases
  // that stay unacknowledged for three days.
  if (mapped.needsAcknowledgement)
    await acknowledgeSubscriptionPurchase(
      mapped.productId,
      input.purchaseToken,
    );

  // One included report per membership year, from paid periods only (never
  // a free trial). Idempotent per order id; renewals get a new `..N` order id.
  if (
    saved.plan_key === ATLAS_PLAN_KEY &&
    saved.status === "active" &&
    !mapped.inFreeTrial &&
    mapped.orderId
  ) {
    const { error } = await db.rpc("grant_annual_report_credit", {
      p_user_id: input.userId,
      p_source_reference: `google_play:${mapped.orderId}`,
      p_granted_at: new Date().toISOString(),
    });
    if (error)
      console.error(
        JSON.stringify({
          level: "error",
          message: "Google Play included-report credit failed",
          code: error.code ?? "RPC_FAILED",
        }),
      );
  }
  return { saved, mapped };
}
