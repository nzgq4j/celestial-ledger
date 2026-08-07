import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const chrome = readFileSync("components/SiteChrome.tsx", "utf8");
const css = readFileSync("app/globals.css", "utf8");

describe("primary navigation grouping", () => {
  it("groups membership, weekly, and samples in the desktop navigation", () => {
    expect(chrome).toContain('className="site-nav-group"');
    expect(chrome).toContain('className="site-nav-group__menu"');
    expect(chrome).toContain('href="/membership"');
    expect(chrome).toContain('href="/weekly-readings"');
    expect(chrome).toContain('href="/samples"');
  });

  it("keeps the same grouping legible in the mobile menu", () => {
    expect(chrome).toContain('className="mobile-nav__group"');
  });

  it("provides visible keyboard focus and a positioned submenu", () => {
    expect(css).toContain(".site-nav-group summary:focus-visible");
    expect(css).toContain(".site-nav-group__menu");
    expect(css).toContain("position: absolute");
  });
});
