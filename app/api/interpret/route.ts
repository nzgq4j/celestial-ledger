import OpenAI from "openai";
import { calculateNatalChart } from "@/lib/chart";
import {
  CHART_REQUEST_MAX_BYTES,
  chartRequestSchema,
} from "@/lib/chart-request";
import {
  isSameOrigin,
  readLimitedJson,
  RequestPayloadError,
} from "@/lib/api-security";
import { HistoricalTimeError } from "@/lib/time";
import { z } from "zod";
import { getConfiguredModel } from "@/lib/admin/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractResponseText(response: unknown): string {
  if (!response || typeof response !== "object") return "";
  const candidate = response as { output_text?: unknown; output?: unknown };
  if (typeof candidate.output_text === "string" && candidate.output_text.trim())
    return candidate.output_text.trim();
  if (!Array.isArray(candidate.output)) return "";
  const parts: string[] = [];
  for (const item of candidate.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string" && text.trim()) parts.push(text.trim());
    }
  }
  return parts.join("\n\n").trim();
}

const hits = new Map<string, number[]>();
function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > 8;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return Response.json(
      { error: "Cross-origin interpretation requests are not allowed." },
      { status: 403 },
    );
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "anonymous";
  if (rateLimited(ip))
    return Response.json(
      { error: "Too many interpretation requests. Try again shortly." },
      { status: 429 },
    );
  if (!process.env.OPENAI_API_KEY)
    return Response.json(
      { error: "The interpretation service is not configured." },
      { status: 503 },
    );
  let chart;
  try {
    const body = await readLimitedJson(request, CHART_REQUEST_MAX_BYTES);
    const { birthInput } = chartRequestSchema.parse(body);
    chart = await calculateNatalChart(birthInput);
  } catch (error) {
    if (error instanceof RequestPayloadError)
      return Response.json(
        { error: "Invalid interpretation request." },
        { status: error.code === "REQUEST_TOO_LARGE" ? 413 : 400 },
      );
    if (error instanceof z.ZodError)
      return Response.json(
        { error: "Invalid birth information." },
        { status: 422 },
      );
    if (error instanceof HistoricalTimeError)
      return Response.json(
        { error: error.message, code: error.code },
        { status: 422 },
      );
    return Response.json(
      { error: "The chart could not be calculated." },
      { status: 500 },
    );
  }

  const display = {
    birthplace: [
      chart.input.place.city,
      chart.input.place.region,
      chart.input.place.country,
    ]
      .filter(Boolean)
      .join(", "),
    birthDate: chart.input.date,
    timeKnown: chart.timeKnown,
    utc: chart.utc,
  };
  const facts = {
    placements: chart.placements,
    ascendant: chart.ascendant,
    midheaven: chart.midheaven,
    houses: chart.houses,
    aspects: chart.aspects,
    moonMayChangeSign: chart.moonMayChangeSign,
    calculation: chart.calculation,
  };

  const prompt = `You are writing a careful Western tropical natal-chart interpretation. Astrology is a symbolic interpretive tradition, not scientifically validated prediction.

Non-negotiable rules:
- Interpret only the supplied chart facts. Never invent, alter, infer, or recalculate placements, houses, aspects, degrees, or timing.
- Distinguish isolated placements from patterns supported by multiple chart factors.
- Explain technical astrological terms when first used.
- Avoid deterministic predictions and medical, legal, financial, or mental-health diagnosis.
- Use measured language such as “may indicate,” “is traditionally associated with,” and “can be expressed as.”
- Identify tensions and reinforcing themes.
- Prefer specific house and aspect evidence over generic sign descriptions.
- When timeKnown is false, omit all angle- and house-dependent claims and clearly state the limitation.

Use these exact headings:
1. Chart Overview
2. Sun, Moon, and Ascendant
3. Thinking and Communication
4. Relationships and Values
5. Motivation and Conflict Style
6. Work, Direction, and Public Life
7. Major Aspect Patterns
8. Strengths
9. Potential Growth Areas
10. Concise Summary

Formatting requirements:
- Put every numbered heading on its own line.
- Follow each heading with one or more short paragraphs separated by blank lines.
- Do not use a single uninterrupted block of text.

Display information:\n${JSON.stringify(display)}\n\nValidated chart facts:\n${JSON.stringify(facts)}`;

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: await getConfiguredModel("interpretation"),
      input: prompt,
      store: false,
    });
    const interpretation = extractResponseText(response);
    if (!interpretation)
      return Response.json(
        {
          error:
            "The interpretation service returned an empty response. The calculated chart remains available.",
        },
        { status: 502, headers: { "Cache-Control": "private, no-store" } },
      );
    return Response.json(
      { interpretation },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error: any) {
    const status = error?.status === 429 ? 429 : 502;
    return Response.json(
      {
        error:
          status === 429
            ? "The interpretation service is rate limited. The calculated chart remains available."
            : "The interpretation could not be generated. The calculated chart remains available.",
      },
      { status },
    );
  }
}
