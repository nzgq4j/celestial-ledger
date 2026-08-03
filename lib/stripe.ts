import Stripe from "stripe";

let client: Stripe | undefined;

export function stripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");
  client ??= new Stripe(secretKey, { typescript: true, maxNetworkRetries: 2 });
  return client;
}

export function stripeWebhookSecret() {
  const value = process.env.STRIPE_WEBHOOK_SECRET;
  if (!value) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  return value;
}
