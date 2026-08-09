import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const accountPage = readFileSync("app/account/page.tsx", "utf8");
const generator = readFileSync("components/GenerateReportButton.tsx", "utf8");
const checkout = readFileSync("components/CheckoutButton.tsx", "utf8");
const reportRoute = readFileSync("app/api/reports/route.ts", "utf8");
const accountActions = [
  "components/AccountSettings.tsx",
  "components/BirthProfileList.tsx",
  "components/DailyReadingGenerator.tsx",
  "components/WeeklyReadingGenerator.tsx",
].map((file) => readFileSync(file, "utf8"));
const locales = ["en-GB", "es-ES", "fr-FR", "de-DE"].map((locale) =>
  readFileSync(`lib/i18n/locales/${locale}.ts`, "utf8"),
);

describe("account report interface", () => {
  it("lets the parent choose exactly one primary report action", () => {
    expect(accountPage).toContain("primaryAccountReportAction(reportStates)");
    expect(accountPage).toContain("primaryReportType === reportType");
    expect(accountPage).toContain("emphasis={emphasis}");
    expect(generator).toContain('emphasis?: "primary" | "secondary"');
    expect(checkout).toContain('emphasis?: "primary" | "secondary"');
    expect(generator).toContain('emphasis === "primary"');
  });

  it("demotes unrelated account actions while a report action is primary", () => {
    expect(accountPage).toContain(
      'primaryReportType ? "button-secondary" : "button-primary"',
    );
    for (const component of accountActions) {
      expect(component).not.toContain('className="button-primary"');
      expect(component).toContain('className="button-secondary"');
    }
  });

  it("renders exclusive report drawers collapsed by default", () => {
    expect(generator).toContain("<details");
    expect(generator).toContain('name="account-report-generator"');
    expect(generator).toContain("<summary");
    expect(generator).not.toMatch(/<details[^>]*\sopen(?:=|\s|>)/);
  });

  it("shows a selector only when more than one profile can be selected", () => {
    expect(generator).toContain("profiles.length > 1");
    expect(generator).toContain("profiles.length === 1");
    expect(generator).toContain("copy.usingProfile");
    expect(generator).toContain("<select");
  });

  it("uses compact accessible theme chips while retaining descriptions", () => {
    expect(generator).toContain('className="report-theme-selector__chips"');
    expect(generator).toContain('className="report-theme-chip"');
    expect(generator).toContain("title={themeCopy[theme.id][1]}");
    expect(generator).toContain("title={careerThemeCopy[theme.id][1]}");
    expect(generator).toContain("aria-describedby={detailId}");
    expect(generator).not.toContain("recovery-compass__themes");
  });

  it("does not require or transmit an age confirmation", () => {
    expect(generator).not.toContain("adultConfirmed");
    expect(generator).not.toContain("adultConfirmation");
    expect(reportRoute).not.toContain("adultConfirmed");
    expect(reportRoute).not.toContain("adult_confirmed_at");
    for (const locale of locales)
      expect(locale).not.toContain("adultConfirmation");
  });

  it("keeps recovery generation gated only by a selected reflection theme", () => {
    expect(generator).toContain("(isRecovery && themes.length === 0)");
    expect(reportRoute).toContain(
      "isRecovery && !input.recoveryThemes?.length",
    );
    expect(reportRoute).toContain("Choose at least one reflection theme.");
  });
});
