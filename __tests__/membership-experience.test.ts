import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { localeTags } from "@/lib/i18n/config";
import { fillMembershipCopy, membershipCopy } from "@/lib/membership/content";
import {
  ATLAS_PRICES,
  ATLAS_YEARLY_SAVING_PERCENT,
  PLAN_ALLOWANCES,
} from "@/lib/membership/plans";

const css = readFileSync("app/styles/atlas-membership.css", "utf8");
const experience = readFileSync("components/MembershipExperience.tsx", "utf8");

describe("membership discovery experience", () => {
  it.each(localeTags)(
    "provides a complete %s landing and two-tier path",
    (locale) => {
      const copy = membershipCopy[locale];
      expect(copy.landing.routes).toHaveLength(3);
      expect(
        copy.landing.routes.every((route) => route.action.length > 0),
      ).toBe(true);
      expect(Object.keys(copy.page.tiers)).toEqual(["free", "atlas"]);
      expect(copy.page.tiers.free.price).toBe("$0");
      expect(copy.page.tiers.atlas.name).toBe("Atlas");
      expect(copy.page.tiers.atlas.price).toBe(ATLAS_PRICES.month.display);
      expect(copy.page.tiers.atlas.cadence).toContain("$99");
      expect(copy.page.tiers.free.features).toHaveLength(5);
      expect(copy.page.tiers.atlas.features).toHaveLength(5);
      for (const value of [
        copy.page.kicker,
        copy.page.title,
        copy.page.footnote,
        copy.page.startTrial,
        copy.page.upgrade,
        copy.page.manage,
        copy.page.currentPlan,
        copy.actions.useIncludedReport,
        copy.claim.retry,
      ])
        expect(value.length).toBeGreaterThan(0);
      expect(copy.page.title).toContain("Atlas");
      expect(copy.page.startTrial).toMatch(/7/);
    },
  );

  it("is translated rather than copied from English", () => {
    const english = membershipCopy["en-GB"].page;
    for (const locale of localeTags.filter((tag) => tag !== "en-GB")) {
      const page = membershipCopy[locale].page;
      expect(page.title).not.toBe(english.title);
      expect(page.footnote).not.toBe(english.footnote);
      expect(page.tiers.atlas.features).not.toEqual(
        english.tiers.atlas.features,
      );
    }
  });

  it("never names a retired or legacy plan to readers", () => {
    const serialized = JSON.stringify(membershipCopy);
    expect(serialized).not.toMatch(/Premium|Prémium|Personal\b/);
    expect(serialized).not.toContain("$9.99");
    expect(serialized).not.toContain("$19.99");
  });

  it("matches the catalogue allowances in the English feature list", () => {
    const { free, atlas } = membershipCopy["en-GB"].page.tiers;
    expect(free.features).toContain(
      `${PLAN_ALLOWANCES.free.savedCharts} saved natal chart with full interpretation`,
    );
    expect(atlas.features).toContain(
      `${PLAN_ALLOWANCES.atlas.savedCharts} saved charts + ${PLAN_ALLOWANCES.atlas.companionReadingsPerMonth} companion readings a month`,
    );
    expect(atlas.features).toContain(
      `One detailed report included each year, ${PLAN_ALLOWANCES.atlas.reportDiscountPercent}% off the rest`,
    );
    expect(membershipCopy["en-GB"].page.footnote).toBe(
      "All prices in USD. Cancel anytime; your chart and saved readings stay with your free account.",
    );
  });

  it("shows the yearly saving from the catalogue prices", () => {
    expect(ATLAS_YEARLY_SAVING_PERCENT).toBe(36);
    expect(
      fillMembershipCopy(membershipCopy["en-GB"].page.interval.yearlySaving, {
        percent: ATLAS_YEARLY_SAVING_PERCENT,
      }),
    ).toBe("Save 36%");
    expect(fillMembershipCopy("{missing} stays", {})).toBe("{missing} stays");
  });

  it("builds on the design-system primitives and stays within the mobile grid", () => {
    expect(experience).toContain('import "@/app/styles/atlas-membership.css"');
    expect(experience).toContain('className="atlas-kicker"');
    expect(experience).toContain('className="atlas-page-title"');
    expect(css).toMatch(
      /\.atlas-membership\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
    );
    expect(css).toMatch(/\.atlas-membership\s*>\s*\*\s*\{[^}]*min-width:\s*0/s);
    expect(css).toMatch(
      /\.atlas-membership__tier--atlas\s*\{[^}]*border-color:\s*var\(--atlas-gold\)/s,
    );
    expect(css).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });
});
