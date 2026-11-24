// Atlas+ billing. The app talks only to BillingService; v1 ships StubBillingService.
//
// TODO(billing): wire Google Play Billing, for example with RevenueCat
// (@revenuecat/purchases-capacitor): create the "atlas_plus" entitlement with
// one yearly subscription (USD 6.99) that includes a 3-day free trial, implement
// BillingService with Purchases.getOfferings / purchasePackage / restorePurchases /
// getCustomerInfo, and swap it in below. Billing is the only feature allowed to
// use the network.
import { KEYS, load, save } from './storage';

export type PlanId = 'year';

/** Free trial length for Atlas+, in days. */
export const TRIAL_DAYS = 3;

export interface Plan {
  id: PlanId;
  label: string;
  note: string;
  price: string;
}

export interface BillingService {
  /** Plans with store-formatted prices. */
  plans(): Promise<Plan[]>;
  /** True when the user has an active Atlas+ entitlement (including a trial). */
  isEntitled(): Promise<boolean>;
  /** Start the store purchase flow. Resolves true when the entitlement is active. */
  purchase(plan: PlanId): Promise<boolean>;
  /** Restore earlier purchases from the store account. */
  restore(): Promise<boolean>;
  /** End the entitlement. With a real store this opens subscription management instead. */
  manage(): Promise<boolean>;
  /** True while purchases are simulated and no payment is taken. */
  readonly isDemo: boolean;
}

/** Atlas+ is a single yearly plan. The store's localised price replaces `price` once billing is wired. */
export const PLANS: Plan[] = [
  { id: 'year', label: 'Yearly', note: `${TRIAL_DAYS} days free, then billed annually`, price: '$6.99' },
];

/** Simulated billing: stores the entitlement on the device. No payment is taken. */
export class StubBillingService implements BillingService {
  readonly isDemo = true;
  async plans() { return PLANS; }
  async isEntitled() { return load<boolean>(KEYS.premium, false); }
  async purchase(_plan: PlanId) { await save(KEYS.premium, true); return true; }
  async restore() { return this.isEntitled(); }
  async manage() { await save(KEYS.premium, false); return false; }
}

export const billing: BillingService = new StubBillingService();
