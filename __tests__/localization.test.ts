import { describe, expect, it } from "vitest";
import { defaultLocale, localeRegistry, localeTags } from "@/lib/i18n/config";

describe("localisation registry", () => {
  it("uses unique, valid BCP 47 tags", () => {
    expect(new Set(localeTags).size).toBe(localeTags.length);
    for (const tag of localeTags)
      expect(new Intl.Locale(tag).toString()).toBe(tag);
  });

  it("loads a complete pack for every enabled locale", async () => {
    expect(localeTags).toContain(defaultLocale);

    for (const tag of localeTags) {
      const definition = localeRegistry[tag];
      const pack = await definition.load();
      expect(pack.tag).toBe(tag);
      expect(pack.direction).toBe(definition.direction);
      expect(pack.messages.navigation.chart).not.toHaveLength(0);
      expect(pack.messages.preferences.language).not.toHaveLength(0);
    }
  });
});
