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
});
