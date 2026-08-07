import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildReportPdf } from "@/lib/reports/pdf";

describe("private report PDF", () => {
  it("builds a readable multi-section PDF document", async () => {
    const bytes = await buildReportPdf({
      edition: "Recovery Reflection - private edition",
      title: "A private celestial reading",
      introduction: "An introduction grounded in the supplied chart evidence.",
      uncertainty: ["Birth time is unknown; houses and angles are excluded."],
      sections: Array.from({ length: 4 }, (_, index) => ({
        title: `Section ${index + 1}`,
        narrative: "A complete narrative paragraph. ".repeat(55),
        reflectionQuestions: ["What deserves attention now?"],
        evidence: [`placement:test-${index + 1} - Example chart factor`],
      })),
      closing: "A final reflection.",
      evidenceTitle: "Evidence constellation",
      evidence: ["placement:test - Example chart factor"],
      generatedAt: "7 August 2026",
    });
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe("%PDF-");
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBeGreaterThan(1);
    expect(document.getTitle()).toBe("A private celestial reading");
  });
});
