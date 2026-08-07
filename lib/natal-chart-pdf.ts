import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type { NatalChart } from "@/lib/types";

const WIDTH = 595.28;
const HEIGHT = 841.89;
const MARGIN = 54;
const CONTENT = WIDTH - MARGIN * 2;
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

function wrap(value: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  for (const paragraph of safeText(value).split(/\n+/)) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
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

export async function buildNatalChartPdf(input: {
  title: string;
  displayName: string;
  chart: NatalChart;
  interpretation?: string | null;
  generatedAt?: string | null;
}) {
  const document = await PDFDocument.create();
  const serif = await document.embedFont(StandardFonts.TimesRoman);
  const serifBold = await document.embedFont(StandardFonts.TimesRomanBold);
  const sans = await document.embedFont(StandardFonts.Helvetica);
  const sansBold = await document.embedFont(StandardFonts.HelveticaBold);
  let page!: PDFPage;
  let pageNumber = 0;
  let y = 0;

  const newPage = () => {
    page = document.addPage([WIDTH, HEIGHT]);
    pageNumber += 1;
    y = HEIGHT - MARGIN;
    page.drawLine({
      start: { x: MARGIN, y: 30 },
      end: { x: WIDTH - MARGIN, y: 30 },
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
  const text = (
    value: string,
    options: {
      font?: PDFFont;
      size?: number;
      color?: ReturnType<typeof rgb>;
      gap?: number;
      indent?: number;
    } = {},
  ) => {
    const font = options.font ?? serif;
    const size = options.size ?? 11;
    const indent = options.indent ?? 0;
    const lineHeight = size * 1.48;
    for (const line of wrap(value, font, size, CONTENT - indent)) {
      ensure(lineHeight);
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
  const heading = (value: string) => {
    ensure(60);
    y -= 12;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: WIDTH - MARGIN, y },
      thickness: 0.7,
      color: gold,
    });
    y -= 20;
    text(value, { font: serifBold, size: 19, gap: 10 });
  };

  newPage();
  page.drawRectangle({
    x: 0,
    y: HEIGHT - 154,
    width: WIDTH,
    height: 154,
    color: navy,
  });
  text("PRIVATE NATAL CHART", {
    font: sansBold,
    size: 8,
    color: gold,
    gap: 10,
  });
  text(input.title, {
    font: serifBold,
    size: 28,
    color: rgb(0.96, 0.93, 0.84),
    gap: 8,
  });
  text(input.displayName, {
    font: sans,
    size: 10,
    color: rgb(0.86, 0.83, 0.76),
    gap: 0,
  });
  y = HEIGHT - 184;
  text(
    input.chart.timeKnown
      ? `Recorded birth time / ${input.chart.utc}`
      : "Birth time unknown / houses and angles intentionally omitted",
    { font: sans, size: 9, color: muted, gap: 14 },
  );

  heading("Primary ephemeris positions");
  for (const placement of input.chart.placements) {
    text(
      `${placement.name}: ${placement.sign} ${placement.degree} deg ${String(placement.minute).padStart(2, "0")} min / ${placement.retrograde ? "Retrograde" : "Direct"}${placement.house ? ` / House ${placement.house}` : ""}`,
      { font: sans, size: 9, gap: 3 },
    );
  }

  if (input.chart.aspects.length) {
    heading("Major aspects");
    for (const aspect of input.chart.aspects) {
      text(
        `${aspect.body1} ${aspect.type.toLowerCase()} ${aspect.body2} / orb ${aspect.orb.toFixed(2)} deg`,
        { font: sans, size: 9, gap: 3 },
      );
    }
  }

  if (input.interpretation?.trim()) {
    newPage();
    text("SAVED NATAL READING", {
      font: sansBold,
      size: 8,
      color: gold,
      gap: 8,
    });
    text("Full natal interpretation", {
      font: serifBold,
      size: 25,
      gap: 18,
    });
    const normalized = input.interpretation
      .replace(/\r\n/g, "\n")
      .replace(/\s+(?=(?:#{1,3}\s*)?\d{1,2}\.\s+[A-Z])/g, "\n")
      .trim();
    const sections = normalized
      .split(/\n(?=(?:#{1,3}\s*)?\d{1,2}\.\s+)/)
      .filter(Boolean);
    for (const [index, section] of sections.entries()) {
      const lines = section.trim().split("\n");
      const first = lines.shift() ?? "Chart interpretation";
      const title = first
        .replace(/^#{1,3}\s*/, "")
        .replace(/^\d{1,2}\.\s*/, "");
      const body =
        lines.join("\n").trim() || (sections.length === 1 ? normalized : "");
      ensure(90);
      text(`CHAPTER ${String(index + 1).padStart(2, "0")}`, {
        font: sansBold,
        size: 8,
        color: gold,
        gap: 5,
      });
      text(title, { font: serifBold, size: 18, gap: 10 });
      for (const paragraph of body.split(/\n\s*\n+/).filter(Boolean)) {
        text(paragraph.replace(/^#{1,3}\s*/, "").trim(), { size: 11, gap: 9 });
      }
    }
  }

  text(
    `Calculation: ${input.chart.calculation.ephemeris}; ${input.chart.calculation.zodiac}; ${input.chart.calculation.houseSystem}; version ${input.chart.calculation.calculationVersion}`,
    { font: sans, size: 7, color: muted, gap: 2 },
  );
  if (input.generatedAt)
    text(`Interpretation generated ${input.generatedAt}`, {
      font: sans,
      size: 7,
      color: muted,
      gap: 0,
    });
  document.setTitle(safeText(input.title));
  document.setAuthor("Celestial Atlas");
  document.setSubject("Private natal chart and interpretation");
  document.setCreationDate(new Date());
  return document.save();
}
