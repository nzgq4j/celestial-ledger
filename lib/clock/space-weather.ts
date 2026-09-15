import "server-only";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { createHash } from "node:crypto";
import type { WeatherFeed, SpaceWeather } from "./domain";

export const WEATHER_SOURCES = {
  kp: "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
  wind: "https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json",
} as const;
const stamp = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/);
const kpRow = z.object({
  time_tag: stamp,
  Kp: z.number().min(0).max(9),
  station_count: z.number().int().positive(),
});
const windRow = z.object({
  time_tag: stamp,
  active: z.literal(true),
  source: z.string().max(40),
  proton_speed: z.number().positive().max(5000),
  overall_quality: z.literal(0),
});
export function normalizeWeather(
  kind: WeatherFeed["kind"],
  payload: unknown,
  now: Date,
): WeatherFeed {
  if (!Array.isArray(payload) || payload.length > 30_000)
    throw new Error("Unsupported NOAA response");
  const records = new Map<string, WeatherFeed["observations"][number]>();
  for (const row of payload) {
    const parsed =
      kind === "kp" ? kpRow.safeParse(row) : windRow.safeParse(row);
    if (!parsed.success) continue;
    const record = parsed.data;
    const rawTime = record.time_tag.replace(" ", "T");
    const date = new Date(rawTime.endsWith("Z") ? rawTime : `${rawTime}Z`);
    if (
      Number.isFinite(+date) &&
      date.toISOString().slice(0, 19) !== rawTime.slice(0, 19)
    )
      continue;
    if (
      !Number.isFinite(+date) ||
      +date > +now ||
      +date < +now - 8 * 86_400_000
    )
      continue;
    const utc = date.toISOString();
    const value = "Kp" in record ? record.Kp : record.proton_speed;
    const source = "source" in record ? record.source : "NOAA planetary Kp";
    const id = `noaa_${createHash("sha256")
      .update(JSON.stringify(["noaa-v1", kind, utc, value, source]))
      .digest("hex")
      .slice(0, 24)}`;
    // Wind is sampled once per hour for a readable ring. Keep the latest valid observation.
    const key = kind === "wind" ? utc.slice(0, 13) : utc;
    const previous = records.get(key);
    if (!previous || utc > previous.utc)
      records.set(key, { id, utc, value, source });
  }
  const observations = [...records.values()].sort((a, b) =>
    a.utc.localeCompare(b.utc),
  );
  if (!observations.length) throw new Error("No valid NOAA observations");
  const threshold = kind === "kp" ? 6 * 3600_000 : 2 * 3600_000;
  return {
    kind,
    status:
      +now - +new Date(observations.at(-1)!.utc) > threshold
        ? "stale"
        : "ready",
    checkedAt: now.toISOString(),
    sourceUrl: WEATHER_SOURCES[kind],
    unit: kind === "kp" ? "Kp" : "km/s",
    observations,
  };
}

let cache: { expires: number; data: SpaceWeather } | undefined;
let pending: Promise<SpaceWeather> | undefined;
// Cache the small validated result, not NOAA's multi-megabyte raw wind response.
const fetchFeed = unstable_cache(
  async (kind: WeatherFeed["kind"]) => {
    const response = await fetch(WEATHER_SOURCES[kind], {
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("NOAA unavailable");
    const text = await response.text();
    if (text.length > 12_000_000) throw new Error("NOAA response too large");
    return normalizeWeather(kind, JSON.parse(text), new Date());
  },
  ["celestial-clock-noaa-v1"],
  { revalidate: 900 },
);
async function collect(): Promise<SpaceWeather> {
  const now = new Date();
  const feeds = await Promise.all(
    (Object.keys(WEATHER_SOURCES) as WeatherFeed["kind"][]).map(
      async (kind) => {
        try {
          const feed = await fetchFeed(kind);
          const threshold = kind === "kp" ? 6 * 3600_000 : 2 * 3600_000;
          return {
            ...feed,
            status:
              +now - +new Date(feed.observations.at(-1)!.utc) > threshold
                ? "stale"
                : feed.status,
          } satisfies WeatherFeed;
        } catch {
          const previous = cache?.data.feeds.find((feed) => feed.kind === kind);
          return {
            kind,
            status: previous?.observations.length ? "stale" : "unavailable",
            checkedAt: now.toISOString(),
            sourceUrl: WEATHER_SOURCES[kind],
            unit: kind === "kp" ? "Kp" : "km/s",
            observations: previous?.observations ?? [],
          } satisfies WeatherFeed;
        }
      },
    ),
  );
  const data = { feeds };
  cache = {
    expires:
      +now +
      (feeds.some((feed) => feed.status === "unavailable") ? 60_000 : 900_000),
    data,
  };
  return data;
}
export async function getSpaceWeather(): Promise<SpaceWeather> {
  if (cache && cache.expires > Date.now()) return cache.data;
  pending ??= collect().finally(() => {
    pending = undefined;
  });
  return pending;
}
