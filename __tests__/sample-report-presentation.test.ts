import { describe, expect, it } from "vitest";
import {
  sampleBriefWordCount,
  sampleReportPresentation,
  type SampleReportKey,
} from "@/lib/sample-reports/presentation";

const reports = Object.keys(sampleReportPresentation) as SampleReportKey[];

describe("sample report presentation", () => {
  it.each(reports)("gives %s a substantive BLUF", (report) => {
    expect(sampleBriefWordCount(report)).toBeGreaterThanOrEqual(400);
    expect(sampleBriefWordCount(report)).toBeLessThanOrEqual(650);
    expect(sampleReportPresentation[report].brief.priorities).toHaveLength(3);
  });

  it.each(reports)("gives %s a complete day meridian", (report) => {
    const phases = sampleReportPresentation[report].dayArc.phases;
    expect(phases.map((phase) => phase.period)).toEqual([
      "morning",
      "noon",
      "evening",
    ]);
    expect(phases.map((phase) => phase.label)).toEqual([
      "Morning",
      "Noon",
      "Evening",
    ]);
    expect(new Set(phases.map((phase) => phase.title)).size).toBe(3);
  });

  it("keeps each edition's practical synthesis distinct", () => {
    const priorityTitles = reports.map((report) =>
      sampleReportPresentation[report].brief.priorities
        .map((item) => item.title)
        .join("|"),
    );
    expect(new Set(priorityTitles).size).toBe(reports.length);
  });
});
