import {
  WEEKLY_READING_LEGACY_CONTENT_VERSION,
  type WeeklyReadingAnalysis,
  type WeeklyReadingContent,
} from "./domain";
import { buildReportPdf } from "@/lib/reports/pdf";
import { buildWeeklyReadingContent } from "@/lib/weekly-readings/content";

export function buildWeeklyReadingPdf(input: {
  content: WeeklyReadingContent;
  analysis: WeeklyReadingAnalysis;
  generatedAt: string;
}) {
  const content =
    input.content.schemaVersion === WEEKLY_READING_LEGACY_CONTENT_VERSION
      ? buildWeeklyReadingContent(input.analysis, input.content.readingId)
      : input.content;
  const evidenceMap = new Map(
    input.analysis.evidence.map((item) => [item.id, item.label]),
  );
  const evidenceLabel = (id: string) =>
    evidenceMap.get(id) ?? "Supporting chart factor";
  const days = content.dayByDay.map((day) => {
    const signal = input.analysis.days
      .find((item) => item.readingDate === day.date)
      ?.signals.find((item) => item.theme === day.themeLabel);
    return {
      ...day,
      guidance: day.guidance ??
        signal?.practicalApplications.slice(0, 3) ?? [
          "Notice where this theme is already present.",
          "Choose one proportionate response and review what it changes.",
        ],
      watchFor:
        day.watchFor ??
        signal?.watchFor[0] ??
        "Treating symbolic emphasis as a fixed outcome.",
    };
  });
  return buildReportPdf({
    edition: "Weekly Astrological Reading",
    title: content.header.headline,
    introduction: content.bottomLineUpFront.overview.narrative,
    uncertainty: input.analysis.birthTimeKnown
      ? []
      : [
          "Birth time is unknown; houses, angles, and exact-time claims are excluded.",
        ],
    weeklyRhythm: {
      title: "The rhythm of your next seven days",
      description:
        "The curve shows the relative strength of the reading's leading themes from day to day. It is a reflection map, not a prediction of events.",
      timelineTitle: "Seven-day timeline",
      days: days.map((day) => ({
        label: day.label,
        theme: day.themeLabel,
        strength: day.strength,
      })),
    },
    sections: [
      {
        title: content.bottomLineUpFront.title,
        bottomLine: content.bottomLineUpFront.practicalPriorities
          .map((item) => `${item.dayRange}: ${item.title}`)
          .join("\n"),
        narrative: content.bottomLineUpFront.overview.narrative,
        bringIntoLife: content.bottomLineUpFront.forwardLook.narrative,
        reflectionQuestions: content.reflectiveQuestions,
        evidence:
          content.bottomLineUpFront.overview.evidenceIds.map(evidenceLabel),
      },
      ...days.map((day) => ({
        title: `${day.label} — ${day.themeLabel}`,
        narrative: day.narrative,
        bringIntoLife: `${day.guidance.join("\n")}\n\nWatch for: ${day.watchFor}`,
        reflectionQuestions: [],
        evidence: day.evidenceIds.map(evidenceLabel),
      })),
      ...content.sections.map((section) => ({
        title: section.title,
        narrative: section.narrative,
        bringIntoLife: section.practicalApplications.join("\n"),
        reflectionQuestions: [],
        evidence: section.evidenceIds.map(evidenceLabel),
      })),
    ],
    closing:
      "Carry forward what proves useful in lived experience, with your own judgement primary.",
    disclaimer:
      "Astrology is a symbolic reflective practice, not a scientifically validated prediction.",
    evidenceTitle: "Astrological basis",
    evidence: [...new Set(input.analysis.evidence.map((item) => item.label))],
    generatedAt: input.generatedAt,
    labels: {
      bottomLine: "Weekly priorities",
      bringIntoLife: "Bring this into your week",
      journalingPrompts: "Journal prompts",
      questions: "Reflective questions",
    },
  });
}
