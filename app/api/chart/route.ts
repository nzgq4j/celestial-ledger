import { z } from "zod";

import {
  isSameOrigin,
  PRIVATE_RESPONSE_HEADERS,
  readLimitedJson,
  RequestPayloadError,
} from "@/lib/api-security";
import {
  CHART_REQUEST_MAX_BYTES,
  chartRequestSchema,
} from "@/lib/chart-request";
import { calculateNatalChart } from "@/lib/chart";
import { HistoricalTimeError } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < 60_000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > 30;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: PRIVATE_RESPONSE_HEADERS,
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request))
    return json({ error: "Cross-origin chart requests are not allowed." }, 403);

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous";
  if (rateLimited(ip))
    return json({ error: "Too many chart requests. Try again shortly." }, 429);

  try {
    const payload = await readLimitedJson(request, CHART_REQUEST_MAX_BYTES);
    const { birthInput } = chartRequestSchema.parse(payload);
    const chart = await calculateNatalChart(birthInput);
    return json({
      chart,
      provenance: {
        engine: "astronomy-engine",
        engineVersion: chart.calculation.engineVersion,
        calculationVersion: chart.calculation.calculationVersion,
        zodiac: chart.calculation.zodiac,
        houseSystem: chart.calculation.houseSystem,
      },
    });
  } catch (error) {
    if (error instanceof RequestPayloadError) {
      return json(
        {
          error:
            error.code === "REQUEST_TOO_LARGE"
              ? "The chart request is too large."
              : "The chart request is not valid JSON.",
        },
        error.code === "REQUEST_TOO_LARGE" ? 413 : 400,
      );
    }
    if (error instanceof z.ZodError)
      return json({ error: "Invalid birth information." }, 422);
    if (error instanceof HistoricalTimeError)
      return json({ error: error.message, code: error.code }, 422);
    return json({ error: "The chart could not be calculated." }, 500);
  }
}
