import { PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";
import { obfuscatedAccountIdFor } from "@/lib/google-play/account-id";
import { loadPlayCatalog } from "@/lib/google-play/store";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

/**
 * Google Play product and base-plan ids for Atlas (public catalogue facts),
 * plus the signed-in user's obfuscated Play account id when there is a
 * session. Private/no-store because of the latter.
 */
export async function GET() {
  let products;
  try {
    products = await loadPlayCatalog();
  } catch {
    return json({ error: "The Google Play catalogue is unavailable." }, 503);
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;

  return json({
    products: products.map((price) => ({
      interval: price.billing_interval,
      productId: price.google_play_product_id,
      basePlanId: price.google_play_base_plan_id,
      trialDays: price.trial_days ?? 0,
    })),
    obfuscatedAccountId:
      typeof userId === "string" ? obfuscatedAccountIdFor(userId) : null,
  });
}
