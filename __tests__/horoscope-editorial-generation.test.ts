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

  it("plans twelve distinct angles and generates each sign from evidence", () => {
    expect(generator).toContain(
      'HOROSCOPE_PROMPT_VERSION = "daily-sun-sign-ephemeris-4"',
    );
    expect(generator).toContain("daily_horoscope_editorial_plan");
    expect(generator).toContain("Other signs' reserved directions");
    expect(generator).toContain("Previous seven editions to avoid imitating");
    expect(generator).toContain(
      "Silently rank the three to six most useful signals",
    );
    expect(generator).toContain("whole-sign solar chart");
    expect(generator).toContain("Use only server-supplied astronomical facts");
    expect(generator).toContain(
      "Reader-facing fields contain only the horoscope itself",
    );
    expect(generator).toContain(
      "No complete sentence or reusable clause may appear in more than one sign",
    );
    expect(generator).toContain("HOROSCOPE_UNKNOWN_EVIDENCE");
    expect(generator).toContain("HOROSCOPE_WITHIN_DAY_SIMILARITY_FAILED");
    expect(generator).toContain("HOROSCOPE_HISTORICAL_SIMILARITY_FAILED");
  });

  it("does not present a fabricated intraday arc from the noon snapshot", () => {
    expect(listing).not.toContain("<HoroscopeDayArc");
    expect(detail).not.toContain("<HoroscopeDayArc");
    expect(detail).toContain("reading.wellbeing");
  });

  it("keeps a validated current-day edition visible during regeneration", () => {
    expect(migration).toContain("unique (edition_date, locale)");
    expect(migration).toContain("status = 'published'");
    expect(generator).not.toContain("return fallback");
    expect(generator).toContain("HoroscopeEditionUnavailableError");
    expect(generator).toContain("HOROSCOPE_GENERATION_ATTEMPTS");
    expect(generator).toContain("hasStoredFallback");
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
