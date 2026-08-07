import { describe, expect, it } from "vitest";
import { localeTags } from "@/lib/i18n/config";
import { membershipCopy } from "@/lib/membership/content";

describe("membership discovery experience", () => {
  it.each(localeTags)(
    "provides a complete %s landing and tier path",
    (locale) => {
      const copy = membershipCopy[locale];
      expect(copy.landing.routes).toHaveLength(3);
      expect(
        copy.landing.routes.every((route) => route.action.length > 0),
      ).toBe(true);
      expect(Object.keys(copy.page.tiers)).toEqual([
        "free",
        "personal",
        "premium",
      ]);
      expect(copy.page.tiers.free.price).toBe("$0");
      expect(copy.page.tiers.personal.price).toBe("$9.99");
      expect(copy.page.tiers.premium.price).toBe("$19.99");
      expect(copy.page.comparison).toHaveLength(6);
      expect(copy.page.path).toHaveLength(3);
    },
  );

  it("keeps the tier entitlements distinct and commercially bounded", () => {
    const tiers = membershipCopy["en-GB"].page.tiers;
    expect(tiers.free.features).toContain("1 saved natal chart");
    expect(tiers.personal.features).toContain("2 saved natal charts");
    expect(tiers.premium.features).toContain("5 saved natal charts");
    expect(tiers.premium.features).toContain(
      "Career and Recovery detailed reports included",
    );
    expect(
      new Set(Object.values(tiers).map((tier) => tier.features.join("|"))).size,
    ).toBe(3);
  });

  it("states that paid billing is not active", () => {
    for (const locale of localeTags) {
      expect(membershipCopy[locale].page.preview).not.toHaveLength(0);
      expect(membershipCopy[locale].page.note).not.toHaveLength(0);
    }
  });
});
