import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("daily reading generation contract", () => {
  it("requires interpretation-first copy without technical evidence in reader fields", () => {
    const source = readFileSync("lib/daily-readings/generated.ts", "utf8");
    expect(source).toContain("DAILY_READING_TECHNICAL_COPY_LEAK");
    expect(source).toContain("DAILY_READING_SECTION_LENGTH_FAILED");
    expect(source).toContain("Each section narrative must be 350-500 words");
    expect(source).toContain("Do not put technical evidence in reader-facing prose");
    expect(source).toContain("dailyUserFacingText");
    expect(source).toContain("expandReaderSection");
    expect(source).toContain("sanitizeReaderFacingDailyCopy(raw, base)");
    expect(source).not.toContain(
      "Write this private daily astrological reading from the immutable, server-calculated evidence",
    );
  });
});
