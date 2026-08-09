import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { sampleChart } from "@/lib/samples";
import { buildWeeklyReadingAnalysis } from "@/lib/weekly-readings/calculation";
import { buildWeeklyReadingContent } from "@/lib/weekly-readings/content";
import { buildWeeklyReadingPdf } from "@/lib/weekly-readings/pdf";

describe("weekly reading PDF", () => {
  it("creates a native PDF with the complete weekly brief", async () => {
    const natalChart = await sampleChart();
    const analysis = buildWeeklyReadingAnalysis({
      natalChart,
      readingStartDate: "2026-08-09",
      observationTimeZone: natalChart.input.place.timeZone,
      locale: "en-GB",
    });
    const content = buildWeeklyReadingContent(
      analysis,
      "6633769d-7fba-49a6-9531-f2bc47735518",
    );
    const bytes = await buildWeeklyReadingPdf({
      content,
      analysis,
      generatedAt: "8 August 2026",
    });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBeGreaterThan(2);
    expect(document.getTitle()).toBe(content.header.headline);
  });
});
