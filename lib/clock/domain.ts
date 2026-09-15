import { z } from "zod";

export const CLOCK_VERSION = "celestial-clock-v1";
export const MIN_CLOCK_YEAR = 2000;
export const MAX_CLOCK_YEAR = 2050;
export const clockDateSchema = z
  .string()
  .datetime()
  .refine((value) => {
    const date = new Date(value);
    return (
      Number.isFinite(+date) &&
      date.getUTCFullYear() >= MIN_CLOCK_YEAR &&
      date.getUTCFullYear() <= MAX_CLOCK_YEAR &&
      date.toISOString() === value
    );
  }, "Choose a UTC date between 2000 and 2050.");
export const clockQuerySchema = z
  .object({ at: clockDateSchema.optional() })
  .strict();
export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  utc: z.string().datetime(),
  kind: z.enum(["moon", "season"]),
  quarter: z.number().int().min(0).max(3).optional(),
});
export const clockSnapshotSchema = z.object({
  id: z.string(),
  utc: z.string().datetime(),
  year: z.number().int(),
  method: z.object({
    engine: z.string(),
    engineVersion: z.string(),
    calculationVersion: z.string(),
    zodiac: z.string(),
    houseSystem: z.null(),
    nodeType: z.null(),
    timezone: z.literal("UTC"),
    coordinates: z.null(),
  }),
  planets: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        longitude: z.number().min(0).lt(360),
        speed: z.number(),
        retrograde: z.boolean(),
        sign: z.string(),
        degree: z.number(),
      }),
    )
    .length(10),
  moon: z.object({
    id: z.string(),
    phase: z.number().min(0).lt(360),
    illuminated: z.number().min(0).max(1),
    label: z.string(),
  }),
  calendar: z.object({ id: z.string(), events: z.array(eventSchema) }),
  nextEvents: z.array(eventSchema),
});
export type ClockSnapshot = z.infer<typeof clockSnapshotSchema>;
export type ClockEvent = z.infer<typeof eventSchema>;
export const observationSchema = z.object({
  id: z.string(),
  utc: z.string().datetime(),
  value: z.number(),
  source: z.string(),
});
export const weatherFeedSchema = z.object({
  kind: z.enum(["kp", "wind"]),
  status: z.enum(["ready", "stale", "unavailable"]),
  checkedAt: z.string().datetime(),
  sourceUrl: z.string().url(),
  unit: z.string(),
  observations: z.array(observationSchema),
});
export const spaceWeatherSchema = z.object({
  feeds: z.array(weatherFeedSchema).length(2),
});
export type WeatherFeed = z.infer<typeof weatherFeedSchema>;
export type SpaceWeather = z.infer<typeof spaceWeatherSchema>;

export function yearFraction(utc: string, year: number): number {
  const start = Date.UTC(year, 0, 1);
  return (+new Date(utc) - start) / (Date.UTC(year + 1, 0, 1) - start);
}

export function utcMinute(date: Date): string {
  return new Date(Math.floor(+date / 60_000) * 60_000).toISOString();
}
