import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260807072000_allow_career_report_themes.sql",
  "utf8",
);

describe("report queue theme contract", () => {
  it("allows and validates career themes in the report theme snapshot", () => {
    expect(migration).toContain("invalid_career_themes");
    expect(migration).toContain("direction_purpose");
    expect(migration).toContain("value_compensation");
    expect(migration).not.toContain("recovery_themes_not_allowed");
  });

  it("preserves recovery theme and owner-profile validation", () => {
    expect(migration).toContain("invalid_recovery_themes");
    expect(migration).toContain("adult_confirmation_required");
    expect(migration).toContain(
      "id = p_birth_profile_id and user_id = p_user_id",
    );
  });
});
