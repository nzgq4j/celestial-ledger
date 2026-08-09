import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("app/account/page.tsx", "utf8");
const css = readFileSync("app/globals.css", "utf8");

describe("My Atlas dashboard presentation", () => {
  it("combines daily and weekly guidance under one section heading", () => {
    expect(page).toContain('id="readings"');
    expect(page).toContain('className="account-reading-cards"');
    expect(page.match(/id="daily-reading"/g)).toHaveLength(1);
    expect(page.match(/id="weekly-reading"/g)).toHaveLength(1);
  });

  it("derives and renders report product states in exactly one place", () => {
    expect(page).toContain("deriveAccountReportStates");
    expect(page.match(/reportStates\.map/g)).toHaveLength(1);
    expect(page).not.toContain("readyEntitlements.map");
    expect(page).not.toContain("readyEntitlements.find");
    expect(page).not.toContain('id="purchased-reports"');
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
    expect(css).toContain(".account-reading-cards");
    expect(css).toContain("grid-template-columns: 1fr");
  });
});
