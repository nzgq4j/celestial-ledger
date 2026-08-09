import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { sampleChart } from "@/lib/samples";
import { buildDailyReadingAnalysis } from "@/lib/daily-readings/calculation";
import { buildDailyReadingContent } from "@/lib/daily-readings/content";
import { buildDailyReadingPdf } from "@/lib/daily-readings/pdf";

describe("daily reading PDF", () => {
  it("creates a native PDF from the complete saved reading", async () => {
    const natalChart = await sampleChart();
    const analysis = buildDailyReadingAnalysis({
      natalChart,
      readingDate: "2026-08-05",
      observationTimeZone: natalChart.input.place.timeZone,
      locale: "en-GB",
      calculatedAtUtc: "2026-08-05T08:00:00.000Z",
    });
    const content = buildDailyReadingContent(
      analysis,
      "eb437f1b-5e12-43be-a123-060ec2bf3ce1",
    );
    const bytes = await buildDailyReadingPdf({
      content,
      analysis,
      evidence: analysis.evidence,
      generatedAt: "5 August 2026",
    });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBeGreaterThan(2);
    expect(document.getTitle()).toBe(content.header.headline);
  });

  it("does not use prompt instructions as the PDF title", async () => {
    const natalChart = await sampleChart();
    const analysis = buildDailyReadingAnalysis({
      natalChart,
      readingDate: "2026-08-05",
      observationTimeZone: natalChart.input.place.timeZone,
      locale: "en-GB",
      calculatedAtUtc: "2026-08-05T08:00:00.000Z",
    });
    const content = buildDailyReadingContent(
      analysis,
      "eb437f1b-5e12-43be-a123-060ec2bf3ce1",
    );
    const bytes = await buildDailyReadingPdf({
      content: {
        ...content,
        header: {
          ...content.header,
          headline: "Short, quiet opening with a visible note of restraint",
        },
      },
      analysis,
      evidence: analysis.evidence,
      generatedAt: "5 August 2026",
    });
    const document = await PDFDocument.load(bytes);
    expect(document.getTitle()).toBe("Daily Astrological Reading");
  });
});
