import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const chrome = readFileSync("components/SiteChrome.tsx", "utf8");
const css = readFileSync("app/atlas.css", "utf8");
const header = chrome.split("export function SiteFooter")[0];

describe("primary navigation (Celestial Atlas redesign)", () => {
  it("offers the five app destinations to members and four visitor destinations", () => {
    const member = header.split(": [")[0];
    for (const href of [
      'href: "/account"',
      'href: "/horoscopes"',
      'href: "/numbers"',
      'href: "/tarot"',
      'href: "/account?view=library"',
    ])
      expect(member).toContain(href);
    expect(header).toContain('href: "/membership"');
    // My chart and Reports stay one tap away in the account menu.
    expect(header).toContain('<Link href="/account?view=charts">');
    expect(header).toContain('<Link href="/reports">');
  });

  it("uses the app tabs Today, Stars, Numbers, Tarot and Journal", () => {
    const tabBar = chrome.split("export function AppTabBar")[1];
    for (const key of ["today", "stars", "numbers", "tarot", "journal"])
      expect(tabBar).toContain(`key: "${key}"`);
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
    // The app top bar's avatar opens account settings.
    expect(chrome).toContain("export function AppTopBar");
    expect(chrome).toContain(
      'href={identity ? "/account?view=settings" : "/auth/login"}',
    );
    expect(chrome).toContain("data-app-only");
  });
});
