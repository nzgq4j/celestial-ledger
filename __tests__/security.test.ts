import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const walk = (dir: string): string[] =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
    );

describe("app bundle never sees server secrets", () => {
  const appSource = walk("celestial-atlas/src")
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => fs.readFileSync(f, "utf8"))
    .join("\n");

  it("references no secret environment variables", () => {
    for (const secret of [
      "SERVICE_ROLE",
      "STRIPE_SECRET",
      "STRIPE_WEBHOOK",
      "OPENAI",
      "CRON_SECRET",
      "GOOGLE_PLAY_SERVICE_ACCOUNT",
      "PENDING_CLAIM_HMAC",
    ])
      expect(appSource).not.toContain(secret);
  });

  it("only exposes public-prefixed variables to the build", () => {
    const vite = fs.readFileSync("celestial-atlas/vite.config.ts", "utf8");
    expect(vite).toMatch(/envPrefix:\s*\[\s*'VITE_',\s*'NEXT_PUBLIC_'\s*\]/);
  });
});

describe("server routes", () => {
  it("keep private responses out of caches and search engines", () => {
    const security = fs.readFileSync("lib/api-security.ts", "utf8");
    expect(security).toContain(
      '"Cache-Control": "private, no-store, max-age=0"',
    );
    expect(security).toContain(
      '"X-Robots-Tag": "noindex, nofollow, noarchive"',
    );
    for (const route of [
      "app/api/app/checkout/route.ts",
      "app/api/app/portal/route.ts",
      "app/api/account/delete/route.ts",
    ])
      expect(fs.readFileSync(route, "utf8")).toContain("appJson(request");
    expect(fs.readFileSync("lib/request-auth.ts", "utf8")).toContain(
      "PRIVATE_RESPONSE_HEADERS",
    );
  });

  it("protect the retention cron with CRON_SECRET", () => {
    const cron = fs.readFileSync(
      "app/api/internal/purge-journal/route.ts",
      "utf8",
    );
    expect(cron).toContain("process.env.CRON_SECRET");
    expect(cron).toContain("`Bearer ${expected}`");
  });

  it("keep email tokens out of server logs when handing them to the app", () => {
    const confirm = fs.readFileSync("app/auth/confirm/route.ts", "utf8");
    expect(confirm).toContain("target.hash =");
    expect(confirm).not.toContain('searchParams.set("token_hash"');
  });

  it("keep local secrets out of git", () => {
    expect(fs.readFileSync(".gitignore", "utf8")).toContain(".env");
  });
});
