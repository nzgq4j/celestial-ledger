import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) =>
  readFileSync(file, "utf8").replaceAll("\r\n", "\n");
const page = read("app/account/page.tsx");
const today = read("components/account/TodayView.tsx");
const chart = read("components/account/ChartView.tsx");
const navigation = read("components/AccountNavigation.tsx");
const css = read("app/styles/atlas-member.css");

describe("Member screens layout (Celestial Atlas redesign)", () => {
  it("keeps the navigation contract for every member view", () => {
    for (const view of [
      "library",
      "create",
      "charts",
      "membership",
      "settings",
    ])
      expect(page).toContain(`"${view}"`);
    expect(page).toContain('view === "overview" && <TodayView');
    expect(page).toContain("<ChartView");
    expect(page).toContain('className="atlas-shell member-page"');
    expect(page).toContain('import "@/app/styles/atlas-member.css"');
  });

  it("uses the header and tab bar for primary navigation, with a chip row only for account management", () => {
    expect(navigation).toContain('className="member-tabs"');
    expect(navigation).toContain(
      '["settings", "membership", "create"].includes(view)',
    );
    expect(navigation).toContain('aria-current={view === key ? "page"');
    // Legacy hash links still resolve, but never hijack a focused report.
    expect(navigation).toContain('"birth-profiles": "charts"');
    expect(navigation).toContain('.has("focusReport")');
  });

  it("builds Today from a greeting, Big Three chips, the personal reading and a side column", () => {
    expect(today).toContain("<TodayHeading");
    expect(today).toContain('className="member-head__chips"');
    expect(today).toContain("atlas-card atlas-card--feature today-feature");
    expect(today).toContain('className="today-arc"');
    expect(today).toContain("buildDailyReadingDayArc(analysis)");
    expect(today).toContain('className="today-side"');
    expect(today).toContain('className="today-lower"');
  });

  it("gives members without a chart a clear first step", () => {
    expect(today).toContain('href="/#chart"');
    expect(today).toContain("m.noChartAction");
    expect(chart).toContain('href="/#chart"');
  });

  it("lays out the chart as Big Three, wheel beside tabbed data, then interpretation", () => {
    expect(chart).toContain('className="chart-big-three"');
    expect(chart).toContain(
      "<NatalChartWheel chart={chart} details={false} />",
    );
    expect(chart).toContain("<ChartDataTabs");
    expect(chart.indexOf("<NatalChartWheel")).toBeLessThan(
      chart.indexOf('className="atlas-card chart-interpretation"'),
    );
    // Chart switching uses an opaque profile id, never birth data.
    expect(chart).toContain("/account?view=charts&chart=${profile.id}");
  });

  it("collapses to a single column at the 760px breakpoint", () => {
    expect(css).toContain("@media (max-width: 759px)");
    expect(css).toContain("@media (min-width: 760px)");
    expect(css).toMatch(
      /\.today-arc \{\n\s+grid-template-columns: minmax\(0, 1fr\);/,
    );
  });
});
