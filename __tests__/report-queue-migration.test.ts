import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260809102944_remove_recovery_adult_confirmation_gate.sql",
  "utf8",
);

describe("latest report queue contract", () => {
  it("allows and validates career themes in the report theme snapshot", () => {
    expect(migration).toContain("invalid_career_themes");
    expect(migration).toContain("direction_purpose");
    expect(migration).toContain("value_compensation");
    expect(migration).not.toContain("recovery_themes_not_allowed");
  });

  it("preserves recovery theme and owner-profile validation", () => {
    expect(migration).toContain("invalid_recovery_themes");
    expect(migration).not.toContain("adult_confirmation_required");
    expect(migration).not.toContain("adult_confirmed_at");
    expect(migration).toContain(
      "id = p_birth_profile_id and user_id = p_user_id",
    );
  });

  it("preserves entitlement ownership, idempotency, and deferred consumption", () => {
    expect(migration).toContain(
      "where id = p_entitlement_id and user_id = p_user_id",
    );
    expect(migration).toContain("where entitlement_id = p_entitlement_id");
    expect(migration).toContain("and status <> 'deleted'");
    expect(migration).not.toContain("set status = 'queued'");
    expect(migration).toContain(
      "consumption occurs only after successful completion",
    );
  });

  it("keeps queue execution restricted to the service role", () => {
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("to service_role");
  });
});
