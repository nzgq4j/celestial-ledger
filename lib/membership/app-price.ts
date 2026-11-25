/**
 * The Atlas+ price the app sells: one yearly plan at USD 6.99 with a 3-day
 * trial. App checkout refuses any other active price so an older catalogue
 * price can never be charged through the app.
 */
export const ATLAS_APP_PRICE = {
  interval: "year",
  unitAmount: 699,
  currency: "usd",
  trialDays: 3,
} as const;

export function isAtlasAppPrice(price: {
  interval: string;
  unitAmount: number;
  currency: string;
  trialDays: number;
}): boolean {
  return (
    price.interval === ATLAS_APP_PRICE.interval &&
    price.unitAmount === ATLAS_APP_PRICE.unitAmount &&
    price.currency.toLowerCase() === ATLAS_APP_PRICE.currency &&
    price.trialDays === ATLAS_APP_PRICE.trialDays
  );
}
