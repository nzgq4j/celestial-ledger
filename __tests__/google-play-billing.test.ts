import { generateKeyPairSync, createSign } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  obfuscatedAccountIdFor,
  purchaseBelongsToUser,
} from "@/lib/google-play/account-id";
import {
  PubSubAuthError,
  verifyPubSubOidcToken,
  type GoogleJwk,
} from "@/lib/google-play/pubsub-auth";
import {
  decodeDeveloperNotification,
  subscriptionTokenFrom,
} from "@/lib/google-play/rtdn";
import {
  currentPeriodStart,
  mapPlaySubscription,
  subscriptionGrantsAccess,
  type PlaySubscriptionPurchaseV2,
} from "@/lib/google-play/subscription";
import {
  parseServiceAccount,
  signServiceAccountJwt,
} from "@/lib/google-play/service-account";

const now = new Date("2026-11-01T12:00:00Z");
const future = "2026-12-01T12:00:00Z";
const past = "2026-10-01T12:00:00Z";

function purchase(
  state: PlaySubscriptionPurchaseV2["subscriptionState"],
  overrides: Partial<PlaySubscriptionPurchaseV2> = {},
  item: Record<string, unknown> = {},
): PlaySubscriptionPurchaseV2 {
  return {
    subscriptionState: state,
    acknowledgementState: "ACKNOWLEDGEMENT_STATE_PENDING",
    latestOrderId: "GPA.1111-2222-3333-44444",
    lineItems: [
      {
        productId: "atlas",
        expiryTime: future,
        autoRenewingPlan: { autoRenewEnabled: true },
        offerDetails: { basePlanId: "monthly" },
        ...item,
      },
    ],
    ...overrides,
  };
}

describe("Google Play status mapping", () => {
  it.each([
    ["SUBSCRIPTION_STATE_ACTIVE", "active"],
    ["SUBSCRIPTION_STATE_PAUSED", "paused"],
    ["SUBSCRIPTION_STATE_EXPIRED", "canceled"],
    ["SUBSCRIPTION_STATE_PENDING", "incomplete"],
    ["SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED", "incomplete_expired"],
  ] as const)("%s → %s", (state, status) => {
    expect(mapPlaySubscription(purchase(state), now).status).toBe(status);
  });

  it("maps a free-trial phase to trialing", () => {
    const mapped = mapPlaySubscription(
      purchase(
        "SUBSCRIPTION_STATE_ACTIVE",
        {},
        { offerPhase: { freeTrial: {} } },
      ),
      now,
    );
    expect(mapped.status).toBe("trialing");
    expect(mapped.inFreeTrial).toBe(true);
  });

  it("keeps a grace period entitled until expiry", () => {
    const mapped = mapPlaySubscription(
      purchase("SUBSCRIPTION_STATE_IN_GRACE_PERIOD"),
      now,
    );
    expect(mapped).toMatchObject({
      status: "past_due",
      graceEndsAt: new Date(future).toISOString(),
    });
    expect(
      subscriptionGrantsAccess(
        {
          status: mapped.status,
          current_period_end: mapped.currentPeriodEnd,
          grace_ends_at: mapped.graceEndsAt,
        },
        now,
      ),
    ).toBe(true);
  });

  it("maps account hold to past_due without grace (no access)", () => {
    const mapped = mapPlaySubscription(
      purchase("SUBSCRIPTION_STATE_ON_HOLD", {}, { expiryTime: past }),
      now,
    );
    expect(mapped).toMatchObject({ status: "past_due", graceEndsAt: null });
    expect(
      subscriptionGrantsAccess(
        {
          status: mapped.status,
          current_period_end: mapped.currentPeriodEnd,
          grace_ends_at: null,
        },
        now,
      ),
    ).toBe(false);
    expect(mapped.needsAcknowledgement).toBe(false);
  });

  it("keeps a cancelled subscription active until expiry, then canceled", () => {
    const active = mapPlaySubscription(
      purchase("SUBSCRIPTION_STATE_CANCELED"),
      now,
    );
    expect(active).toMatchObject({ status: "active", cancelAtPeriodEnd: true });
    const trial = mapPlaySubscription(
      purchase(
        "SUBSCRIPTION_STATE_CANCELED",
        {},
        { offerPhase: { freeTrial: {} } },
      ),
      now,
    );
    expect(trial.status).toBe("trialing");
    const expired = mapPlaySubscription(
      purchase("SUBSCRIPTION_STATE_CANCELED", {}, { expiryTime: past }),
      now,
    );
    expect(expired.status).toBe("canceled");
  });

  it("flags auto-renew off as cancel at period end", () => {
    const mapped = mapPlaySubscription(
      purchase(
        "SUBSCRIPTION_STATE_ACTIVE",
        {},
        { autoRenewingPlan: { autoRenewEnabled: false } },
      ),
      now,
    );
    expect(mapped.cancelAtPeriodEnd).toBe(true);
  });

  it("acknowledges only pending, entitled purchases", () => {
    expect(
      mapPlaySubscription(purchase("SUBSCRIPTION_STATE_ACTIVE"), now)
        .needsAcknowledgement,
    ).toBe(true);
    expect(
      mapPlaySubscription(
        purchase("SUBSCRIPTION_STATE_ACTIVE", {
          acknowledgementState: "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED",
        }),
        now,
      ).needsAcknowledgement,
    ).toBe(false);
    expect(
      mapPlaySubscription(purchase("SUBSCRIPTION_STATE_PENDING"), now)
        .needsAcknowledgement,
    ).toBe(false);
  });

  it("extracts product, base plan and order", () => {
    expect(
      mapPlaySubscription(purchase("SUBSCRIPTION_STATE_ACTIVE"), now),
    ).toMatchObject({
      productId: "atlas",
      basePlanId: "monthly",
      orderId: "GPA.1111-2222-3333-44444",
    });
  });

  it("rejects unknown states and empty purchases", () => {
    expect(() =>
      mapPlaySubscription({
        subscriptionState: "SUBSCRIPTION_STATE_UNSPECIFIED",
        lineItems: [{ productId: "atlas" }],
      }),
    ).toThrow();
    expect(() =>
      mapPlaySubscription({ subscriptionState: "SUBSCRIPTION_STATE_ACTIVE" }),
    ).toThrow();
  });

  it("derives the period start from the interval or trial", () => {
    const end = "2026-12-01T00:00:00.000Z";
    expect(
      currentPeriodStart(
        { currentPeriodEnd: end, inFreeTrial: false },
        "month",
        7,
      ),
    ).toBe("2026-11-01T00:00:00.000Z");
    expect(
      currentPeriodStart(
        { currentPeriodEnd: end, inFreeTrial: false },
        "year",
        7,
      ),
    ).toBe("2025-12-01T00:00:00.000Z");
    expect(
      currentPeriodStart(
        { currentPeriodEnd: end, inFreeTrial: true },
        "year",
        7,
      ),
    ).toBe("2026-11-24T00:00:00.000Z");
  });
});

describe("obfuscated account id", () => {
  const user = "10000000-0000-4000-8000-000000000001";
  it("is a stable one-way hash within Play's 64-character limit", () => {
    const id = obfuscatedAccountIdFor(user);
    expect(id).toBe(obfuscatedAccountIdFor(user));
    expect(id.length).toBeLessThanOrEqual(64);
    expect(id).not.toContain(user);
    expect(id).not.toContain("@");
    expect(id).not.toBe(
      obfuscatedAccountIdFor("10000000-0000-4000-8000-000000000002"),
    );
  });

  it("matches only the account that bought", () => {
    expect(purchaseBelongsToUser(obfuscatedAccountIdFor(user), user)).toBe(
      true,
    );
    expect(
      purchaseBelongsToUser(obfuscatedAccountIdFor("someone-else"), user),
    ).toBe(false);
    expect(purchaseBelongsToUser(undefined, user)).toBe(false);
    expect(purchaseBelongsToUser("short", user)).toBe(false);
  });
});

describe("Pub/Sub OIDC verification", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const jwk = {
    ...(publicKey.export({ format: "jwk" }) as GoogleJwk),
    kid: "k1",
    alg: "RS256",
  };
  const audience = "https://www.celestialatlas.app/api/google-play/rtdn";
  const email = "rtdn-push@celestial-atlas.iam.gserviceaccount.com";
  const nowSeconds = 1_800_000_000;

  function token(
    claims: Record<string, unknown>,
    kid = "k1",
    key = privateKey,
  ) {
    const header = Buffer.from(
      JSON.stringify({ alg: "RS256", kid, typ: "JWT" }),
    ).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        iss: "https://accounts.google.com",
        aud: audience,
        email,
        email_verified: true,
        iat: nowSeconds - 10,
        exp: nowSeconds + 3600,
        ...claims,
      }),
    ).toString("base64url");
    const signer = createSign("RSA-SHA256");
    signer.update(`${header}.${payload}`);
    return `Bearer ${header}.${payload}.${signer.sign(key).toString("base64url")}`;
  }
  const options = {
    audience,
    serviceAccountEmail: email,
    fetchKeys: async () => [jwk],
    nowSeconds,
  };
  const rejects = async (
    authorization: string | null,
    code: string,
    extra = {},
  ) => {
    await expect(
      verifyPubSubOidcToken(authorization, { ...options, ...extra }),
    ).rejects.toMatchObject({ code });
  };

  it("accepts a valid Google-signed token", async () => {
    await expect(
      verifyPubSubOidcToken(token({}), options),
    ).resolves.toMatchObject({ email });
  });

  it("rejects missing, forged, misaddressed and expired tokens", async () => {
    await rejects(null, "MISSING_TOKEN");
    await rejects(token({}, "unknown"), "UNKNOWN_KEY");
    const other = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    }).privateKey;
    await rejects(token({}, "k1", other), "BAD_SIGNATURE");
    await rejects(token({ iss: "https://evil.example" }), "BAD_ISSUER");
    await rejects(token({ aud: "https://evil.example" }), "BAD_AUDIENCE");
    await rejects(token({ email: "attacker@example.com" }), "BAD_EMAIL");
    await rejects(token({ email_verified: false }), "BAD_EMAIL");
    await rejects(token({ exp: nowSeconds - 3600 }), "EXPIRED");
  });

  it("fails closed when not configured", async () => {
    await rejects(token({}), "NOT_CONFIGURED", { audience: undefined });
    expect(new PubSubAuthError("NOT_CONFIGURED").code).toBe("NOT_CONFIGURED");
  });
});

describe("RTDN decoding", () => {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64");
  it("extracts the subscription purchase token", () => {
    const notification = decodeDeveloperNotification(
      encode({
        version: "1.0",
        packageName: "com.celestialatlas.app",
        eventTimeMillis: "1",
        subscriptionNotification: {
          version: "1.0",
          notificationType: 4,
          purchaseToken: "token-abcdefghij",
          subscriptionId: "atlas",
        },
      }),
    );
    expect(notification && subscriptionTokenFrom(notification)).toBe(
      "token-abcdefghij",
    );
  });
  it("handles voided subscriptions and ignores junk", () => {
    const voided = decodeDeveloperNotification(
      encode({
        packageName: "com.celestialatlas.app",
        voidedPurchaseNotification: {
          purchaseToken: "token-abcdefghij",
          productType: 1,
        },
      }),
    );
    expect(voided && subscriptionTokenFrom(voided)).toBe("token-abcdefghij");
    expect(decodeDeveloperNotification("not base64 json")).toBeNull();
  });
});

describe("service account JWT", () => {
  it("signs an RS256 assertion for the requested scope", () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const account = parseServiceAccount(
      JSON.stringify({
        type: "service_account",
        project_id: "celestial-atlas",
        client_email: "play@celestial-atlas.iam.gserviceaccount.com",
        private_key: privateKey
          .export({ format: "pem", type: "pkcs8" })
          .toString()
          .replace(/\n/g, "\\n"),
      }),
    );
    const jwt = signServiceAccountJwt(
      account,
      "https://www.googleapis.com/auth/androidpublisher",
      100,
    );
    const claims = JSON.parse(
      Buffer.from(jwt.split(".")[1], "base64url").toString(),
    );
    expect(claims).toMatchObject({
      iss: account.client_email,
      aud: "https://oauth2.googleapis.com/token",
      iat: 100,
      exp: 3700,
    });
    expect(() => parseServiceAccount(undefined)).toThrow(
      "SERVICE_ACCOUNT_MISSING",
    );
    expect(() => parseServiceAccount("{}")).toThrow("SERVICE_ACCOUNT_INVALID");
  });
});
