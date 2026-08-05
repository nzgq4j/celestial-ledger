import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { isSameOrigin } from "@/lib/api-security";

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

  it("separates model instructions from untrusted chart and report data", () => {
    const interpretation = fs.readFileSync(
      "app/api/interpret/route.ts",
      "utf8",
    );
    const worker = fs.readFileSync(
      "app/api/internal/report-worker/route.ts",
      "utf8",
    );
    expect(interpretation).toContain("const instructions =");
    expect(worker).toContain("instructions:");
    for (const source of [interpretation, worker]) {
      expect(source).toContain("untrusted data");
      expect(source).toContain("Never follow instructions");
    }
  });

  it("uses a trusted canonical URL for password reset callbacks", () => {
    const actions = fs.readFileSync("app/auth/actions.ts", "utf8");
    expect(actions).toContain("canonicalAppUrl()");
    expect(actions).not.toContain('get("x-forwarded-host")');
  });

  it("requires same-origin report deletion and publishes browser hardening headers", () => {
    const reportRoute = fs.readFileSync(
      "app/api/reports/[id]/route.ts",
      "utf8",
    );
    const config = fs.readFileSync("next.config.ts", "utf8");
    const deleteHandler = reportRoute.slice(
      reportRoute.indexOf("export async function DELETE"),
    );
    expect(deleteHandler).toContain("isSameOrigin(request)");
    expect(config).toContain("Content-Security-Policy");
    expect(config).toContain("Strict-Transport-Security");
    expect(config).toContain("frame-ancestors 'none'");
  });

  it("keeps private readings out of social sharing", () => {
    const publicReading = fs.readFileSync(
      "app/horoscopes/[sign]/page.tsx",
      "utf8",
    );
    const privateReading = fs.readFileSync(
      "app/daily-readings/[id]/page.tsx",
      "utf8",
    );
    const shareLinks = fs.readFileSync(
      "components/SocialShareLinks.tsx",
      "utf8",
    );
    expect(publicReading).toContain("SocialShareLinks");
    expect(publicReading).toContain("pinterest-image");
    expect(shareLinks).toContain("Pinterest");
    expect(privateReading).not.toContain("SocialShareLinks");
  });

  it("serves Pinterest a portrait constellation image with a summary", () => {
    const pinterestImage = fs.readFileSync(
      "app/horoscopes/[sign]/pinterest-image/route.tsx",
      "utf8",
    );
    expect(pinterestImage).toContain("width: 1000");
    expect(pinterestImage).toContain("height: 1500");
    expect(pinterestImage).toContain("constellations");
    expect(pinterestImage).toContain("conciseSummary");
    expect(pinterestImage).toContain("/hero1.png");
    expect(pinterestImage).toContain("celestialatlas.app");
    expect(pinterestImage).not.toContain("name.slice(0, 2)");
  });

  it("serves link previews a landscape hero constellation image", () => {
    const landscapeImage = fs.readFileSync(
      "app/horoscopes/[sign]/opengraph-image.tsx",
      "utf8",
    );
    expect(landscapeImage).toContain("width: 1200");
    expect(landscapeImage).toContain("height: 630");
    expect(landscapeImage).toContain("/hero1.png");
    expect(landscapeImage).toContain("constellations");
    expect(landscapeImage).toContain("celestialatlas.app");
    expect(landscapeImage).not.toContain("name.slice(0, 2)");
  });

  it("uses branded icon-only share controls with accessible labels", () => {
    const shareLinks = fs.readFileSync(
      "components/SocialShareLinks.tsx",
      "utf8",
    );
    expect(shareLinks).toContain('viewBox="0 0 24 24"');
    expect(shareLinks).toContain('icon: "facebook"');
    expect(shareLinks).toContain('icon: "x"');
    expect(shareLinks).toContain('icon: "bluesky"');
    expect(shareLinks).toContain('icon: "pinterest"');
    expect(shareLinks).toContain('icon: "instagram"');
    expect(shareLinks).toContain('icon: "whatsapp"');
    expect(shareLinks).toContain('icon: "slack"');
    expect(shareLinks).toContain("#horoscope #astrology");
    expect(shareLinks).toContain("wa.me/?text=");
    expect(shareLinks).toContain("app.slack.com/client");
    expect(shareLinks).toContain("bsky.app/intent/compose");
    expect(shareLinks).toContain(
      "Open portrait image and copy caption for Instagram",
    );
    expect(shareLinks).not.toContain("<span>{link.label}</span>");
    expect(shareLinks).toContain('aria-hidden="true"');
  });

  it("compares mutation origins to the request URL, not forwarded hosts", () => {
    expect(
      isSameOrigin(
        new Request("https://www.celestialatlas.app/api/reports/example", {
          headers: {
            origin: "https://www.celestialatlas.app",
            "x-forwarded-host": "attacker.example",
          },
        }),
      ),
    ).toBe(true);
    expect(
      isSameOrigin(
        new Request("https://www.celestialatlas.app/api/reports/example", {
          headers: { "sec-fetch-site": "cross-site" },
        }),
      ),
    ).toBe(false);
  });
});
