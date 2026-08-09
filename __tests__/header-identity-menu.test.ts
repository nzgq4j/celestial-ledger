import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveHeaderDisplayName } from "@/lib/auth/header-identity";

const chrome = readFileSync("components/SiteChrome.tsx", "utf8");
const header = chrome.split("export function SiteFooter")[0];
const layout = readFileSync("app/layout.tsx", "utf8");
const account = readFileSync("app/account/page.tsx", "utf8");
const accountSettings = readFileSync("components/AccountSettings.tsx", "utf8");
const actions = readFileSync("app/auth/actions.ts", "utf8");

describe("header identity menu", () => {
  it("resolves identity in the request-bound root layout", () => {
    expect(layout).toContain("getHeaderIdentity()");
    expect(layout).toContain("identity={identity}");
    expect(layout).toContain("tarotEnabled={tarotReadingFlags().enabled}");
    expect(resolveHeaderDisplayName("  David  ", "member@example.com")).toBe(
      "David",
    );
    expect(resolveHeaderDisplayName(null, "member@example.com")).toBe("member");
  });

  it("renders explicit signed-out and signed-in paths on desktop and mobile", () => {
    expect(header.match(/identity \?/g)).toHaveLength(2);
    expect(header.match(/href="\/auth\/login"/g)).toHaveLength(2);
    expect(header.match(/href="\/account#account-settings"/g)).toHaveLength(2);
    expect(header.match(/href="\/account#billing"/g)).toHaveLength(2);
    expect(header).toContain('className="site-nav-group site-nav-identity"');
    expect(header).toContain(
      'className="mobile-nav__group mobile-nav__identity"',
    );
  });

  it("uses the existing sign-out server action in both menus", () => {
    expect(header.match(/<form action=\{signOut\}>/g)).toHaveLength(2);
    expect(actions).toContain("await supabase.auth.signOut()");
    expect(actions).toContain('redirect("/")');
  });

  it("keeps the relocated billing and settings anchors available", () => {
    expect(account).toContain(
      'className="account-command-bar__membership" id="billing"',
    );
    expect(accountSettings).toContain('id="account-settings"');
  });
});
