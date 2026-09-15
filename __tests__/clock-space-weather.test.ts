import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeWeather } from "@/lib/clock/space-weather";
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

const now = new Date("2026-09-15T12:00:00.000Z");
const wind = {
  active: true,
  source: "SOLAR1",
  proton_speed: 420,
  overall_quality: 0,
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("NOAA observation adapter", () => {
  it("rejects missing, inactive, flagged and future wind observations", () => {
    const result = normalizeWeather(
      "wind",
      [
        { ...wind, time_tag: "2026-09-15T11:01:00" },
        { ...wind, time_tag: "2026-09-15T11:03:00", proton_speed: 430 },
        { ...wind, time_tag: "2026-09-15T11:04:00", active: false },
        { ...wind, time_tag: "2026-09-15T11:05:00", overall_quality: 1 },
        { ...wind, time_tag: "2026-09-15T11:06:00", proton_speed: null },
        { ...wind, time_tag: "2026-09-16T11:03:00" },
      ],
      now,
    );
    expect(result.status).toBe("ready");
    expect(result.observations).toHaveLength(1);
    expect(result.observations[0].value).toBe(430);
    expect(result.observations[0].utc).toBe("2026-09-15T11:03:00.000Z");
  });
  it("preserves Kp zero and distinguishes stale data from no data", () => {
    const rows = [{ time_tag: "2026-09-15T09:00:00", Kp: 0, station_count: 7 }];
    const fresh = normalizeWeather("kp", rows, now);
    expect(fresh.status).toBe("ready");
    expect(fresh.observations[0].value).toBe(0);
    const stale = normalizeWeather(
      "kp",
      rows,
      new Date("2026-09-16T00:00:00Z"),
    );
    expect(stale.status).toBe("stale");
    expect(stale.observations[0].id).toBe(fresh.observations[0].id);
    expect(() => normalizeWeather("kp", [], now)).toThrow();
    expect(() =>
      normalizeWeather("kp", [{ ...rows[0], Kp: 10 }], now),
    ).toThrow();
    expect(() => normalizeWeather("kp", { error: "outage" }, now)).toThrow();
  });
  it("coalesces requests and keeps last good observations during an outage", async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const fetchMock = vi
      .fn()
      .mockImplementation(async (url: string) =>
        Response.json(
          url.includes("k-index")
            ? [{ time_tag: "2026-09-15T09:00:00", Kp: 2, station_count: 7 }]
            : [{ ...wind, time_tag: "2026-09-15T11:00:00" }],
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const { getSpaceWeather } = await import("@/lib/clock/space-weather");
    const [first, second] = await Promise.all([
      getSpaceWeather(),
      getSpaceWeather(),
    ]);
    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await getSpaceWeather();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.setSystemTime(new Date(+now + 901_000));
    fetchMock.mockRejectedValue(new Error("Network unavailable"));
    const stale = await getSpaceWeather();
    expect(stale.feeds.every((f) => f.status === "stale")).toBe(true);
    expect(stale.feeds[0].observations).toEqual(first.feeds[0].observations);
  });
});
