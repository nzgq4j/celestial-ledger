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

/**
 * Optional Stripe payment method configuration for Checkout.
 *
 * Checkout shows Google Pay (and Apple Pay, Link, etc.) automatically when the
 * method is enabled in Dashboard > Settings > Payment methods and the session
 * does not pin `payment_method_types`. Sessions must never pin it. Setting
 * STRIPE_PAYMENT_METHOD_CONFIGURATION=pmc_... points Checkout at a specific
 * configuration instead of the account default. See docs/commerce/google-pay.md.
 */
export function checkoutPaymentMethodConfiguration(): {
  payment_method_configuration?: string;
} {
  const value = process.env.STRIPE_PAYMENT_METHOD_CONFIGURATION?.trim();
  if (!value) return {};
  if (!/^pmc_[A-Za-z0-9]+$/.test(value))
    throw new Error("STRIPE_PAYMENT_METHOD_CONFIGURATION must be a pmc_ ID.");
  return { payment_method_configuration: value };
}
