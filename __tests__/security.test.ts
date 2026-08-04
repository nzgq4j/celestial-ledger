import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("API-key isolation", () => {
  it("does not expose OPENAI_API_KEY in client components", () => {
    const clientFiles = [
      "components/HoroscopeApp.tsx",
      "components/NatalChartWheel.tsx",
      "app/page.tsx",
    ];
    for (const file of clientFiles)
      expect(
        fs.readFileSync(path.join(process.cwd(), file), "utf8"),
      ).not.toContain("OPENAI_API_KEY");
  });
  it("ignores local environment files", () =>
    expect(fs.readFileSync(".gitignore", "utf8")).toContain(".env.local"));

  it("keeps privileged administration behind server-side RBAC", () => {
    const auth = fs.readFileSync("lib/admin/auth.ts", "utf8");
    expect(auth).toContain('import "server-only"');
    expect(auth).toContain('.from("admin_roles")');
    expect(auth).not.toContain("user_metadata");
  });

  it("protects administrative tables and exposes only published journal entries", () => {
    const migration = fs.readFileSync(
      "supabase/migrations/20260804095847_administration_console.sql",
      "utf8",
    );
    expect(migration).toContain(
      "alter table public.admin_roles enable row level security",
    );
    expect(migration).toContain("revoke all on public.admin_roles");
    expect(migration).toContain(
      "status = 'published' and published_at <= now()",
    );
    expect(migration).toContain("david@crucibleinsight.com");
  });

  it("never places the reCAPTCHA secret in a client component", () => {
    const client = fs.readFileSync("components/HoroscopeApp.tsx", "utf8");
    expect(client).not.toContain("RECAPTCHA_SECRET_KEY");
  });
});
