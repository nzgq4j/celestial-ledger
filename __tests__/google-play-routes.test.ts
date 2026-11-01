import { beforeEach, describe, expect, it, vi } from "vitest";
import { obfuscatedAccountIdFor } from "@/lib/google-play/account-id";

const user = "10000000-0000-4000-8000-000000000001";
const mocks = vi.hoisted(() => ({
  sameOrigin: true,
  userId: "10000000-0000-4000-8000-000000000001" as string | null,
  current: vi.fn(),
  byToken: vi.fn(),
  price: vi.fn(),
  upsert: vi.fn(),
  getPurchase: vi.fn(),
  acknowledge: vi.fn(),
  rpc: vi.fn(async () => ({ error: null })),
  verifyOidc: vi.fn(),
}));

vi.mock("@/lib/api-security", async (original) => ({
  ...(await original<typeof import("@/lib/api-security")>()),
  isSameOrigin: () => mocks.sameOrigin,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getClaims: async () => ({
        data: mocks.userId ? { claims: { sub: mocks.userId } } : null,
        error: null,
      }),
    },
  }),
}));
vi.mock("@/lib/google-play/api", async (original) => ({
  ...(await original<typeof import("@/lib/google-play/api")>()),
  getSubscriptionPurchase: mocks.getPurchase,
  acknowledgeSubscriptionPurchase: mocks.acknowledge,
}));
vi.mock("@/lib/google-play/store", async (original) => ({
  ...(await original<typeof import("@/lib/google-play/store")>()),
  playDb: () => ({ rpc: mocks.rpc }),
  currentSubscriptionFor: mocks.current,
  subscriptionByPurchaseToken: mocks.byToken,
  findPlayPrice: mocks.price,
  upsertPlaySubscription: mocks.upsert,
}));
vi.mock("@/lib/google-play/pubsub-auth", async (original) => ({
  ...(await original<typeof import("@/lib/google-play/pubsub-auth")>()),
  verifyPubSubOidcToken: mocks.verifyOidc,
}));

const { POST: verify } = await import("@/app/api/google-play/verify/route");
const { POST: rtdn } = await import("@/app/api/google-play/rtdn/route");
const { PubSubAuthError } = await import("@/lib/google-play/pubsub-auth");

const token = "play-token-1234567890.abc_DEF-ghi";
const request = (body: unknown) =>
  new Request("https://www.celestialatlas.app/api/google-play/verify", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://www.celestialatlas.app",
    },
    body: JSON.stringify(body),
  });

function purchaseFor(accountUser: string, state = "SUBSCRIPTION_STATE_ACTIVE") {
  return {
    subscriptionState: state,
    acknowledgementState: "ACKNOWLEDGEMENT_STATE_PENDING",
    latestOrderId: "GPA.1",
    externalAccountIdentifiers: {
      obfuscatedExternalAccountId: obfuscatedAccountIdFor(accountUser),
    },
    lineItems: [
      {
        productId: "atlas",
        expiryTime: new Date(Date.now() + 86_400_000 * 30).toISOString(),
        offerDetails: { basePlanId: "monthly" },
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sameOrigin = true;
  mocks.userId = user;
  mocks.current.mockResolvedValue(null);
  mocks.price.mockResolvedValue({
    plan_key: "premium",
    billing_interval: "month",
    trial_days: 7,
    google_play_product_id: "atlas",
    google_play_base_plan_id: "monthly",
    active: true,
    catalog_version: 1,
  });
  mocks.upsert.mockImplementation(async ({ mapped }) => ({
    plan_key: "premium",
    status: mapped.status,
    current_period_end: mapped.currentPeriodEnd,
    grace_ends_at: mapped.graceEndsAt,
  }));
  mocks.getPurchase.mockResolvedValue(purchaseFor(user));
});

describe("POST /api/google-play/verify", () => {
  it("rejects cross-origin requests", async () => {
    mocks.sameOrigin = false;
    expect((await verify(request({ purchaseToken: token }))).status).toBe(403);
  });

  it("requires a signed-in user", async () => {
    mocks.userId = null;
    const response = await verify(request({ purchaseToken: token }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "sign_in_required" });
  });

  it("validates the body strictly", async () => {
    expect((await verify(request({ purchaseToken: "x" }))).status).toBe(422);
    expect(
      (await verify(request({ purchaseToken: token, userId: user }))).status,
    ).toBe(422);
    expect(
      (await verify(request({ purchaseToken: "bad token with spaces" })))
        .status,
    ).toBe(422);
  });

  it("refuses when a Stripe subscription is current", async () => {
    mocks.current.mockResolvedValue({ provider: "stripe", status: "active" });
    const response = await verify(request({ purchaseToken: token }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "stripe_subscription_active",
    });
    expect(mocks.getPurchase).not.toHaveBeenCalled();
  });

  it("refuses a purchase made for another account", async () => {
    mocks.getPurchase.mockResolvedValue(
      purchaseFor("10000000-0000-4000-8000-000000000002"),
    );
    const response = await verify(request({ purchaseToken: token }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "account_mismatch" });
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(mocks.acknowledge).not.toHaveBeenCalled();
  });

  it("refuses unknown products", async () => {
    mocks.price.mockResolvedValue(null);
    expect((await verify(request({ purchaseToken: token }))).status).toBe(422);
  });

  it("stores, acknowledges and returns Atlas for a valid purchase", async () => {
    const response = await verify(request({ purchaseToken: token }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.json()).toMatchObject({
      plan: "atlas",
      status: "active",
    });
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user, purchaseToken: token }),
      expect.anything(),
    );
    expect(mocks.acknowledge).toHaveBeenCalledWith("atlas", token);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "grant_annual_report_credit",
      expect.objectContaining({ p_source_reference: "google_play:GPA.1" }),
    );
  });

  it("does not grant the included report during a free trial", async () => {
    const trial = purchaseFor(user);
    (trial.lineItems[0] as Record<string, unknown>).offerPhase = {
      freeTrial: {},
    };
    mocks.getPurchase.mockResolvedValue(trial);
    const response = await verify(request({ purchaseToken: token }));
    expect(await response.json()).toMatchObject({
      plan: "atlas",
      status: "trialing",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe("POST /api/google-play/rtdn", () => {
  const push = (notification: unknown, authorization = "Bearer x.y.z") =>
    new Request("https://www.celestialatlas.app/api/google-play/rtdn", {
      method: "POST",
      headers: { "content-type": "application/json", authorization },
      body: JSON.stringify({
        message: {
          data: Buffer.from(JSON.stringify(notification)).toString("base64"),
          messageId: "1",
        },
        subscription: "projects/p/subscriptions/s",
      }),
    });
  const notification = {
    packageName: "com.celestialatlas.app",
    subscriptionNotification: {
      notificationType: 2,
      purchaseToken: token,
      subscriptionId: "atlas",
    },
  };

  it("rejects requests without a valid Pub/Sub OIDC token", async () => {
    mocks.verifyOidc.mockRejectedValue(new PubSubAuthError("BAD_SIGNATURE"));
    expect((await rtdn(push(notification))).status).toBe(401);
    expect(mocks.getPurchase).not.toHaveBeenCalled();
  });

  it("fails closed when the audience is not configured", async () => {
    mocks.verifyOidc.mockRejectedValue(new PubSubAuthError("NOT_CONFIGURED"));
    expect((await rtdn(push(notification))).status).toBe(503);
  });

  it("re-fetches and re-upserts a known subscription", async () => {
    mocks.verifyOidc.mockResolvedValue({});
    mocks.byToken.mockResolvedValue({ user_id: user, provider: "google_play" });
    const response = await rtdn(push(notification));
    expect(response.status).toBe(200);
    expect(mocks.getPurchase).toHaveBeenCalledWith(token);
    expect(mocks.upsert).toHaveBeenCalled();
  });

  it("acknowledges unknown tokens and other packages without changes", async () => {
    mocks.verifyOidc.mockResolvedValue({});
    mocks.byToken.mockResolvedValue(null);
    expect(await (await rtdn(push(notification))).json()).toEqual({
      ignored: "unknown_token",
    });
    expect(
      await (
        await rtdn(push({ ...notification, packageName: "com.other.app" }))
      ).json(),
    ).toEqual({ ignored: "other_package" });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
