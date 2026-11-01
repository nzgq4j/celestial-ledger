import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveHeaderDisplayName } from "@/lib/auth/header-identity";

const chrome = readFileSync("components/SiteChrome.tsx", "utf8");
const header = chrome.split("export function SiteFooter")[0];
const layout = readFileSync("app/layout.tsx", "utf8");
const identity = readFileSync("lib/auth/header-identity.ts", "utf8");
const actions = readFileSync("app/auth/actions.ts", "utf8");

describe("header identity menu", () => {
  it("resolves identity and app platform in the request-bound root layout", () => {
    expect(layout).toContain("getHeaderIdentity()");
    expect(layout).toContain("getAppPlatform()");
    expect(layout).toContain("identity={identity}");
    expect(layout).toContain("tarotEnabled={tarotReadingFlags().enabled}");
    expect(resolveHeaderDisplayName("  David  ", "member@example.com")).toBe(
      "David",
    );
    expect(resolveHeaderDisplayName(null, "member@example.com")).toBe("member");
  });

  it("shows the membership plan beside the avatar", () => {
    expect(identity).toContain("plan: membershipPlanFor(planKey)");
    expect(header).toContain("data-plan={identity.plan}");
    expect(header).toContain('identity.plan === "atlas"');
  });

  it("renders explicit signed-out and signed-in paths", () => {
    expect(header).toContain("{identity ? (");
    expect(header).toContain('href="/auth/login"');
    expect(header).toContain('href="/account?view=settings"');
    expect(header).toContain('href="/account?view=membership"');
    expect(header).toContain('href="/#chart"');
  });

  it("uses the existing sign-out server action", () => {
    expect(header.match(/<form action=\{signOut\}>/g)).toHaveLength(1);
    expect(actions).toContain("await supabase.auth.signOut()");
    expect(actions).toContain('redirect("/")');
  });

  it("closes menus after selection, navigation or focus exit", () => {
    expect(header).toContain("ref={identityMenu}");
    expect(header).toContain(
      "onClick={() => closeDetails(identityMenu.current)}",
    );
    expect(header).toContain("closeDetails(identityMenu.current);");
    expect(header).toContain("}, [pathname]);");
  });
});
