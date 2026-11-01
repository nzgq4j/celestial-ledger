import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("app/account/page.tsx", "utf8");
const memberData = readFileSync("lib/account/member-data.ts", "utf8");
const offers = readFileSync("components/account/ReportOffers.tsx", "utf8");
const css = readFileSync("app/styles/atlas-member.css", "utf8");
const atlas = readFileSync("app/atlas.css", "utf8");

describe("Member screens presentation", () => {
  it("keeps daily, weekly and tarot creation as collapsed drawers in the create view", () => {
    expect(page).toContain('id="readings"');
    expect(page.match(/id="daily-reading"/g)).toHaveLength(1);
    expect(page.match(/id="weekly-reading"/g)).toHaveLength(1);
    expect(page).toContain('className="create-card"');
    expect(page).not.toContain("<details open");
  });

  it("derives report states once and renders them through one component", () => {
    expect(memberData).toContain("deriveAccountReportStates");
    expect(memberData.match(/deriveAccountReportStates\(/g)).toHaveLength(1);
    expect(offers.match(/reportTypes\.map/g)).toHaveLength(1);
    expect(page).not.toContain("readyEntitlements.map");
    expect(page).not.toContain("readyEntitlements.find");
  });

  it("builds on the shared Atlas tokens instead of new colours", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).toContain("var(--atlas-card)");
    expect(css).toContain("var(--atlas-gold)");
    expect(atlas).toContain("--atlas-cyan: #4fb7c5");
  });

  it("retains visible keyboard focus and reduced-motion treatments", () => {
    expect(css).toContain(":focus-visible");
    expect(css).toContain("outline: 2px solid var(--atlas-gold)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
