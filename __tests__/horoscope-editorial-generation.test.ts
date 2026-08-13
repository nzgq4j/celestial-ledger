import { describe, expect, it } from "vitest";
import { horoscopeSimilarity } from "@/lib/horoscopes/similarity";
import fs from "node:fs";

const generator = fs.readFileSync("lib/horoscopes/generated.ts", "utf8");
const rollover = fs.readFileSync(
  "app/api/internal/horoscope-rollover/route.ts",
  "utf8",
);
const listing = fs.readFileSync("app/horoscopes/page.tsx", "utf8");
const detail = fs.readFileSync("app/horoscopes/[sign]/page.tsx", "utf8");
const migration = fs.readFileSync(
  "supabase/migrations/20260807170833_generated_daily_horoscope_editions.sql",
  "utf8",
);

describe("generated horoscope editorial editions", () => {
  it("detects meaningful repeated phrasing rather than exact strings only", () => {
    const original =
      "Take the useful conversation seriously and give the practical decision a clear owner before the afternoon loses focus.";
    const duplicate =
      "Take the useful conversation seriously and give the practical decision a clear owner before the afternoon loses focus today.";
    const distinct =
      "A private creative instinct needs room to become visible; protect the experiment from premature consensus.";
    expect(horoscopeSimilarity(original, duplicate)).toBeGreaterThan(0.7);
    expect(horoscopeSimilarity(original, distinct)).toBeLessThan(0.1);
  });

  it("generates and reviews one coherent twelve-sign edition from ranked evidence", () => {
    expect(generator).toContain(
      'HOROSCOPE_PROMPT_VERSION = "daily-sun-sign-ephemeris-5"',
    );
    expect(generator).toContain("daily_horoscope_complete_edition");
    expect(generator).toContain("timeout: 210_000");
    expect(generator).toContain("OPENAI_REQUEST_ATTEMPTS = 1");
    expect(generator).toContain("rankedEvidenceFor");
    expect(generator).toContain("They have already been selected and ranked");
    expect(generator).toContain("whole-sign solar houses");
    expect(generator).toContain("Use only server-supplied astronomical facts");
    expect(generator).toContain("does not come from forced novelty");
    expect(generator).toContain("Do not open with an analogy");
    expect(generator).toContain("daily_horoscope_editorial_quality_review");
    expect(generator).toContain("HOROSCOPE_EDITORIAL_QUALITY_FAILED");
    expect(generator).not.toContain("metaphor: z.string");
    expect(generator).toContain("HOROSCOPE_UNKNOWN_EVIDENCE");
    expect(generator).toContain("HOROSCOPE_WITHIN_DAY_SIMILARITY_FAILED");
    expect(generator).toContain("HOROSCOPE_HISTORICAL_SIMILARITY_FAILED");
  });

  it("presents morning, midday and evening as an editorial day rhythm", () => {
    expect(listing).toContain("<HoroscopeDayArc");
    expect(listing).toContain("compact");
    expect(detail).toContain("<HoroscopeDayArc");
    expect(generator).toContain("editorial checkpoints");
    expect(generator).toContain('schema value "afternoon"');
    expect(detail).toContain("reading.wellbeing");
  });

  it("keeps a validated current-day edition visible during regeneration", () => {
    expect(migration).toContain("unique (edition_date, locale)");
    expect(migration).toContain("status = 'published'");
    expect(generator).not.toContain("return fallback");
    expect(generator).toContain("HoroscopeEditionUnavailableError");
    expect(generator).toContain("HOROSCOPE_GENERATION_ATTEMPTS");
    expect(generator).toContain("hasStoredFallback");
    expect(generator).toContain("!options.force");
    expect(generator).toContain("storedEdition");
    expect(generator).toContain('status: "generating"');
    expect(generator).toContain('status: "failed"');
    expect(generator).toContain(
      '.eq("prompt_version", HOROSCOPE_PROMPT_VERSION)',
    );
    expect(rollover).toContain("retryScheduled: true");
    expect(listing).toContain("await publishedDailySky");
    expect(listing).toContain("sky.summary ?? copy.introduction");
    expect(detail).toContain("await publishedDailySky");
  });
});
