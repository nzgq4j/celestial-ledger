import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("app/account/page.tsx", "utf8");
const css = readFileSync("app/globals.css", "utf8");

describe("My Atlas dashboard layout refinement", () => {
  it("uses one global navigation system plus a slim account anchor rail", () => {
    expect(page).toContain('className="account-jump-links"');
    expect(page).not.toContain('className="account-sidebar"');
    expect(page).not.toContain("Member observatory");
    expect(css).toContain(".account-jump-links");
  });

  it("consolidates identity, plan, status, and management into one command bar", () => {
    expect(page).toContain('className="account-command-bar" id="overview"');
    expect(page).toContain('className="account-command-bar__identity"');
    expect(page).toContain('className="account-command-bar__membership"');
    expect(page).toContain('className="account-command-bar__manage"');
    expect(page).not.toContain('className="account-overview-strip"');
    expect(page).not.toContain('className="account-plan-card"');
  });

  it("renders the account summary as inline text without decorative stat tiles", () => {
    expect(page).toContain('className="account-stats"');
    expect(page).not.toContain("account-stat-icon");
    expect(css).toContain("body:has(.account-dashboard) .account-stats");
    expect(css).toContain("background: transparent");
  });

  it("keeps daily and weekly reading controls collapsed by default", () => {
    expect(page).toContain(
      '<details\n              className="account-reading-card account-reading-card--daily"',
    );
    expect(page).toContain(
      '<details\n              className="account-reading-card account-reading-card--weekly"',
    );
    expect(page).toContain('className="account-reading-card__summary"');
    expect(page).not.toContain("<details open");
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
