// Atlas+ billing. The app talks only to BillingService.
//
// Web: Stripe Checkout and the Stripe billing portal through the Celestial
// Atlas server; Atlas+ is attached to the signed-in account and read back from
// the atlas_membership RPC.
//
// Android: Google Play Billing is still to be connected. Implement
// BillingService with the Play Billing Library (or RevenueCat), send each
// purchase token to POST /api/google-play/verify (bearer auth, see api.ts),
// and return it from createBilling() for native platforms. Until then the
// native app uses StubBillingService, which takes no payment.
import { Capacitor } from '@capacitor/core';
import { postJson } from './api';
import { KEYS, load, save } from './storage';
import { accountsAvailable } from './supabase';

export type PlanId = 'year';

/** Free trial length for Atlas+, in days. */
export const TRIAL_DAYS = 3;

export interface Plan {
  id: PlanId;
  label: string;
  note: string;
  price: string;
}

/** 'redirect' means the page is leaving for the store's checkout or management page. */
export type BillingOutcome = 'active' | 'inactive' | 'redirect';

export interface BillingService {
  /** Plans with store-formatted prices. */
  plans(): Promise<Plan[]>;
  /** Device-held entitlement (demo only). Account-linked services report false and rely on the membership RPC. */
  isEntitled(): Promise<boolean>;
  /** Start the purchase flow. */
  purchase(plan: PlanId): Promise<BillingOutcome>;
  /** Restore earlier purchases from the store account. */
  restore(): Promise<BillingOutcome>;
  /** Open subscription management (or, in the demo, end the entitlement). */
  manage(): Promise<BillingOutcome>;
  /** True while purchases are simulated and no payment is taken. */
  readonly isDemo: boolean;
  /** True when purchases attach to the signed-in account, so sign-in comes first. */
  readonly needsAccount: boolean;
  /** True when the store offers a restore action. */
  readonly canRestore: boolean;
}

/** Atlas+ is a single yearly plan. The store's localised price replaces `price` once billing is wired. */
export const PLANS: Plan[] = [
  { id: 'year', label: 'Yearly', note: `${TRIAL_DAYS} days free, then billed annually`, price: '$6.99' },
];

/** Simulated billing: stores the entitlement on the device. No payment is taken. */
export class StubBillingService implements BillingService {
  readonly isDemo = true;
  readonly needsAccount = false;
  readonly canRestore = false;
  async plans() { return PLANS; }
  async isEntitled() { return load<boolean>(KEYS.premium, false); }
  async purchase(_plan: PlanId): Promise<BillingOutcome> { await save(KEYS.premium, true); return 'active'; }
  async restore(): Promise<BillingOutcome> { return (await this.isEntitled()) ? 'active' : 'inactive'; }
  async manage(): Promise<BillingOutcome> { await save(KEYS.premium, false); return 'inactive'; }
}

/** Stripe on the web: Checkout to subscribe, the billing portal to manage or cancel. */
export class StripeWebBillingService implements BillingService {
  readonly isDemo = false;
  readonly needsAccount = true;
  readonly canRestore = false;
  private readonly navigate: (url: string) => void;
  constructor(navigate: (url: string) => void = url => window.location.assign(url)) { this.navigate = navigate; }
  async plans() { return PLANS; }
  async isEntitled() { return false; }
  async purchase(plan: PlanId): Promise<BillingOutcome> {
    const { url } = await postJson<{ url: string }>('/api/app/checkout', { plan });
    this.navigate(url);
    return 'redirect';
  }
  async restore(): Promise<BillingOutcome> { return 'inactive'; }
  async manage(): Promise<BillingOutcome> {
    const { url } = await postJson<{ url: string }>('/api/app/portal', {});
    this.navigate(url);
    return 'redirect';
  }
}

export function createBilling(): BillingService {
  if (Capacitor.isNativePlatform()) return new StubBillingService(); // Google Play Billing connects here.
  return accountsAvailable() ? new StripeWebBillingService() : new StubBillingService();
}

export const billing: BillingService = createBilling();
