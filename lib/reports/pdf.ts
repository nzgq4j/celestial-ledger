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
  visualEvidence?: Array<{
    id: string;
    label: string;
    kind: "placement" | "angle" | "house" | "aspect";
    body1?: string;
    body2?: string;
  }>;
  weeklyRhythm?: {
    title: string;
    description: string;
    timelineTitle: string;
    days: Array<{
      label: string;
      theme: string;
      strength: number;
    }>;
  };
  visualPlacement?: "cover" | "appendix";
  showCoverIntroduction?: boolean;
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

export function sanitizePdfText(value: string) {
  return value
    .normalize("NFC")
    .replace(/\u00A0/g, " ")
    .replace(/\u00B0/g, " deg")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u2022/g, "-")
    .replace(/[^\u0009\u000A\u000D\u0020-\u00FF]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  for (const paragraph of sanitizePdfText(text).split(/\n+/)) {
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

function drawJustifiedTextLine(input: {
  page: PDFPage;
  line: string;
  x: number;
  y: number;
  width: number;
  font: PDFFont;
  size: number;
  color: ReturnType<typeof rgb>;
}) {
  const words = input.line.trim().split(/\s+/).filter(Boolean);
  if (words.length < 3) {
    input.page.drawText(input.line, {
      x: input.x,
      y: input.y,
      size: input.size,
      font: input.font,
      color: input.color,
    });
    return;
  }
  const wordsWidth = words.reduce(
    (total, word) => total + input.font.widthOfTextAtSize(word, input.size),
    0,
  );
  const spaceWidth = (input.width - wordsWidth) / (words.length - 1);
  if (!Number.isFinite(spaceWidth) || spaceWidth <= 0 || spaceWidth > 8) {
    input.page.drawText(input.line, {
      x: input.x,
      y: input.y,
      size: input.size,
      font: input.font,
      color: input.color,
    });
    return;
  }
  let cursorX = input.x;
  words.forEach((word, index) => {
    input.page.drawText(word, {
      x: cursorX,
      y: input.y,
      size: input.size,
      font: input.font,
      color: input.color,
    });
    cursorX += input.font.widthOfTextAtSize(word, input.size);
    if (index < words.length - 1) cursorX += spaceWidth;
  });
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
      lineHeight?: number;
      paragraphGap?: number;
      justify?: boolean;
    } = {},
  ) => {
    const font = options.font ?? serif;
    const size = options.size ?? 11;
    const indent = options.indent ?? 0;
    const lineHeight = options.lineHeight ?? size * 1.48;
    const color = options.color ?? ink;
    const paragraphs = sanitizePdfText(value)
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
      .filter(Boolean);
    paragraphs.forEach((paragraph, paragraphIndex) => {
      const lines = wrap(paragraph, font, size, CONTENT_WIDTH - indent);
      lines.forEach((line, lineIndex) => {
        ensure(lineHeight);
        if (line) {
          const shouldJustify =
            Boolean(options.justify) &&
            lineIndex < lines.length - 1 &&
            font === serif;
          if (shouldJustify)
            drawJustifiedTextLine({
              page,
              line,
              x: MARGIN + indent,
              y,
              width: CONTENT_WIDTH - indent,
              font,
              size,
              color,
            });
          else
            page.drawText(line, {
              x: MARGIN + indent,
              y,
              size,
              font,
              color,
            });
        }
        y -= lineHeight;
      });
      if (paragraphIndex < paragraphs.length - 1)
        y -= options.paragraphGap ?? size * 0.55;
    });
    y -= options.gap ?? 7;
  };

  const drawEvidenceConstellation = (options: { newPage?: boolean } = {}) => {
    const visual = report.visualEvidence ?? [];
    const nodes = visual
      .filter((item) => item.kind === "placement" || item.kind === "angle")
      .slice(0, 14);
    if (!nodes.length) return;
    if (options.newPage ?? true) newPage();
    text(report.evidenceTitle.toUpperCase(), {
      font: sansBold,
      size: 8,
      color: gold,
      gap: 6,
    });
    text("The chart behind this reading", {
      font: serifBold,
      size: 22,
      gap: 7,
    });
    text(
      "A visual index of the immutable placements and aspects referenced in this report.",
      { font: sans, size: 9, color: muted, gap: 18 },
    );

    const centreX = PAGE_WIDTH / 2;
    const centreY = options.newPage === false ? y - 112 : 470;
    const radius = options.newPage === false ? 96 : 176;
    const positions = new Map<
      string,
      { x: number; y: number; label: string }
    >();
    nodes.forEach((node, index) => {
      const angle = Math.PI / 2 - (index / nodes.length) * Math.PI * 2;
      positions.set(node.id, {
        x: centreX + Math.cos(angle) * radius,
        y: centreY + Math.sin(angle) * radius,
        label: node.label,
      });
    });

    const byBody = new Map<string, { x: number; y: number }>();
    for (const node of nodes) {
      const position = positions.get(node.id)!;
      const body = node.id.startsWith("placement:")
        ? node.id.slice("placement:".length).replaceAll("-", " ")
        : undefined;
      if (body) byBody.set(body.toLowerCase(), position);
    }
    visual
      .filter((item) => item.kind === "aspect" && item.body1 && item.body2)
      .forEach((aspect) => {
        const from = byBody.get(aspect.body1!.toLowerCase());
        const to = byBody.get(aspect.body2!.toLowerCase());
        if (!from || !to) return;
        page.drawLine({
          start: from,
          end: to,
          thickness: 0.65,
          color: rgb(0.64, 0.7, 0.78),
          opacity: 0.48,
        });
      });

    page.drawCircle({
      x: centreX,
      y: centreY,
      size: radius + 18,
      borderColor: gold,
      borderWidth: 0.8,
      opacity: 0.55,
    });
    page.drawCircle({
      x: centreX,
      y: centreY,
      size: 42,
      borderColor: gold,
      borderWidth: 1,
    });
    page.drawText("CA", {
      x: centreX - 11,
      y: centreY - 5,
      size: 14,
      font: serifBold,
      color: gold,
    });
    positions.forEach((position) => {
      page.drawCircle({
        x: position.x,
        y: position.y,
        size: 5.5,
        color: navy,
        borderColor: gold,
        borderWidth: 1.2,
      });
      const label = sanitizePdfText(position.label);
      const shortLabel = label.length > 30 ? `${label.slice(0, 27)}...` : label;
      const labelWidth = sans.widthOfTextAtSize(shortLabel, 7.2);
      page.drawText(shortLabel, {
        x: Math.max(
          MARGIN,
          Math.min(
            PAGE_WIDTH - MARGIN - labelWidth,
            position.x - labelWidth / 2,
          ),
        ),
        y: position.y + (position.y >= centreY ? 11 : -17),
        size: 7.2,
        font: sans,
        color: ink,
      });
    });
    y = centreY - radius - 38;
    text(
      "Gold nodes mark placements or chart angles. Fine connecting lines mark calculated aspects between the bodies shown; no relationship is inferred beyond the recorded chart evidence.",
      { font: sans, size: 8, color: muted, gap: 0 },
    );
  };

  const drawWeeklyRhythmChart = () => {
    const rhythm = report.weeklyRhythm;
    if (!rhythm?.days.length) return;
    text("SEVEN-DAY MAP", {
      font: sansBold,
      size: 8,
      color: gold,
      gap: 6,
    });
    text(rhythm.title, { font: serifBold, size: 22, gap: 7 });
    text(rhythm.description, { font: sans, size: 9, color: muted, gap: 18 });

    const chartLeft = MARGIN + 18;
    const chartRight = PAGE_WIDTH - MARGIN - 18;
    const chartTop = y;
    const chartBottom = y - 142;
    [0, 0.5, 1].forEach((level) => {
      const lineY = chartBottom + (chartTop - chartBottom) * level;
      page.drawLine({
        start: { x: chartLeft, y: lineY },
        end: { x: chartRight, y: lineY },
        thickness: 0.45,
        color: rgb(0.78, 0.79, 0.77),
      });
    });
    const points = rhythm.days.map((day, index) => ({
      x:
        chartLeft +
        ((chartRight - chartLeft) * index) /
          Math.max(1, rhythm.days.length - 1),
      y:
        chartBottom +
        (chartTop - chartBottom) * Math.max(0, Math.min(1, day.strength)),
      day,
    }));
    points.forEach((point, index) => {
      const next = points[index + 1];
      if (next)
        page.drawLine({
          start: point,
          end: next,
          thickness: 2,
          color: gold,
        });
      page.drawCircle({
        x: point.x,
        y: point.y,
        size: 4.5,
        color: navy,
        borderColor: gold,
        borderWidth: 1.4,
      });
      const shortDay = sanitizePdfText(
        point.day.label.split(/\s+/)[0].slice(0, 3),
      );
      const labelWidth = sansBold.widthOfTextAtSize(shortDay, 7);
      page.drawText(shortDay, {
        x: point.x - labelWidth / 2,
        y: chartBottom - 16,
        size: 7,
        font: sansBold,
        color: ink,
      });
      const value = `${Math.round(point.day.strength * 100)}`;
      const valueWidth = sans.widthOfTextAtSize(value, 6.5);
      page.drawText(value, {
        x: point.x - valueWidth / 2,
        y: chartBottom - 27,
        size: 6.5,
        font: sans,
        color: muted,
      });
    });
    y = chartBottom - 54;
    text("0-100 shows relative emphasis within this reading only.", {
      font: sans,
      size: 7,
      color: muted,
      gap: 15,
    });
  };

  const drawWeeklyTimeline = () => {
    const rhythm = report.weeklyRhythm;
    if (!rhythm?.days.length) return;
    newPage();
    text(rhythm.timelineTitle.toUpperCase(), {
      font: sansBold,
      size: 8,
      color: gold,
      gap: 8,
    });
    rhythm.days.forEach((day, index) => {
      ensure(36);
      const nodeY = y - 2;
      if (index < rhythm.days.length - 1)
        page.drawLine({
          start: { x: MARGIN + 5, y: nodeY - 4 },
          end: { x: MARGIN + 5, y: nodeY - 31 },
          thickness: 0.8,
          color: gold,
        });
      page.drawCircle({
        x: MARGIN + 5,
        y: nodeY,
        size: 3.2,
        color: gold,
      });
      text(`${day.label}  /  ${day.theme}`, {
        font: index === 0 ? sansBold : sans,
        size: 9,
        indent: 17,
        gap: 4,
      });
    });
  };

  newPage();
  let coverTitleSize = 27;
  let coverTitleLines = wrap(
    report.title,
    serifBold,
    coverTitleSize,
    CONTENT_WIDTH,
  );
  while (coverTitleLines.length > 4 && coverTitleSize > 20) {
    coverTitleSize -= 1;
    coverTitleLines = wrap(
      report.title,
      serifBold,
      coverTitleSize,
      CONTENT_WIDTH,
    );
  }
  const coverTitleLineHeight = coverTitleSize * 1.18;
  const coverHeaderHeight = Math.max(
    126,
    MARGIN + 22 + coverTitleLines.length * coverTitleLineHeight + 20,
  );
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - coverHeaderHeight,
    width: PAGE_WIDTH,
    height: coverHeaderHeight,
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
    size: coverTitleSize,
    color: rgb(0.96, 0.93, 0.84),
    lineHeight: coverTitleLineHeight,
    gap: 0,
  });
  y = PAGE_HEIGHT - coverHeaderHeight - 22;
  if (report.weeklyRhythm) drawWeeklyRhythmChart();
  else if (report.visualPlacement === "cover")
    drawEvidenceConstellation({ newPage: false });
  if (report.showCoverIntroduction ?? true)
    text(report.introduction, { size: 12, gap: 12, justify: true });
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
  const disclaimerOnCover = Boolean(report.weeklyRhythm && report.disclaimer);
  if (disclaimerOnCover)
    text(report.disclaimer!, { font: sans, size: 8, color: muted, gap: 0 });

  drawWeeklyTimeline();

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
    text(section.narrative, { size: 11, gap: 11, justify: true });
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
  if (report.disclaimer && !disclaimerOnCover)
    text(report.disclaimer, { font: sans, size: 8, color: muted });
  if (report.visualPlacement !== "cover") drawEvidenceConstellation();
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
  text(`Generated ${sanitizePdfText(report.generatedAt)}`, {
    font: sans,
    size: 7,
    color: muted,
    gap: 0,
  });
  document.setTitle(sanitizePdfText(report.title));
  document.setAuthor("Celestial Atlas");
  document.setSubject("Private astrology report");
  document.setCreationDate(new Date());
  return document.save();
}
