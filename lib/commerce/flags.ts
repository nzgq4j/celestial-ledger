import "server-only";

function enabled(name: string) {
  return process.env[name]?.trim().toLowerCase() === "true";
}

export function commerceFlags() {
  return {
    checkout: enabled("COMMERCE_CHECKOUT_ENABLED"),
    webhookFulfilment: enabled("COMMERCE_WEBHOOK_FULFILMENT_ENABLED"),
    subscriptions: enabled("COMMERCE_SUBSCRIPTIONS_ENABLED"),
    automaticTax: enabled("COMMERCE_AUTOMATIC_TAX_ENABLED"),
  };
}
