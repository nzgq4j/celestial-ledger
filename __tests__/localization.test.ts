import { describe, expect, it } from "vitest";
import { defaultLocale, localeRegistry, localeTags } from "@/lib/i18n/config";

function messageKeys(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof entry === "object" && entry !== null
      ? messageKeys(entry, path)
      : [path];
  });
}

describe("localisation registry", () => {
  it("uses unique, valid BCP 47 tags", () => {
    expect(new Set(localeTags).size).toBe(localeTags.length);
    for (const tag of localeTags)
      expect(new Intl.Locale(tag).toString()).toBe(tag);
  });

  it("loads a complete pack for every enabled locale", async () => {
    expect(localeTags).toContain(defaultLocale);
    const defaultPack = await localeRegistry[defaultLocale].load();
    const expectedKeys = messageKeys(defaultPack.messages).sort();

    for (const tag of localeTags) {
      const definition = localeRegistry[tag];
      const pack = await definition.load();
      expect(pack.tag).toBe(tag);
      expect(pack.direction).toBe(definition.direction);
      expect(messageKeys(pack.messages).sort()).toEqual(expectedKeys);
      expect(pack.messages.navigation.birthChart).not.toHaveLength(0);
      expect(pack.messages.preferences.language).not.toHaveLength(0);
    }
  });
});
