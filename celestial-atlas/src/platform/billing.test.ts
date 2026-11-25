import { beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.hoisted(() => vi.fn());
vi.mock('./api', () => ({ postJson: post }));

const { PLANS, TRIAL_DAYS, StripeWebBillingService, StubBillingService } = await import('./billing');

describe('Atlas+ pricing', () => {
  it('is a single yearly plan at USD 6.99 with a 3-day free trial', () => {
    expect(PLANS).toEqual([{ id: 'year', label: 'Yearly', note: '3 days free, then billed annually', price: '$6.99' }]);
    expect(TRIAL_DAYS).toBe(3);
  });
});

describe('Stripe web billing', () => {
  beforeEach(() => post.mockReset());

  it('requires an account and opens Checkout for the yearly plan', async () => {
    const nav = vi.fn();
    const svc = new StripeWebBillingService(nav);
    expect(svc.needsAccount).toBe(true);
    expect(svc.isDemo).toBe(false);
    post.mockResolvedValue({ url: 'https://checkout.stripe.test/s' });
    expect(await svc.purchase('year')).toBe('redirect');
    expect(post).toHaveBeenCalledWith('/api/app/checkout', { plan: 'year' });
    expect(nav).toHaveBeenCalledWith('https://checkout.stripe.test/s');
  });

  it('opens the management page the server chooses', async () => {
    const nav = vi.fn();
    post.mockResolvedValue({ url: 'https://play.google.com/store/account/subscriptions', provider: 'google_play' });
    expect(await new StripeWebBillingService(nav).manage()).toBe('redirect');
    expect(post).toHaveBeenCalledWith('/api/app/portal', {});
    expect(nav).toHaveBeenCalledWith('https://play.google.com/store/account/subscriptions');
  });

  it('does not navigate when the server refuses', async () => {
    const nav = vi.fn();
    post.mockImplementation(async () => { throw new Error('Atlas+ is not available yet.'); });
    const outcome = await new StripeWebBillingService(nav).purchase('year').then(() => 'resolved', (e: unknown) => (e as Error).message);
    expect(outcome).toBe('Atlas+ is not available yet.');
    expect(nav).not.toHaveBeenCalled();
    post.mockReset(); // drop the recorded rejected promise
  });
});

describe('demo billing', () => {
  it('takes no payment and needs no account', () => {
    const svc = new StubBillingService();
    expect(svc.isDemo).toBe(true);
    expect(svc.needsAccount).toBe(false);
  });
});
