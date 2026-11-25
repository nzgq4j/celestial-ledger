import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  calls: [] as {
    table: string;
    op: string;
    arg?: unknown;
    filters: unknown[];
  }[],
  dueRows: [] as unknown[],
  deliver: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const call = {
        table,
        op: "",
        arg: undefined as unknown,
        filters: [] as unknown[],
      };
      m.calls.push(call);
      const chain: Record<string, unknown> = {};
      for (const f of [
        "eq",
        "is",
        "lte",
        "gt",
        "order",
        "limit",
        "in",
        "range",
        "select",
      ]) {
        chain[f] = (...a: unknown[]) => {
          call.filters.push([f, ...a]);
          return chain;
        };
      }
      chain.upsert = (arg: unknown) => {
        call.op = "upsert";
        call.arg = arg;
        return chain;
      };
      chain.insert = async (arg: unknown) => {
        call.op = "insert";
        call.arg = arg;
        return { error: null };
      };
      chain.update = (arg: unknown) => {
        call.op = "update";
        call.arg = arg;
        return chain;
      };
      chain.delete = () => {
        call.op = "delete";
        return chain;
      };
      chain.single = async () => ({ data: { id: "dev-1" }, error: null });
      chain.then = (resolve: (v: unknown) => void) =>
        resolve(
          table === "atlas_push_messages" && call.op === ""
            ? { data: m.dueRows, error: null }
            : { data: [], error: null },
        );
      return chain;
    },
  }),
}));
vi.mock("@/lib/push/deliver", async (original) => ({
  ...(await original<typeof import("@/lib/push/deliver")>()),
  deliver: m.deliver,
}));

const { POST: register, DELETE: unregister } =
  await import("@/app/api/push/device/route");
const { GET: dispatch } =
  await import("@/app/api/internal/push-dispatch/route");

const KEY = "k".repeat(43);
const sub = {
  endpoint: "https://web.push.apple.com/QGuQy",
  keys: { p256dh: "B".repeat(87), auth: "A".repeat(22) },
};
const req = (body: unknown, method = "POST") =>
  new Request("https://www.celestialatlas.app/api/push/device", {
    method,
    headers: {
      "content-type": "application/json",
      origin: "https://localhost",
    },
    body: JSON.stringify(body),
  });
const soon = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

beforeEach(() => {
  m.calls.length = 0;
  m.dueRows = [];
  m.deliver.mockReset();
  vi.stubEnv("CRON_SECRET", "cron-secret");
});

describe("POST /api/push/device", () => {
  it("registers a web device and schedules only future insights", async () => {
    const res = await register(
      req({
        deviceKey: KEY,
        platform: "web",
        subscription: sub,
        locale: "es",
        announcements: true,
        insights: [
          { at: soon(-1), title: "Ayer", body: "Pasado" },
          { at: soon(12), title: "Día personal 3", body: "Socializa." },
          { at: soon(36), title: "Día personal 4", body: "Organízate." },
        ],
      }),
    );
    expect(await res.json()).toEqual({ ok: true, scheduled: 2 });
    const device = m.calls.find((c) => c.op === "upsert")!.arg as Record<
      string,
      unknown
    >;
    expect(device).toMatchObject({
      platform: "web",
      endpoint: sub.endpoint,
      locale: "es",
      fcm_token: null,
    });
    expect(device.device_key_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(device)).not.toContain(KEY);
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "https://localhost",
    );
  });

  it("rejects unknown push services and mismatched addresses", async () => {
    const bad = { ...sub, endpoint: "https://evil.example/push" };
    expect(
      (
        await register(
          req({
            deviceKey: KEY,
            platform: "web",
            subscription: bad,
            locale: "en",
            announcements: true,
            insights: [],
          }),
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await register(
          req({
            deviceKey: KEY,
            platform: "android",
            subscription: sub,
            locale: "en",
            announcements: true,
            insights: [],
          }),
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await register(
          req({
            deviceKey: "short",
            platform: "android",
            fcmToken: "t".repeat(40),
            locale: "en",
            announcements: true,
            insights: [],
          }),
        )
      ).status,
    ).toBe(422);
  });

  it("caps the number of insights per device", async () => {
    const insights = Array.from({ length: 17 }, (_, i) => ({
      at: soon(i + 1),
      title: "t",
      body: "b",
    }));
    expect(
      (
        await register(
          req({
            deviceKey: KEY,
            platform: "android",
            fcmToken: "t".repeat(40),
            locale: "en",
            announcements: true,
            insights,
          }),
        )
      ).status,
    ).toBe(422);
  });

  it("removes a device when notifications are turned off", async () => {
    const res = await unregister(req({ deviceKey: KEY }, "DELETE"));
    expect(await res.json()).toEqual({ ok: true });
    expect(
      m.calls.some(
        (c) => c.table === "atlas_push_devices" && c.op === "delete",
      ),
    ).toBe(true);
  });
});

describe("GET /api/internal/push-dispatch", () => {
  const cron = () =>
    new Request("https://www.celestialatlas.app/api/internal/push-dispatch", {
      headers: { authorization: "Bearer cron-secret" },
    });

  it("requires the cron secret", async () => {
    expect(
      (await dispatch(new Request("https://x.test/api/internal/push-dispatch")))
        .status,
    ).toBe(401);
  });

  it("marks delivered messages sent and removes devices whose address is gone", async () => {
    const device = (id: string) => ({
      id,
      platform: "web",
      fcm_token: null,
      endpoint: "https://web.push.apple.com/x",
      p256dh: "p",
      auth_secret: "a",
    });
    m.dueRows = [
      { id: "m1", title: "t", body: "b", url: "/today", device: device("d1") },
      { id: "m2", title: "t", body: "b", url: "/today", device: device("d2") },
      { id: "m3", title: "t", body: "b", url: "/today", device: device("d3") },
    ];
    m.deliver
      .mockResolvedValueOnce("sent")
      .mockResolvedValueOnce("gone")
      .mockResolvedValueOnce("retry");
    const res = await dispatch(cron());
    expect(await res.json()).toEqual({
      due: 3,
      sent: 1,
      failed: 0,
      retry: 1,
      removed: 1,
    });
    const marked = m.calls.find((c) => c.op === "update")!;
    expect(marked.filters).toContainEqual(["in", "id", ["m1"]]);
    const removed = m.calls.find(
      (c) => c.table === "atlas_push_devices" && c.op === "delete",
    )!;
    expect(removed.filters).toContainEqual(["in", "id", ["d2"]]);
  });
});
