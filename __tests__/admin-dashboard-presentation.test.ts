import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const adminPage = readFileSync("app/admin/page.tsx", "utf8");
const themeToggle = readFileSync("components/AdminThemeToggle.tsx", "utf8");
const styles = readFileSync("app/globals.css", "utf8");

describe("admin dashboard presentation", () => {
  it("uses the compact observatory dashboard structure", () => {
    expect(adminPage).toContain("Main dashboard");
    expect(adminPage).toContain("admin-sidebar__brand");
    expect(adminPage).toContain("admin-overview-grid");
    expect(adminPage).toContain("Private report pipeline");
    expect(adminPage).toContain("Recent changes");
  });

  it("defaults to dark and persists an optional light theme", () => {
    expect(themeToggle).toContain('useState<AdminTheme>("dark")');
    expect(themeToggle).toContain("window.localStorage.setItem");
    expect(themeToggle).toContain(
      "document.documentElement.dataset.adminTheme",
    );
    expect(styles).toContain('html[data-admin-theme="light"] .admin-shell');
  });

  it("keeps navigation and theme controls keyboard-sized and focusable", () => {
    expect(styles).toMatch(/\.admin-rail a \{[\s\S]*?min-height: 2\.75rem/);
    expect(styles).toMatch(
      /\.admin-theme-toggle \{[\s\S]*?min-height: 2\.8rem/,
    );
    expect(styles).toContain(".admin-theme-toggle:focus-visible");
  });
});
