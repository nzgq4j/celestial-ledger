import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("app/globals.css", "utf8");

describe("site-wide proportion system", () => {
  it("defines shared shell, rhythm, panel, and control tokens", () => {
    expect(css).toContain("--layout-shell: 90rem");
    expect(css).toContain("--layout-reading: 62rem");
    expect(css).toContain("--space-section: clamp(2.75rem, 6vw, 5rem)");
    expect(css).toContain("--control-height: 3rem");
  });

  it("applies the system to all primary user-facing page families", () => {
    for (const pageClass of [
      ".report-collection",
      ".sample-library",
      ".weekly-offer",
      ".method-page",
      ".membership-page",
      ".journal-page",
      ".daily-horoscopes",
      ".horoscope-detail",
      ".contact-page",
      ".sample-daily-reading",
    ]) {
      expect(css).toContain(pageClass);
    }
  });

  it("uses the shared authentication composition on every auth entry page", () => {
    for (const path of [
      "app/auth/login/page.tsx",
      "app/auth/create-account/page.tsx",
      "app/auth/forgot-password/page.tsx",
      "app/auth/update-password/page.tsx",
      "app/auth/check-email/page.tsx",
    ]) {
      expect(readFileSync(path, "utf8")).toContain("auth-page");
    }
  });

  it("provides compact responsive rules for the shared shell", () => {
    expect(css).toContain("@media (max-width: 900px)");
    expect(css).toContain("@media (max-width: 700px)");
    expect(css).toContain("grid-template-columns: 1fr");
  });

  it("lets each hero fill its standardized shell", () => {
    expect(css).toContain("width: 100%");
    expect(css).toContain("max-width: none");
    expect(css).toContain("place-items: center start");
  });
});
