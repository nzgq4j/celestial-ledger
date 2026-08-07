import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260807062951_save_natal_interpretations.sql",
  "utf8",
);
const interpretationRoute = readFileSync("app/api/interpret/route.ts", "utf8");
const marketingMigration = readFileSync(
  "supabase/migrations/20260803180130_marketing_subscribers.sql",
  "utf8",
);

describe("private natal-reading persistence", () => {
  it("stores the reading and immutable generation provenance on the owned profile", () => {
    expect(migration).toContain("add column natal_reading text");
    expect(migration).toContain("natal_reading_model_version");
    expect(migration).toContain("natal_reading_prompt_version");
    expect(migration).toContain("natal_reading_generated_at");
    expect(interpretationRoute).toContain('typeof userId !== "string"');
    expect(interpretationRoute).toContain("user_id: userId");
    expect(interpretationRoute).toContain("chart: chart as unknown as Json");
  });

  it("does not put birth data or readings into the marketing subscriber record", () => {
    expect(marketingMigration).toContain("Contains no birth data");
    expect(interpretationRoute).not.toContain("marketing_subscribers");
  });
});
