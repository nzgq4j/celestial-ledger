import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("crawler discovery files", () => {
  it("uses the llms.txt Markdown convention", () => {
    const route = fs.readFileSync("app/llms.txt/route.ts", "utf8");
    expect(route).toContain("# Celestial Atlas");
    expect(route).toContain("> ${settings.geo.organizationDescription}");
    expect(route).toContain("[Daily Sun-sign horoscopes]");
    expect(route).toContain("## Primary resources");
    expect(route).toContain("- [Create a natal chart]");
    expect(route).toContain("- [Astrological method and ephemeris]");
    expect(route).toContain("## Supported public horoscope languages");
    expect(route).toContain("## Citation guidance");
  });

  it("publishes the canonical sitemap through robots.txt", () => {
    const robots = fs.readFileSync("app/robots.ts", "utf8");
    expect(robots).toContain("/sitemap.xml");
    expect(robots).toContain('"/daily-readings/"');
    expect(robots).toContain('"/reports/"');
    expect(robots).toContain('"OAI-SearchBot"');
  });

  it("publishes language alternates and the complete public sample map", () => {
    const sitemap = fs.readFileSync("app/sitemap.ts", "utf8");
    expect(sitemap).toContain("localizedAlternates");
    expect(sitemap).toContain('path: "/samples/career-purpose"');
    expect(sitemap).toContain('path: "/samples/recovery-reflection"');
    expect(sitemap).toContain('path: "/samples/weekly-reading"');
  });
});
