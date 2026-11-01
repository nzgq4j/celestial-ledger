import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const chrome = readFileSync("components/SiteChrome.tsx", "utf8");
const css = readFileSync("app/atlas.css", "utf8");
const header = chrome.split("export function SiteFooter")[0];

describe("primary navigation (Celestial Atlas redesign)", () => {
  it("offers five member destinations and four visitor destinations", () => {
    const member = header.split(": [")[0];
    for (const href of [
      'href: "/account"',
      'href: "/account?view=charts"',
      'href: "/horoscopes"',
      'href: "/tarot"',
      'href: "/reports"',
    ])
      expect(member).toContain(href);
    expect(header).toContain('href: "/membership"');
  });

  it("keeps tarot behind its release flag and without beta labels", () => {
    expect(header).toContain('tarotEnabled || item.key !== "tarot"');
    expect(chrome).not.toContain("(Beta)");
  });

  it("marks the current destination for assistive technology", () => {
    expect(chrome).toContain('aria-current={active === item.key ? "page"');
    expect(css).toContain('.atlas-nav__link[aria-current="page"]');
  });

  it("replaces the top menu with a bottom tab bar on narrow screens", () => {
    expect(css).toContain("@media (max-width: 759px)");
    expect(css).toContain("html[data-signed-in] .atlas-tabbar");
    expect(css).toContain("env(safe-area-inset-bottom)");
  });

  it("hides web chrome and always shows tabs inside the Android app", () => {
    expect(chrome.match(/data-app-hidden/g)?.length).toBeGreaterThanOrEqual(2);
    expect(css).toContain("html[data-app] [data-app-hidden]");
    expect(css).toContain("html[data-app] .atlas-tabbar");
    expect(chrome).toContain('href: identity ? "/account?view=settings"');
  });
});
