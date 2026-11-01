import type Stripe from "stripe";
import { checkoutPaymentMethodConfiguration } from "@/lib/stripe";

export type SubscriptionCheckoutPrice = {
  stripePriceId: string;
  trialDays: number;
};

type SubscriptionCheckoutInput = {
  price: SubscriptionCheckoutPrice;
  /** Only accounts with no earlier subscription or trial get the trial. */
  trialEligible: boolean;
  metadata: Record<string, string>;
  automaticTax: boolean;
  successUrl: string;
  cancelUrl: string;
} & (
  | { customer: string; customerEmail?: never; expiresAt?: never }
  | { customer?: never; customerEmail: string; expiresAt: number }
);

/**
 * Builds the Stripe Checkout parameters for an Atlas subscription.
 *
 * Never sets `payment_method_types`: Stripe then offers every method enabled
 * in the Dashboard (Google Pay included) or in the optional
 * STRIPE_PAYMENT_METHOD_CONFIGURATION.
 */
export function subscriptionCheckoutSessionParams(
  input: SubscriptionCheckoutInput,
): Stripe.Checkout.SessionCreateParams {
  const trialDays =
    input.trialEligible && input.price.trialDays > 0
      ? input.price.trialDays
      : 0;
  const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData =
    { metadata: input.metadata };
  if (trialDays) {
    subscriptionData.trial_period_days = trialDays;
    // A trial must never roll into an unpaid subscription.
    subscriptionData.trial_settings = {
      end_behavior: { missing_payment_method: "cancel" },
    };
  }
  return {
    mode: "subscription",
    line_items: [{ price: input.price.stripePriceId, quantity: 1 }],
    ...(input.customer
      ? { customer: input.customer }
      : {
          customer_email: input.customerEmail,
          expires_at: input.expiresAt,
          // A fully discounted subscription completes without card entry,
          // but a trial always collects a payment method for renewal.
          payment_method_collection: trialDays ? "always" : "if_required",
        }),
    allow_promotion_codes: true,
    metadata: input.metadata,
    subscription_data: subscriptionData,
    automatic_tax: { enabled: input.automaticTax },
    ...checkoutPaymentMethodConfiguration(),
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  };
}
