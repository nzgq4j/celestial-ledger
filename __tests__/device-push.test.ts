import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildFcmPayload, classifyFcmError } from "@/lib/push/fcm";
import { morningPushCopy } from "@/lib/push/messages";
import { localClock, morningAlertDueOn } from "@/lib/push/schedule";
import { nativeMessageCatalogue } from "@/lib/native/messages";
import { localeTags } from "@/lib/i18n/config";

const user = "10000000-0000-4000-8000-000000000001";
const fcmToken = "fcm-token-abcdefghijklmnopqrstuvwxyz0123456789:APA91b";

const mocks = vi.hoisted(() => ({
  sameOrigin: true,
  userId: "10000000-0000-4000-8000-000000000001" as string | null,
  calls: [] as { table: string; op: string; args: unknown[] }[],
  existing: null as null | { id: string; user_id: string },
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
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const builder: Record<string, unknown> = {};
      const record =
        (op: string) =>
        (...args: unknown[]) => {
          mocks.calls.push({ table, op, args });
          return builder;
        };
      for (const op of [
        "select",
        "eq",
        "order",
        "limit",
        "update",
        "insert",
        "delete",
      ])
        builder[op] = record(op);
      builder.maybeSingle = async () => ({ data: mocks.existing, error: null });
      builder.single = async () => ({
        data: {
          morning_alert_enabled: true,
          morning_alert_local_time: "06:30:00",
        },
        error: null,
      });
      builder.then = (resolve: (value: unknown) => void) =>
        resolve({
          data: [
            {
              morning_alert_enabled: false,
              morning_alert_local_time: "07:15:00",
            },
          ],
          error: null,
        });
      return builder;
    },
  }),
}));

const devices = await import("@/app/api/devices/route");
const cron = await import("@/app/api/internal/morning-push/route");

const call = (method: string, body?: unknown) =>
  new Request("https://www.celestialatlas.app/api/devices", {
    method,
    headers: {
      "content-type": "application/json",
      origin: "https://www.celestialatlas.app",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

beforeEach(() => {
  mocks.sameOrigin = true;
  mocks.userId = user;
  mocks.calls = [];
  mocks.existing = null;
});

describe("/api/devices", () => {
  it("requires sign-in and same origin to register", async () => {
    mocks.userId = null;
    expect((await devices.POST(call("POST", { token: fcmToken }))).status).toBe(
      401,
    );
    mocks.userId = user;
    mocks.sameOrigin = false;
    expect((await devices.POST(call("POST", { token: fcmToken }))).status).toBe(
      403,
    );
  });

  it("validates the device strictly", async () => {
    expect((await devices.POST(call("POST", { token: "short" }))).status).toBe(
      422,
    );
    expect(
      (await devices.POST(call("POST", { token: fcmToken, platform: "ios" })))
        .status,
    ).toBe(422);
    expect(
      (
        await devices.POST(
          call("POST", { token: fcmToken, timezone: "Mars/Olympus" }),
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await devices.POST(
          call("POST", { token: fcmToken, birthDate: "1990-01-01" }),
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await devices.POST(
          call("POST", { token: fcmToken, morningAlertLocalTime: "25:00" }),
        )
      ).status,
    ).toBe(422);
  });

  it("rejects oversized bodies", async () => {
    const response = await devices.POST(
      call("POST", { token: "a".repeat(9000) }),
    );
    expect(response.status).toBe(413);
  });

  it("inserts a new token for the signed-in user", async () => {
    const response = await devices.POST(
      call("POST", {
        token: fcmToken,
        locale: "fr-FR",
        timezone: "Europe/Paris",
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      registered: true,
      morningAlertEnabled: true,
      morningAlertLocalTime: "06:30",
    });
    const insert = mocks.calls.find((entry) => entry.op === "insert");
    expect(insert?.args[0]).toMatchObject({
      token: fcmToken,
      user_id: user,
      locale: "fr-FR",
      timezone: "Europe/Paris",
    });
  });

  it("moves a token to the account now signed in on the device", async () => {
    mocks.existing = { id: "d1", user_id: "someone-else" };
    await devices.POST(call("POST", { token: fcmToken }));
    const update = mocks.calls.find((entry) => entry.op === "update");
    expect(update?.args[0]).toMatchObject({
      user_id: user,
      last_notified_on: null,
    });
  });

  it("updates the morning alert only for the user's devices", async () => {
    const response = await devices.PATCH(
      call("PATCH", {
        morningAlertEnabled: false,
        morningAlertLocalTime: "07:15",
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      morningAlertEnabled: false,
      morningAlertLocalTime: "07:15",
    });
    expect(mocks.calls).toContainEqual({
      table: "device_push_tokens",
      op: "eq",
      args: ["user_id", user],
    });
    expect((await devices.PATCH(call("PATCH", {}))).status).toBe(422);
  });

  it("unregisters by token, scoped to the user when signed in", async () => {
    expect(
      (await devices.DELETE(call("DELETE", { token: fcmToken }))).status,
    ).toBe(200);
    expect(mocks.calls).toContainEqual({
      table: "device_push_tokens",
      op: "eq",
      args: ["user_id", user],
    });
    mocks.calls = [];
    mocks.userId = null;
    expect(
      (await devices.DELETE(call("DELETE", { token: fcmToken }))).status,
    ).toBe(200);
    expect(mocks.calls.some((entry) => entry.args[0] === "user_id")).toBe(
      false,
    );
  });
});

describe("/api/internal/morning-push", () => {
  it("requires the cron secret", async () => {
    process.env.CRON_SECRET = "cron-secret";
    const anonymous = await cron.GET(
      new Request("https://x/api/internal/morning-push"),
    );
    expect(anonymous.status).toBe(401);
    const wrong = await cron.GET(
      new Request("https://x/api/internal/morning-push", {
        headers: { authorization: "Bearer nope" },
      }),
    );
    expect(wrong.status).toBe(401);
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const skipped = await cron.GET(
      new Request("https://x/api/internal/morning-push", {
        headers: { authorization: "Bearer cron-secret" },
      }),
    );
    expect(await skipped.json()).toEqual({
      ok: true,
      skipped: "push_not_configured",
    });
  });
});

describe("morning alert schedule", () => {
  const device = {
    timezone: "Europe/Madrid",
    morning_alert_enabled: true,
    morning_alert_local_time: "06:30:00",
    last_notified_on: null as string | null,
  };

  it("computes the device-local clock", () => {
    expect(
      localClock(new Date("2026-11-01T05:45:00Z"), "Europe/Madrid"),
    ).toEqual({ date: "2026-11-01", minutes: 405 });
    expect(
      localClock(new Date("2026-11-01T05:45:00Z"), "Pacific/Kiritimati").date,
    ).toBe("2026-11-01");
    expect(
      localClock(new Date("2026-11-01T05:45:00Z"), "Not/AZone").minutes,
    ).toBe(345);
  });

  it("is due once the local alert time has passed today", () => {
    expect(
      morningAlertDueOn(device, new Date("2026-11-01T05:20:00Z")),
    ).toBeNull(); // 06:20 local
    expect(morningAlertDueOn(device, new Date("2026-11-01T05:30:00Z"))).toBe(
      "2026-11-01",
    ); // 06:30
    expect(morningAlertDueOn(device, new Date("2026-11-01T08:00:00Z"))).toBe(
      "2026-11-01",
    );
  });

  it("never alerts twice a day, late at night or when switched off", () => {
    expect(
      morningAlertDueOn(
        { ...device, last_notified_on: "2026-11-01" },
        new Date("2026-11-01T06:00:00Z"),
      ),
    ).toBeNull();
    expect(
      morningAlertDueOn(
        { ...device, last_notified_on: "2026-10-31" },
        new Date("2026-11-01T06:00:00Z"),
      ),
    ).toBe("2026-11-01");
    expect(
      morningAlertDueOn(device, new Date("2026-11-01T20:00:00Z")),
    ).toBeNull();
    expect(
      morningAlertDueOn(
        { ...device, morning_alert_enabled: false },
        new Date("2026-11-01T06:00:00Z"),
      ),
    ).toBeNull();
  });
});

describe("FCM", () => {
  it("builds a localized notification with an in-app deep link", () => {
    const copy = morningPushCopy("de-DE");
    const payload = buildFcmPayload({
      token: fcmToken,
      ...copy,
      url: "/account",
    });
    expect(payload.message.data).toEqual({ url: "/account" });
    expect(payload.message.notification.title).toBe(
      "Deine Deutung für heute ist bereit",
    );
    expect(payload.message.android.notification.channel_id).toBe(
      "morning_reading",
    );
    expect(morningPushCopy("xx-XX").title).toBe(
      "Your reading for today is ready",
    );
  });

  it("treats UNREGISTERED and 404 as stale tokens", () => {
    expect(
      classifyFcmError(404, {
        error: {
          status: "NOT_FOUND",
          details: [{ errorCode: "UNREGISTERED" }],
        },
      }),
    ).toMatchObject({
      unregistered: true,
      retryable: false,
      code: "UNREGISTERED",
    });
    expect(classifyFcmError(404, null).unregistered).toBe(true);
    expect(classifyFcmError(503, null)).toMatchObject({
      unregistered: false,
      retryable: true,
    });
    expect(
      classifyFcmError(400, { error: { status: "INVALID_ARGUMENT" } }),
    ).toMatchObject({ unregistered: false, retryable: false });
  });
});

describe("native copy", () => {
  it("covers every locale", () => {
    for (const locale of localeTags) {
      expect(nativeMessageCatalogue[locale].push.promptTitle).toBeTruthy();
      expect(
        nativeMessageCatalogue[locale].billing.errors
          .stripe_subscription_active,
      ).toBeTruthy();
      expect(morningPushCopy(locale).title).toBeTruthy();
    }
  });
});

describe("device_push_tokens migration", () => {
  it("creates an owner-only table with constraints", async () => {
    const db = new PGlite();
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create schema auth; create schema private;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql as 'select null::uuid';
      create function private.set_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now(); return new; end;$$;`);
    await db.exec(
      readFileSync(
        "supabase/migrations/20261101120000_device_push_tokens.sql",
        "utf8",
      ),
    );
    await db.query("insert into auth.users(id) values ($1)", [user]);
    await db.query(
      "insert into public.device_push_tokens(user_id, token) values ($1, $2)",
      [user, fcmToken],
    );
    const row = (
      await db.query<{
        platform: string;
        morning_alert_local_time: string;
        morning_alert_enabled: boolean;
      }>(
        "select platform, morning_alert_local_time::text, morning_alert_enabled from public.device_push_tokens",
      )
    ).rows[0];
    expect(row).toEqual({
      platform: "android",
      morning_alert_local_time: "06:30:00",
      morning_alert_enabled: true,
    });
    await expect(
      db.query(
        "insert into public.device_push_tokens(user_id, token) values ($1, $2)",
        [user, fcmToken],
      ),
    ).rejects.toThrow();
    await expect(
      db.query(
        "insert into public.device_push_tokens(user_id, token, platform) values ($1, $2, 'ios')",
        [user, `${fcmToken}x`],
      ),
    ).rejects.toThrow();
    const rls = await db.query<{ relrowsecurity: boolean }>(
      "select relrowsecurity from pg_class where relname = 'device_push_tokens'",
    );
    expect(rls.rows[0].relrowsecurity).toBe(true);
    const policies = await db.query(
      "select policyname from pg_policies where tablename = 'device_push_tokens'",
    );
    expect(policies.rows).toHaveLength(4);
    await db.query("delete from auth.users where id = $1", [user]);
    expect(
      (await db.query("select 1 from public.device_push_tokens")).rows,
    ).toHaveLength(0);
    await db.close();
  }, 30_000);
});
