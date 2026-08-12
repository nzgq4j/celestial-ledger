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
      'HOROSCOPE_PROMPT_VERSION = "daily-horoscope-2"',
    );
    expect(generator).toContain("daily_horoscope_editorial_plan");
    expect(generator).toContain("Other signs' reserved directions");
    expect(generator).toContain("Previous seven editions to avoid imitating");
    expect(generator).toContain("listing-card fields");
    expect(generator).toContain("miniature editorial column");
    expect(generator).toContain("Avoid any wording pattern");
    expect(generator).toContain("HOROSCOPE_UNKNOWN_EVIDENCE");
    expect(generator).toContain("HOROSCOPE_WITHIN_DAY_SIMILARITY_FAILED");
    expect(generator).toContain("HOROSCOPE_HISTORICAL_SIMILARITY_FAILED");
  });

  it("publishes only complete stored editions and never serves fallback copy", () => {
    expect(migration).toContain("unique (edition_date, locale)");
    expect(migration).toContain("status = 'published'");
    expect(generator).not.toContain("return fallback");
    expect(generator).toContain("HoroscopeEditionUnavailableError");
    expect(generator).toContain("HOROSCOPE_GENERATION_ATTEMPTS");
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
