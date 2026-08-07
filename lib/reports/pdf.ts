import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

export type PdfReportSection = {
  title: string;
  bottomLine?: string;
  narrative: string;
  bringIntoLife?: string;
  journalingPrompts?: string[];
  reflectionQuestions: string[];
  evidence: string[];
};

export type PdfReport = {
  edition: string;
  title: string;
  introduction: string;
  uncertainty: string[];
  sections: PdfReportSection[];
  closing: string;
  disclaimer?: string;
  evidenceTitle: string;
  evidence: string[];
  generatedAt: string;
  labels?: {
    bottomLine: string;
    bringIntoLife: string;
    journalingPrompts: string;
    questions: string;
  };
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const navy = rgb(0.035, 0.067, 0.115);
const gold = rgb(0.68, 0.52, 0.24);
const ink = rgb(0.09, 0.085, 0.07);
const muted = rgb(0.34, 0.33, 0.29);

function safeText(value: string) {
  return value
    .normalize("NFC")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[^\u0009\u000A\u000D\u0020-\u00FF]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  for (const paragraph of safeText(text).split(/\n+/)) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let line = words.shift()!;
    for (const word of words) {
      const candidate = `${line} ${word}`;
      if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function buildReportPdf(report: PdfReport) {
  const document = await PDFDocument.create();
  const serif = await document.embedFont(StandardFonts.TimesRoman);
  const serifBold = await document.embedFont(StandardFonts.TimesRomanBold);
  const sans = await document.embedFont(StandardFonts.Helvetica);
  const sansBold = await document.embedFont(StandardFonts.HelveticaBold);
  let page!: PDFPage;
  let y = 0;
  let pageNumber = 0;

  const newPage = () => {
    page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pageNumber += 1;
    y = PAGE_HEIGHT - MARGIN;
    page.drawLine({
      start: { x: MARGIN, y: 30 },
      end: { x: PAGE_WIDTH - MARGIN, y: 30 },
      thickness: 0.6,
      color: gold,
    });
    page.drawText(`CELESTIAL ATLAS  /  ${pageNumber}`, {
      x: MARGIN,
      y: 17,
      size: 7,
      font: sansBold,
      color: muted,
    });
  };
  const ensure = (height: number) => {
    if (y - height < 48) newPage();
  };
  const rule = (space = 16) => {
    ensure(space + 2);
    y -= space;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.7,
      color: gold,
    });
    y -= 14;
  };
  const text = (
    value: string,
    options: {
      font?: PDFFont;
      size?: number;
      color?: ReturnType<typeof rgb>;
      indent?: number;
      gap?: number;
    } = {},
  ) => {
    const font = options.font ?? serif;
    const size = options.size ?? 11;
    const indent = options.indent ?? 0;
    const lineHeight = size * 1.48;
    const lines = wrap(value, font, size, CONTENT_WIDTH - indent);
    for (const line of lines) {
      ensure(lineHeight);
      if (line)
        page.drawText(line, {
          x: MARGIN + indent,
          y,
          size,
          font,
          color: options.color ?? ink,
        });
      y -= lineHeight;
    }
    y -= options.gap ?? 7;
  };

  newPage();
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 126,
    width: PAGE_WIDTH,
    height: 126,
    color: navy,
  });
  text(report.edition.toUpperCase(), {
    font: sansBold,
    size: 8,
    color: gold,
    gap: 10,
  });
  text(report.title, {
    font: serifBold,
    size: 27,
    color: rgb(0.96, 0.93, 0.84),
    gap: 28,
  });
  y = PAGE_HEIGHT - 160;
  text(report.introduction, { size: 12, gap: 12 });
  for (const note of report.uncertainty) {
    ensure(48);
    page.drawRectangle({
      x: MARGIN,
      y: y - 30,
      width: CONTENT_WIDTH,
      height: 40,
      color: rgb(0.9, 0.91, 0.92),
    });
    text(note, { font: sans, size: 9, indent: 10, gap: 12 });
  }

  report.sections.forEach((section, index) => {
    ensure(160);
    rule(index === 0 ? 12 : 20);
    text(`SECTION ${String(index + 1).padStart(2, "0")}`, {
      font: sansBold,
      size: 8,
      color: gold,
      gap: 5,
    });
    text(section.title, { font: serifBold, size: 19, gap: 10 });
    if (section.bottomLine) {
      text(report.labels?.bottomLine ?? "BLUF - THE BOTTOM LINE", {
        font: sansBold,
        size: 8,
        color: gold,
        gap: 5,
      });
      text(section.bottomLine, { font: serifBold, size: 12, gap: 12 });
    }
    text(section.narrative, { size: 11, gap: 11 });
    if (section.bringIntoLife) {
      text(report.labels?.bringIntoLife ?? "BRING THIS INTO YOUR LIFE", {
        font: sansBold,
        size: 8,
        color: gold,
        gap: 5,
      });
      text(section.bringIntoLife, { size: 10, gap: 11 });
    }
    if (section.journalingPrompts?.length) {
      text(
        report.labels?.journalingPrompts ?? "WRITING AND JOURNALING PROMPTS",
        {
          font: sansBold,
          size: 8,
          color: gold,
          gap: 5,
        },
      );
      section.journalingPrompts.forEach((prompt, promptIndex) =>
        text(`${promptIndex + 1}. ${prompt}`, { size: 10, indent: 9, gap: 2 }),
      );
      y -= 6;
    }
    if (section.reflectionQuestions.length) {
      text(report.labels?.questions ?? "QUESTIONS TO CARRY FORWARD", {
        font: sansBold,
        size: 8,
        color: gold,
        gap: 5,
      });
      section.reflectionQuestions.forEach((question) =>
        text(`- ${question}`, { size: 10, indent: 9, gap: 2 }),
      );
      y -= 6;
    }
    if (section.evidence.length) {
      text("CHART EVIDENCE", { font: sansBold, size: 8, color: muted, gap: 4 });
      section.evidence.forEach((item) =>
        text(item, { font: sans, size: 8, color: muted, indent: 9, gap: 1 }),
      );
    }
  });

  rule(22);
  text(report.closing, { font: serifBold, size: 13, gap: 12 });
  if (report.disclaimer)
    text(report.disclaimer, { font: sans, size: 8, color: muted });
  if (report.evidence.length) {
    newPage();
    text(report.evidenceTitle.toUpperCase(), {
      font: sansBold,
      size: 8,
      color: gold,
      gap: 8,
    });
    text("Chart factors used", { font: serifBold, size: 22, gap: 16 });
    report.evidence.forEach((item) =>
      text(item, { font: sans, size: 9, indent: 8, gap: 4 }),
    );
  }
  text(`Generated ${safeText(report.generatedAt)}`, {
    font: sans,
    size: 7,
    color: muted,
    gap: 0,
  });
  document.setTitle(safeText(report.title));
  document.setAuthor("Celestial Atlas");
  document.setSubject("Private astrology report");
  document.setCreationDate(new Date());
  return document.save();
}
