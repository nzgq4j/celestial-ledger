import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const reportPage = readFileSync("app/reports/page.tsx", "utf8");
const accountPage = readFileSync("app/account/page.tsx", "utf8");

describe("report commerce presentation", () => {
  it("publishes current prices and direct-checkout expectations", () => {
    expect(reportPage).toContain('price: "US$15 one-time"');
    expect(reportPage).toContain('price: "US$5 one-time"');
    expect(reportPage).toContain("View purchase options");
    expect(reportPage).toContain("direct Stripe checkout");
    expect(reportPage).not.toContain("Complimentary during preview");
  });

  it("explains private PDF delivery in discovery and account views", () => {
    expect(reportPage).toContain("Downloadable PDF");
    expect(reportPage).toContain("Available for one year");
    expect(accountPage).toContain("copy.reportDelivery");
  });
});
