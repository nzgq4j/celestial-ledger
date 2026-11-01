import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const reportPage = readFileSync("app/reports/page.tsx", "utf8");
const offers = readFileSync("components/account/ReportOffers.tsx", "utf8");
const memberData = readFileSync("lib/account/member-data.ts", "utf8");
const memberCopy = readFileSync("lib/account/member-copy.ts", "utf8");
const accountPage = readFileSync("app/account/page.tsx", "utf8");

describe("report commerce presentation", () => {
  it("shows prices from the server catalogue rather than hard-coded amounts", () => {
    expect(reportPage).not.toMatch(/US\$\d/);
    expect(reportPage).toContain("loadPublicReportPrices()");
    expect(memberData).toContain('.from("report_prices")');
    expect(offers).toContain("<CheckoutButton");
    expect(offers).toContain("formatPrice(");
    expect(reportPage).not.toContain("Complimentary during preview");
  });

  it("links every report to its sample and explains private PDF delivery", () => {
    expect(offers).toContain('career_purpose: "/samples/career-purpose"');
    expect(offers).toContain(
      'recovery_reflection: "/samples/recovery-reflection"',
    );
    expect(offers).toContain("m.readSample");
    expect(memberCopy).toContain(
      'reportMeta: "PDF · evidence-linked · yours for one year"',
    );
    expect(memberCopy).toContain("kept in your account for one year");
    expect(accountPage).toContain("copy.reportDelivery");
  });

  it("names the paid plan Atlas and shows the Atlas report discount", () => {
    expect(offers).toContain("PLAN_ALLOWANCES.atlas.reportDiscountPercent");
    expect(offers).toContain('"discountPercent" in state');
    expect(memberCopy).not.toMatch(/Premium|Personal plan|Personal membership/);
  });
});
