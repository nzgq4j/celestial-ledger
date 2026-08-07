import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("app/account/page.tsx", "utf8");
const css = readFileSync("app/globals.css", "utf8");

describe("My Atlas dashboard presentation", () => {
  it("presents account activity in a dedicated command dashboard", () => {
    expect(page).toContain('className="account-command-bar"');
    expect(page).toContain('className="account-activity-grid"');
    expect(page).toContain('className="account-command-bar__signals"');
    expect(page).toContain("readyEntitlements.length");
  });

  it("uses luminous account-only tokens without changing public pages", () => {
    expect(css).toContain("body:has(.account-dashboard)");
    expect(css).toContain("--atlas-cyan: #20d7e6");
    expect(css).toContain("--atlas-violet: #a25cff");
    expect(css).toContain("--atlas-coral: #ff597e");
  });

  it("retains responsive and keyboard-accessible treatments", () => {
    expect(css).toContain("@media (max-width: 640px)");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("outline: 2px solid var(--atlas-cyan)");
  });
});
