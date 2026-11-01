/**
 * Google Play `purchases.subscriptionsv2` → `account_subscriptions` mapping.
 * Pure functions; no I/O. See
 * https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2
 */

export type PlaySubscriptionState =
  | "SUBSCRIPTION_STATE_UNSPECIFIED"
  | "SUBSCRIPTION_STATE_PENDING"
  | "SUBSCRIPTION_STATE_ACTIVE"
  | "SUBSCRIPTION_STATE_PAUSED"
  | "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"
  | "SUBSCRIPTION_STATE_ON_HOLD"
  | "SUBSCRIPTION_STATE_CANCELED"
  | "SUBSCRIPTION_STATE_EXPIRED"
  | "SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED";

export type PlaySubscriptionLineItem = {
  productId?: string;
  expiryTime?: string;
  latestSuccessfulOrderId?: string;
  autoRenewingPlan?: { autoRenewEnabled?: boolean } | null;
  offerDetails?: {
    basePlanId?: string;
    offerId?: string;
    offerTags?: string[];
  } | null;
  /** Present on current API versions; `freeTrial` is set during a trial. */
  offerPhase?: {
    freeTrial?: object;
    introductoryPrice?: object;
    basePrice?: object;
    prorationPeriod?: object;
  } | null;
};

export type PlaySubscriptionPurchaseV2 = {
  kind?: string;
  regionCode?: string;
  startTime?: string;
  subscriptionState?: PlaySubscriptionState;
  latestOrderId?: string;
  linkedPurchaseToken?: string;
  acknowledgementState?:
    | "ACKNOWLEDGEMENT_STATE_UNSPECIFIED"
    | "ACKNOWLEDGEMENT_STATE_PENDING"
    | "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED";
  externalAccountIdentifiers?: {
    obfuscatedExternalAccountId?: string;
    obfuscatedExternalProfileId?: string;
  } | null;
  testPurchase?: object | null;
  lineItems?: PlaySubscriptionLineItem[];
};

export type AccountSubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

/** Statuses covered by the one-current-subscription-per-user index. */
export const CURRENT_SUBSCRIPTION_STATUSES: readonly AccountSubscriptionStatus[] =
  ["incomplete", "trialing", "active", "past_due", "paused"];

export type MappedPlaySubscription = {
  status: AccountSubscriptionStatus;
  productId: string;
  basePlanId: string | null;
  orderId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  graceEndsAt: string | null;
  inFreeTrial: boolean;
  needsAcknowledgement: boolean;
};

export class PlaySubscriptionMappingError extends Error {
  constructor(
    public readonly code: "NO_LINE_ITEM" | "UNKNOWN_STATE" | "NO_PRODUCT",
  ) {
    super(code);
  }
}

/** Picks the line item that expires last (subscriptions have one today). */
export function primaryLineItem(
  purchase: PlaySubscriptionPurchaseV2,
): PlaySubscriptionLineItem | undefined {
  const items = purchase.lineItems ?? [];
  return [...items].sort(
    (a, b) =>
      Date.parse(b.expiryTime ?? "") - Date.parse(a.expiryTime ?? "") || 0,
  )[0];
}

function isFreeTrial(item: PlaySubscriptionLineItem) {
  return !!item.offerPhase?.freeTrial;
}

function validIso(value: string | undefined) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

export function mapPlaySubscription(
  purchase: PlaySubscriptionPurchaseV2,
  now = new Date(),
): MappedPlaySubscription {
  const item = primaryLineItem(purchase);
  if (!item) throw new PlaySubscriptionMappingError("NO_LINE_ITEM");
  if (!item.productId) throw new PlaySubscriptionMappingError("NO_PRODUCT");
  const expiry = validIso(item.expiryTime);
  const expired = !expiry || Date.parse(expiry) <= now.getTime();
  const trial = isFreeTrial(item);
  const autoRenewOff = item.autoRenewingPlan?.autoRenewEnabled === false;

  let status: AccountSubscriptionStatus;
  let cancelAtPeriodEnd = autoRenewOff;
  let graceEndsAt: string | null = null;
  switch (purchase.subscriptionState) {
    case "SUBSCRIPTION_STATE_ACTIVE":
      status = trial ? "trialing" : "active";
      break;
    case "SUBSCRIPTION_STATE_IN_GRACE_PERIOD":
      // Play extends expiryTime to the end of the grace period.
      status = "past_due";
      graceEndsAt = expiry;
      break;
    case "SUBSCRIPTION_STATE_ON_HOLD":
      status = "past_due";
      break;
    case "SUBSCRIPTION_STATE_PAUSED":
      status = "paused";
      break;
    case "SUBSCRIPTION_STATE_CANCELED":
      // Still entitled until expiry; it will not renew.
      cancelAtPeriodEnd = true;
      status = expired ? "canceled" : trial ? "trialing" : "active";
      break;
    case "SUBSCRIPTION_STATE_EXPIRED":
      status = "canceled";
      break;
    case "SUBSCRIPTION_STATE_PENDING":
      status = "incomplete";
      break;
    case "SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED":
      status = "incomplete_expired";
      break;
    default:
      throw new PlaySubscriptionMappingError("UNKNOWN_STATE");
  }

  const acknowledgeable =
    purchase.subscriptionState === "SUBSCRIPTION_STATE_ACTIVE" ||
    purchase.subscriptionState === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ||
    purchase.subscriptionState === "SUBSCRIPTION_STATE_CANCELED";

  return {
    status,
    productId: item.productId,
    basePlanId: item.offerDetails?.basePlanId ?? null,
    orderId: item.latestSuccessfulOrderId ?? purchase.latestOrderId ?? null,
    currentPeriodEnd: expiry,
    cancelAtPeriodEnd,
    graceEndsAt,
    inFreeTrial: trial,
    needsAcknowledgement:
      acknowledgeable &&
      !expired &&
      purchase.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING",
  };
}

/**
 * Best-effort start of the current period, derived from the expiry and the
 * plan interval (Play's v2 resource has no per-period start time).
 */
export function currentPeriodStart(
  mapped: Pick<MappedPlaySubscription, "currentPeriodEnd" | "inFreeTrial">,
  interval: "month" | "year",
  trialDays: number,
): string | null {
  if (!mapped.currentPeriodEnd) return null;
  const end = new Date(mapped.currentPeriodEnd);
  const start = new Date(end);
  if (mapped.inFreeTrial) start.setUTCDate(start.getUTCDate() - trialDays);
  else if (interval === "year")
    start.setUTCFullYear(start.getUTCFullYear() - 1);
  else start.setUTCMonth(start.getUTCMonth() - 1);
  return start.toISOString();
}

/** Mirrors lib/entitlements/domain.ts: does this row grant its plan now? */
export function subscriptionGrantsAccess(
  row: {
    status: AccountSubscriptionStatus;
    current_period_end: string | null;
    grace_ends_at: string | null;
  },
  now = new Date(),
) {
  if (
    row.current_period_end &&
    Date.parse(row.current_period_end) <= now.getTime()
  )
    return false;
  if (row.status === "active" || row.status === "trialing") return true;
  return (
    row.status === "past_due" &&
    !!row.grace_ends_at &&
    Date.parse(row.grace_ends_at) > now.getTime()
  );
}
