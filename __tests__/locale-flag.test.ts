import { describe, expect, it } from "vitest";
import { englishFlagRegion } from "@/components/LocaleFlag";

describe("English language selector flag", () => {
  it("uses the United States flag for a US browser region", () => {
    expect(englishFlagRegion(["en-US", "en"])).toBe("US");
    expect(englishFlagRegion(["es-US", "en-US"])).toBe("US");
  });

  it("uses the Union Jack for every other or unknown browser region", () => {
    expect(englishFlagRegion(["en-GB"])).toBe("GB");
    expect(englishFlagRegion(["en-AU", "en-US"])).toBe("GB");
    expect(englishFlagRegion(["fr-FR"])).toBe("GB");
    expect(englishFlagRegion(undefined)).toBe("GB");
    expect(englishFlagRegion(["not_a_locale"])).toBe("GB");
  });
});
