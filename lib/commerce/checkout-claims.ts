import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export const PENDING_CLAIM_LIFETIME_SECONDS = 60 * 60;
export const SIGNIN_CLAIM_LIFETIME_SECONDS = 60 * 60;

export function randomClaimToken() {
  return randomBytes(32).toString("base64url");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function requestFingerprint(request: Request) {
  const secret =
    process.env.PENDING_CLAIM_HMAC_SECRET ?? process.env.CRON_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Pending-claim fingerprinting is not configured.");
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const agent = request.headers.get("user-agent")?.slice(0, 256) ?? "unknown";
  return createHmac("sha256", secret).update(`${ip}\n${agent}`).digest("hex");
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}

export function sameCalculatedChart(left: unknown, right: unknown) {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

export async function customerEmailForSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription,
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || !customer.email?.trim())
    throw new Error("subscription_customer_email_missing");
  return {
    customerId,
    email: customer.email.trim().toLowerCase(),
    displayName: customer.name?.trim() || undefined,
  };
}

export async function passwordlessUserForEmail(
  admin: SupabaseClient<Database>,
  email: string,
  displayName?: string,
) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: displayName ? { data: { display_name: displayName } } : undefined,
  });
  if (error || !data.user?.id) throw error ?? new Error("user_not_provisioned");
  return data.user.id;
}
