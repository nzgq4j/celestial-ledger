import { beforeEach, describe, expect, it, vi } from "vitest";

const now = () => Math.floor(Date.now() / 1000);
const mocks = vi.hoisted(() => ({
  bearerClaims: null as Record<string, unknown> | null,
  cookieClaims: null as Record<string, unknown> | null,
  tables: {} as Record<string, unknown>,
  price: null as Record<string, unknown> | null,
  deleteUser: vi.fn(async () => ({ error: null as { code?: string } | null })),
  checkoutCreate: vi.fn(async () => ({ url: "https://checkout.stripe.test/s" })),
  portalCreate: vi.fn(async () => ({ url: "https://billing.stripe.test/p" })),
  customerUpdate: vi.fn(async () => ({})),
}));

vi.mock("@supabase/supabase-js", async (original) => ({
  ...(await original<typeof import("@supabase/supabase-js")>()),
  createClient: () => ({
    auth: {
      getClaims: async (token: string) =>
        token === "valid-token-0123456789abcdef" && mocks.bearerClaims
          ? { data: { claims: mocks.bearerClaims }, error: null }
          : { data: null, error: new Error("invalid JWT") },
    },
  }),
}));
vi.mock("@/lib/supabase/config", async (original) => ({
  ...(await original<typeof import("@/lib/supabase/config")>()),
  supabasePublicConfig: () => ({ url: "https://db.test", publishableKey: "pk" }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getClaims: async () => ({
        data: mocks.cookieClaims ? { claims: mocks.cookieClaims } : null,
        error: null,
      }),
    },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        in: () => chain,
        maybeSingle: async () => ({ data: mocks.tables[table] ?? null, error: null }),
      };
      return chain;
    },
    auth: { admin: { deleteUser: mocks.deleteUser } },
  }),
}));
vi.mock("@/lib/commerce/flags", () => ({
  commerceFlags: () => ({ checkout: true, subscriptions: true, automaticTax: false }),
}));
vi.mock("@/lib/stripe", () => ({
  checkoutPaymentMethodConfiguration: () => ({}),
  stripeClient: () => ({
    customers: { update: mocks.customerUpdate },
    checkout: { sessions: { create: mocks.checkoutCreate } },
    billingPortal: { sessions: { create: mocks.portalCreate } },
  }),
}));
vi.mock("@/lib/stripe/catalog", () => ({ activeAtlasPrice: async () => mocks.price }));
vi.mock("@/lib/stripe/trial", () => ({ atlasTrialEligible: async () => true }));

const { authenticateRequest, appPreflight } = await import("@/lib/request-auth");
const { POST: checkout } = await import("@/app/api/app/checkout/route");
const { POST: portal } = await import("@/app/api/app/portal/route");
const { POST: deleteAccount } = await import("@/app/api/account/delete/route");

const SITE = "https://www.celestialatlas.app";
function req(
  path: string,
  body: unknown,
  { bearer = true, origin = "https://localhost" }: { bearer?: boolean; origin?: string | null } = {},
) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (bearer) headers.authorization = "Bearer valid-token-0123456789abcdef";
  if (origin) headers.origin = origin;
  return new Request(`${SITE}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
}
const appPrice = {
  planKey: "premium", interval: "year", stripePriceId: "price_app", unitAmount: 699, currency: "usd", trialDays: 3,
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", SITE);
  mocks.bearerClaims = {
    sub: "10000000-0000-4000-8000-000000000001",
    email: "reader@example.test",
    amr: [{ method: "otp", timestamp: now() - 60 }],
  };
  mocks.cookieClaims = null;
  mocks.tables = { billing_customers: { id: "b1", stripe_customer_id: "cus_1" } };
  mocks.price = appPrice;
  mocks.deleteUser.mockClear();
  mocks.deleteUser.mockResolvedValue({ error: null });
  mocks.checkoutCreate.mockClear();
});

describe("request authentication", () => {
  it("accepts a valid bearer token from the app's origin", async () => {
    const auth = await authenticateRequest(req("/x", {}));
    expect(auth).toMatchObject({ ok: true, user: { via: "bearer", email: "reader@example.test" } });
    if (auth.ok) expect(auth.user.authTime).toBeGreaterThan(now() - 120);
  });
  it("rejects an invalid bearer token", async () => {
    mocks.bearerClaims = null;
    expect(await authenticateRequest(req("/x", {}))).toMatchObject({ ok: false, status: 401 });
  });
  it("rejects cookie sessions from another origin", async () => {
    mocks.cookieClaims = { sub: "u" };
    expect(await authenticateRequest(req("/x", {}, { bearer: false, origin: "https://evil.example" })))
      .toMatchObject({ ok: false, status: 403, code: "origin_rejected" });
    expect(await authenticateRequest(req("/x", {}, { bearer: false, origin: SITE })))
      .toMatchObject({ ok: true, user: { via: "cookie" } });
  });
  it("grants CORS only to the app's native origins", () => {
    const allowed = appPreflight(new Request(`${SITE}/x`, { method: "OPTIONS", headers: { origin: "https://localhost" } }));
    expect(allowed.headers.get("access-control-allow-origin")).toBe("https://localhost");
    expect(allowed.headers.get("access-control-allow-credentials")).toBeNull();
    const other = appPreflight(new Request(`${SITE}/x`, { method: "OPTIONS", headers: { origin: "https://evil.example" } }));
    expect(other.headers.get("access-control-allow-origin")).toBeNull();
    expect(other.headers.get("cache-control")).toContain("no-store");
  });
});

describe("POST /api/app/checkout", () => {
  it("opens Checkout for the USD 6.99 yearly price", async () => {
    const res = await checkout(req("/api/app/checkout", { plan: "year" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://checkout.stripe.test/s" });
    expect(res.headers.get("access-control-allow-origin")).toBe("https://localhost");
    const params = (mocks.checkoutCreate.mock.calls[0] as unknown as [Record<string, unknown>])[0];
    expect(params).toMatchObject({ customer: "cus_1", success_url: `${SITE}/profile?checkout=complete` });
  });
  it("refuses to sell any other active price", async () => {
    mocks.price = { ...appPrice, unitAmount: 9900, trialDays: 7 };
    const res = await checkout(req("/api/app/checkout", { plan: "year" }));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: "PRICE_NOT_READY" });
    expect(mocks.checkoutCreate).not.toHaveBeenCalled();
  });
  it("refuses a second subscription and signed-out requests", async () => {
    mocks.tables.account_subscriptions = { provider: "google_play" };
    expect(await (await checkout(req("/api/app/checkout", { plan: "year" }))).json())
      .toMatchObject({ code: "MANAGED_IN_GOOGLE_PLAY" });
    expect((await checkout(req("/api/app/checkout", { plan: "year" }, { bearer: false }))).status).toBe(403);
  });
  it("rejects unknown plans", async () => {
    expect((await checkout(req("/api/app/checkout", { plan: "month" }))).status).toBe(422);
  });
});

describe("POST /api/app/portal", () => {
  it("sends Google Play members to Google Play", async () => {
    mocks.tables.account_subscriptions = { provider: "google_play" };
    expect(await (await portal(req("/api/app/portal", {}))).json()).toMatchObject({ provider: "google_play" });
  });
  it("opens the Stripe portal for web members", async () => {
    expect(await (await portal(req("/api/app/portal", {}))).json())
      .toEqual({ url: "https://billing.stripe.test/p", provider: "stripe" });
  });
});

describe("POST /api/account/delete", () => {
  it("requires the typed confirmation", async () => {
    const res = await deleteAccount(req("/api/account/delete", { confirmation: "delete" }));
    expect(res.status).toBe(422);
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
  it("requires a recent sign-in", async () => {
    mocks.bearerClaims!.amr = [{ method: "password", timestamp: now() - 3600 }];
    const res = await deleteAccount(req("/api/account/delete", { confirmation: "DELETE" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: "REAUTH_REQUIRED" });
  });
  it("refuses while a subscription will renew", async () => {
    mocks.tables.account_subscriptions = { provider: "stripe" };
    const res = await deleteAccount(req("/api/account/delete", { confirmation: "DELETE" }));
    expect(await res.json()).toMatchObject({ code: "ACTIVE_SUBSCRIPTION" });
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
  it("deletes the signed-in account", async () => {
    const res = await deleteAccount(req("/api/account/delete", { confirmation: "DELETE" }));
    expect(await res.json()).toEqual({ deleted: true });
    expect(mocks.deleteUser).toHaveBeenCalledWith("10000000-0000-4000-8000-000000000001");
  });
  it("reports accounts the database keeps for transaction records", async () => {
    mocks.deleteUser.mockResolvedValue({ error: { code: "unexpected_failure" } });
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const res = await deleteAccount(req("/api/account/delete", { confirmation: "DELETE" }));
    expect(await res.json()).toMatchObject({ code: "DELETE_BLOCKED" });
    expect(JSON.stringify(spy.mock.calls)).not.toContain("reader@example.test");
    spy.mockRestore();
  });
});
