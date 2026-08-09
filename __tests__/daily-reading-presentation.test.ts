import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("daily reading presentation", () => {
  it("keeps technical evidence out of section bodies", () => {
    const view = readFileSync("components/DailyReadingView.tsx", "utf8");
    expect(view).toContain("dailyUserFacingText(section.narrative)");
    expect(view).toContain("dailyUserFacingText(application)");
    expect(view).not.toContain("<summary>Why this matters</summary>");
    expect(view).toContain("Astrological basis and current limitations");
  });
});
