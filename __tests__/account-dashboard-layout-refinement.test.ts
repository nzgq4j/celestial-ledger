import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("app/account/page.tsx", "utf8");
const css = readFileSync("app/globals.css", "utf8");

describe("My Atlas dashboard layout refinement", () => {
  it("keeps member identity in the top-right profile block", () => {
    expect(page.match(/<strong>\{displayName\}<\/strong>/g)).toHaveLength(1);
    expect(
      page.match(/<small>\{authData\.user\.email\}<\/small>/g),
    ).toHaveLength(1);
    expect(page).toContain("Member observatory");
    expect(page).toContain("Your private sky.");
  });

  it("aligns and visually integrates the sidebar", () => {
    expect(css).toContain("Final My Atlas shell overrides");
    expect(css).toContain("align-self: start");
    expect(css).toContain("top: 1rem");
    expect(css).toContain("var(--atlas-cyan)");
  });

  it("backfills dashboard gaps with dense grid placement", () => {
    expect(css).toContain("grid-auto-flow: dense");
  });
});
