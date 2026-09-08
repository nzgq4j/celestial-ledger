import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  insert: vi.fn(),
  calculate: vi.fn(),
  cached: null as null | { id: string; status: string },
}));
const user = "10000000-0000-4000-8000-000000000001";
const profile = "20000000-0000-4000-8000-000000000001";
vi.mock("@/lib/api-security", () => ({
  isSameOrigin: () => true,
  PRIVATE_RESPONSE_HEADERS: { "Cache-Control": "private, no-store" },
  readLimitedJson: (request: Request) => request.json(),
}));
vi.mock("@/lib/supabase/config", () => ({ isDemoMode: () => false }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getClaims: async () => ({
        data: { claims: { sub: "10000000-0000-4000-8000-000000000001" } },
      }),
    },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: mocks.rpc,
    from: (table: string) => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        gt: () => builder,
        insert: mocks.insert,
        maybeSingle: async () => ({
          data:
            table === "birth_profiles"
              ? {
                  id: "20000000-0000-4000-8000-000000000001",
                  user_id: "10000000-0000-4000-8000-000000000001",
                  expires_at: "2099-01-01T00:00:00Z",
                  time_zone: "UTC",
                  updated_at: "2026-09-01T00:00:00Z",
                }
              : table === "profiles"
                ? { report_locale: "en-GB" }
                : mocks.cached,
        }),
      };
      return builder;
    },
  }),
}));
vi.mock("@/lib/chart", () => ({ calculateNatalChart: mocks.calculate }));
vi.mock("@/lib/daily-readings/calculation", () => ({
  dailyReadingCacheKey: () => "a".repeat(64),
  buildDailyReadingAnalysis: () => ({
    schemaVersion: "test",
    method: { calculationVersion: "test", ephemerisVersion: "test" },
    evidence: [],
  }),
}));
vi.mock("@/lib/daily-readings/generated", () => ({
  generateDailyReadingContent: async () => ({}),
}));
vi.mock("@/lib/content-similarity/recent-context", () => ({
  loadRecentContentContext: async () => [],
}));
import { POST } from "@/app/api/daily-readings/route";

const request = () =>
  new Request("https://www.celestialatlas.app/api/daily-readings", {
    method: "POST",
    body: JSON.stringify({
      birthProfileId: profile,
      readingDate: "2026-09-08",
      locale: "en-GB",
    }),
  });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.cached = null;
  mocks.calculate.mockResolvedValue({});
  mocks.insert.mockResolvedValue({ error: null });
  mocks.rpc.mockImplementation(async (name: string) => ({
    data: name === "reserve_daily_reading" ? { status: "reserved" } : null,
    error: null,
  }));
});
describe("daily reading allowance API", () => {
  it("denies exhausted allowances before calculation or generation", async () => {
    mocks.rpc.mockResolvedValue({
      data: { status: "allowance_exhausted", resetsAt: "2026-09-14T00:00:00Z" },
      error: null,
    });
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      code: "allowance_exhausted",
    });
    expect(mocks.calculate).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("fails closed if the quota service is unavailable", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "unavailable" },
    });
    expect((await POST(request())).status).toBe(503);
    expect(mocks.calculate).not.toHaveBeenCalled();
  });
  it("returns existing readings without reserving another slot", async () => {
    mocks.cached = { id: "saved-reading", status: "completed" };
    expect((await POST(request())).status).toBe(200);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.calculate).not.toHaveBeenCalled();
  });
  it("releases the reserved slot after a failed save", async () => {
    mocks.insert.mockResolvedValue({ error: { code: "save_failed" } });
    expect((await POST(request())).status).toBe(500);
    expect(mocks.rpc).toHaveBeenLastCalledWith("release_daily_reading", {
      p_user_id: user,
      p_reading_id: expect.any(String),
    });
  });
  it("binds the saved reading to the reservation ID", async () => {
    const response = await POST(request());
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(mocks.rpc).toHaveBeenCalledWith("reserve_daily_reading", {
      p_user_id: user,
      p_birth_profile_id: profile,
      p_cache_key: "a".repeat(64),
      p_reading_id: body.readingId,
    });
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: body.readingId, user_id: user }),
    );
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });
});
