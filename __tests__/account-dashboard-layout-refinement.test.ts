import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("app/account/page.tsx", "utf8");
const css = readFileSync("app/globals.css", "utf8");

describe("My Atlas dashboard layout refinement", () => {
  it("consolidates identity and plan into one compact overview strip", () => {
    expect(page).toContain('className="account-overview-strip"');
    expect(page).toContain('className="account-plan-card" id="billing"');
    expect(page).toContain("Member observatory");
    expect(page).not.toContain('className="account-command-bar"');
    expect(page).not.toContain('className="account-hero__orbit"');
  });

  it("keeps the sidebar aligned below the now-visible global header", () => {
    expect(css).toContain("top: 5.8rem");
    expect(css).toContain("var(--atlas-cyan)");
    expect(css).not.toContain(
      "body:has(.account-dashboard) > .site-header,\nbody:has(.account-dashboard) > .site-footer",
    );
  });

  it("uses a stable usage-ordered flow rather than dense reordering", () => {
    expect(css).toContain("grid-auto-flow: row");
    expect(page.indexOf('id="readings"')).toBeLessThan(
      page.indexOf('id="reports"'),
    );
    expect(page.indexOf('id="reports"')).toBeLessThan(
      page.indexOf('id="birth-profiles"'),
    );
  });
});
