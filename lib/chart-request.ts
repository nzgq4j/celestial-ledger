import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const SUPPORTED_BIRTH_YEAR_MIN = 1800;
export const SUPPORTED_BIRTH_YEAR_MAX = 2050;

export const resolvedPlaceSchema = z
  .object({
    id: z.string().trim().min(1).max(128),
    city: z.string().trim().min(1).max(160),
    region: z.string().trim().min(1).max(160).optional(),
    country: z.string().trim().min(1).max(160),
    displayName: z.string().trim().min(1).max(500),
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    timeZone: z.string().trim().min(1).max(100),
  })
  .strict();

export const birthInputSchema = z
  .object({
    date: z.string().regex(datePattern, "Enter a valid birth date."),
    time: z.string().regex(timePattern, "Enter a valid birth time.").optional(),
    timeUnknown: z.boolean(),
    disambiguation: z.enum(["earlier", "later"]).optional(),
    place: resolvedPlaceSchema,
  })
  .strict()
  .superRefine((input, context) => {
    if (!input.timeUnknown && !input.time) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["time"],
        message: "Birth time is required unless it is marked unknown.",
      });
    }
    if (input.timeUnknown && input.time !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["time"],
        message: "Do not provide a birth time when it is marked unknown.",
      });
    }
    if (!input.timeUnknown && Math.abs(input.place.latitude) >= 89.999) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["place", "latitude"],
        message:
          "Exact birth-time angles are unavailable at the geographic poles.",
      });
    }
    const [year, month, day] = input.date.split("-").map(Number);
    if (year < SUPPORTED_BIRTH_YEAR_MIN || year > SUPPORTED_BIRTH_YEAR_MAX) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date"],
        message: `Birth years must be between ${SUPPORTED_BIRTH_YEAR_MIN} and ${SUPPORTED_BIRTH_YEAR_MAX}.`,
      });
    }
    const candidate = new Date(Date.UTC(year, month - 1, day));
    if (
      candidate.getUTCFullYear() !== year ||
      candidate.getUTCMonth() !== month - 1 ||
      candidate.getUTCDate() !== day
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date"],
        message: "Enter a real calendar date.",
      });
    }
  });

export const chartRequestSchema = z
  .object({ birthInput: birthInputSchema })
  .strict();

const planetNameSchema = z.enum([
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "North Node",
  "Ascendant",
  "Midheaven",
]);
const aspectNameSchema = z.enum([
  "Conjunction",
  "Opposition",
  "Trine",
  "Square",
  "Sextile",
]);
const placementSchema = z
  .object({
    name: planetNameSchema,
    longitude: z.number().finite().min(0).lt(360),
    sign: z.string().trim().min(1).max(20),
    degree: z.number().int().min(0).max(29),
    minute: z.number().int().min(0).max(59),
    house: z.number().int().min(1).max(12).optional(),
    retrograde: z.boolean(),
    uncertain: z.boolean().optional(),
  })
  .strict();

export const natalChartSchema = z
  .object({
    input: birthInputSchema,
    utc: z.string().datetime(),
    julianDay: z.number().finite(),
    timeKnown: z.boolean(),
    placements: z.array(placementSchema).min(10).max(20),
    ascendant: placementSchema.optional(),
    midheaven: placementSchema.optional(),
    houses: z
      .array(
        z
          .object({
            house: z.number().int().min(1).max(12),
            longitude: z.number().finite().min(0).lt(360),
            sign: z.string().trim().min(1).max(20),
            degree: z.number().int().min(0).max(29),
            minute: z.number().int().min(0).max(59),
          })
          .strict(),
      )
      .max(12),
    aspects: z
      .array(
        z
          .object({
            body1: planetNameSchema,
            body2: planetNameSchema,
            type: aspectNameSchema,
            angle: z.number().finite().min(0).max(180),
            orb: z.number().finite().min(0).max(20),
          })
          .strict(),
      )
      .max(300),
    moonMayChangeSign: z.boolean(),
    calculation: z
      .object({
        zodiac: z.literal("Tropical"),
        houseSystem: z.enum(["Equal (Ascendant)", "None"]),
        ephemeris: z.string().trim().min(1).max(200),
        engineVersion: z.string().trim().min(1).max(100),
        calculationVersion: z.string().trim().min(1).max(100),
        aspectOrbs: z.record(
          aspectNameSchema,
          z.number().finite().min(0).max(20),
        ),
      })
      .strict(),
  })
  .strict();

export const CHART_REQUEST_MAX_BYTES = 8_192;

export type ChartRequestInput = z.infer<typeof birthInputSchema>;
