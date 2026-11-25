import { obfuscatedAccountIdFor } from "@/lib/google-play/account-id";
import { loadPlayCatalog } from "@/lib/google-play/store";
import { appJson, appPreflight, authenticateRequest } from "@/lib/request-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const OPTIONS = appPreflight;

/**
 * Google Play product and base-plan ids for Atlas (public catalogue facts),
 * plus the signed-in user's obfuscated Play account id when there is a
 * session. Private/no-store because of the latter.
 */
export async function GET(request: Request) {
  const json = (body: unknown, status = 200) => appJson(request, body, status);
  let products;
  try {
    products = await loadPlayCatalog();
  } catch {
    return json({ error: "The Google Play catalogue is unavailable." }, 503);
  }

  // Signed-out readers still get the catalogue; a session adds the account id.
  // A cross-origin request without a bearer token is treated as signed out.
  const auth = await authenticateRequest(request);
  const userId = auth.ok ? auth.user.userId : null;

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
