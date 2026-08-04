import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("report generation navigation", () => {
  it("returns to the account report library and focuses the queued report", () => {
    const generator = fs.readFileSync(
      "components/GenerateReportButton.tsx",
      "utf8",
    );
    const library = fs.readFileSync("components/AccountReportList.tsx", "utf8");

    expect(generator).toContain(
      "/account?focusReport=${payload.reportId}#reports",
    );
    expect(generator).not.toContain(
      "router.push(`/reports/${payload.reportId}`)",
    );
    expect(library).toContain("report.scrollIntoView");
    expect(library).toContain("report.focus({ preventScroll: true })");
    expect(library).toContain("setReports(normalizeReports(initialReports))");
  });
});
