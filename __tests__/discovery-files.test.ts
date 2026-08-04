import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("crawler discovery files", () => {
  it("uses the llms.txt Markdown convention", () => {
    const route = fs.readFileSync("app/llms.txt/route.ts", "utf8");
    expect(route).toContain("# Celestial Atlas");
    expect(route).toContain("> ${settings.geo.organizationDescription}");
    expect(route).toContain("- [Daily horoscopes]");
    expect(route).toContain("## Journal and methodology");
  });

  it("publishes the canonical sitemap through robots.txt", () => {
    const robots = fs.readFileSync("app/robots.ts", "utf8");
    expect(robots).toContain("/sitemap.xml");
    expect(robots).toContain(
      'disallow: ["/account", "/admin", "/api", "/reports/"]',
    );
  });
});
