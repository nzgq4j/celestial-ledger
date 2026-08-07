import { z } from "zod";
import type { BirthInput, NatalChart } from "@/lib/types";
import { calculateNatalChart } from "@/lib/chart";
import type { LocaleTag } from "@/lib/i18n/config";
import { reportLanguageInstruction } from "@/lib/reports/language";

export const CAREER_SCHEMA_VERSION = "career-5";
export const CAREER_PROMPT_VERSION = "career-6";
export const CAREER_SAFETY_VERSION = "reflection-1";

export const careerThemeSchema = z.enum([
  "direction_purpose",
  "strengths_talents",
  "leadership_visibility",
  "work_environment",
  "growth_change",
  "value_compensation",
]);
export type CareerTheme = z.infer<typeof careerThemeSchema>;

export const careerThemes = [
  {
    id: "direction_purpose",
    label: "Direction & purpose",
    detail: "Meaning, contribution and the work worth pursuing",
  },
  {
    id: "strengths_talents",
    label: "Strengths & talents",
    detail: "Natural abilities and skills worth developing",
  },
  {
    id: "leadership_visibility",
    label: "Leadership & visibility",
    detail: "Authority, recognition and how you take the lead",
  },
  {
    id: "work_environment",
    label: "Work environment",
    detail: "Conditions, culture and rhythms that support your best work",
  },
  {
    id: "growth_change",
    label: "Growth & change",
    detail: "Career transitions, learning and reinvention",
  },
  {
    id: "value_compensation",
    label: "Value & compensation",
    detail: "How you define worth, exchange and sustainable reward",
  },
] as const satisfies readonly {
  id: CareerTheme;
  label: string;
  detail: string;
}[];

const evidenceReference = z.string().regex(/^(placement|angle|house|aspect):/);
const sectionSchema = z
  .object({
    title: z.string().min(1).max(100),
    // Optional when reading career-1 reports; career-2 generation requires it.
    theme: careerThemeSchema.optional(),
    bottomLine: z.string().min(1).max(1200).optional(),
    narrative: z.string().min(1).max(9000),
    bringIntoLife: z.string().min(1).max(2400).optional(),
    evidenceIds: z.array(evidenceReference).min(1).max(8),
    reflectionQuestions: z.array(z.string().min(1).max(240)).max(3),
    journalingPrompts: z
      .array(z.string().min(1).max(320))
      .min(3)
      .max(5)
      .optional(),
  })
  .strict();

export const careerReportSchema = z
  .object({
    title: z.string().min(1).max(120),
    introduction: z.string().min(1).max(1200),
    sections: z.array(sectionSchema).min(1).max(6),
    closing: z.string().min(1).max(1000),
    disclaimer: z.string().min(1).max(400),
  })
  .strict();
export type CareerReport = z.infer<typeof careerReportSchema>;

export const careerReportJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "introduction", "sections", "closing", "disclaimer"],
  properties: {
    title: { type: "string", minLength: 1, maxLength: 120 },
    introduction: { type: "string", minLength: 1, maxLength: 1200 },
    sections: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "theme",
          "bottomLine",
          "narrative",
          "bringIntoLife",
          "evidenceIds",
          "reflectionQuestions",
          "journalingPrompts",
        ],
        properties: {
          title: { type: "string", minLength: 1, maxLength: 100 },
          theme: { type: "string", enum: careerThemeSchema.options },
          bottomLine: { type: "string", minLength: 1, maxLength: 1200 },
          narrative: { type: "string", minLength: 3000, maxLength: 9000 },
          bringIntoLife: { type: "string", minLength: 1, maxLength: 2400 },
          evidenceIds: {
            type: "array",
            minItems: 1,
            maxItems: 8,
            items: { type: "string", minLength: 1, maxLength: 240 },
          },
          reflectionQuestions: {
            type: "array",
            maxItems: 3,
            items: { type: "string", minLength: 1, maxLength: 240 },
          },
          journalingPrompts: {
            type: "array",
            minItems: 3,
            maxItems: 5,
            items: { type: "string", minLength: 1, maxLength: 320 },
          },
        },
      },
    },
    closing: { type: "string", minLength: 1, maxLength: 1000 },
    disclaimer: { type: "string", minLength: 1, maxLength: 400 },
  },
} as const;

export type CareerEvidenceItem = {
  id: string;
  kind: "placement" | "angle" | "house" | "aspect";
  label: string;
  data: Record<string, string | number | boolean>;
};
export type CareerEvidenceBundle = {
  version: "career-evidence-1";
  timeKnown: boolean;
  uncertainty: string[];
  provenance: NatalChart["calculation"] & { utc: string; timezone: string };
  items: CareerEvidenceItem[];
};

export async function buildCareerEvidence(input: BirthInput) {
  const chart = await calculateNatalChart(input);
  const items: CareerEvidenceItem[] = chart.placements.map((p) => ({
    id: `placement:${p.name.toLowerCase().replaceAll(" ", "-")}`,
    kind: "placement",
    label: `${p.name} in ${p.sign}`,
    data: {
      body: p.name,
      longitude: p.longitude,
      sign: p.sign,
      degree: p.degree,
      minute: p.minute,
      retrograde: p.retrograde,
      ...(p.house ? { house: p.house } : {}),
    },
  }));
  if (chart.ascendant)
    items.push({
      id: "angle:ascendant",
      kind: "angle",
      label: `Ascendant in ${chart.ascendant.sign}`,
      data: {
        longitude: chart.ascendant.longitude,
        sign: chart.ascendant.sign,
      },
    });
  if (chart.midheaven)
    items.push({
      id: "angle:midheaven",
      kind: "angle",
      label: `Midheaven in ${chart.midheaven.sign}`,
      data: {
        longitude: chart.midheaven.longitude,
        sign: chart.midheaven.sign,
      },
    });
  for (const house of chart.houses)
    items.push({
      id: `house:${house.house}`,
      kind: "house",
      label: `House ${house.house} begins in ${house.sign}`,
      data: {
        house: house.house,
        longitude: house.longitude,
        sign: house.sign,
      },
    });
  for (const [index, aspect] of chart.aspects.entries())
    items.push({
      id: `aspect:${index + 1}`,
      kind: "aspect",
      label: `${aspect.body1} ${aspect.type} ${aspect.body2}`,
      data: {
        body1: aspect.body1,
        body2: aspect.body2,
        aspect: aspect.type,
        angle: aspect.angle,
        orb: aspect.orb,
      },
    });
  const evidence: CareerEvidenceBundle = {
    version: "career-evidence-1",
    timeKnown: chart.timeKnown,
    uncertainty: chart.timeKnown
      ? []
      : [
          "Birth time is unknown; houses, angles, and exact-time claims are excluded.",
        ],
    provenance: {
      ...chart.calculation,
      utc: chart.utc,
      timezone: chart.input.place.timeZone,
    },
    items,
  };
  return { chart, evidence };
}

export function careerPrompt(
  evidence: CareerEvidenceBundle,
  themes: CareerTheme[],
  locale: LocaleTag = "en-GB",
) {
  const selectedThemes = careerThemes
    .filter((theme) => themes.includes(theme.id))
    .map((theme) => `${theme.id}: ${theme.label} — ${theme.detail}`);
  return `Write a Career and Purpose reflection using only the immutable evidence bundle below.

Rules:
${reportLanguageInstruction(locale)}
- Astrology is symbolic reflection, not scientifically validated prediction.
- Never invent or recalculate chart facts. Every section must cite only supplied evidence IDs.
- Discuss motivations, values, contribution, work environments, tensions, and reflective questions.
- Write exactly one section for each selected theme, set its theme field to that theme ID, and do not add sections for unselected themes.
- Structure every section with: a concise bottomLine field (the BLUF), a narrative of 500-1,000 words of interpretation and analysis, a specific bringIntoLife field containing practical ways to embody the insight, and 3-5 distinct writing-based journalingPrompts. Keep reflectionQuestions as 1-3 short questions that can be carried into the day.
- Give each section a distinct interpretive focus. Do not repeat sentences, chart interpretations, section titles, or reflection questions across sections.
- Do not predict employment, income, promotion, success, status, or outcomes.
- Do not provide medical, legal, financial, or mental-health advice.
- Use measured, non-deterministic language. Explain technical terms briefly.
- If timeKnown is false, do not make house-, angle-, vocation-axis-, or exact-timing claims.
- The disclaimer must explicitly describe the report as reflective rather than predictive.

Selected career reflection themes:
${selectedThemes.join("\n")}

Immutable evidence bundle:\n${JSON.stringify(evidence)}`;
}

export function validateEvidenceLinks(
  report: CareerReport,
  evidence: CareerEvidenceBundle,
  themes?: CareerTheme[],
) {
  const valid = new Set(evidence.items.map((item) => item.id));
  const selectedThemes = themes ? new Set(themes) : undefined;
  const reportedThemes = new Set<CareerTheme>();
  for (const section of report.sections) {
    if (
      section.bottomLine ||
      section.bringIntoLife ||
      section.journalingPrompts
    ) {
      if (
        !section.bottomLine ||
        !section.bringIntoLife ||
        !section.journalingPrompts
      )
        throw new Error("INCOMPLETE_CAREER_SECTION_FORMAT");
      const narrativeWords = section.narrative
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
      if (narrativeWords < 500) throw new Error("CAREER_SECTION_TOO_SHORT");
      if (narrativeWords > 1000) throw new Error("CAREER_SECTION_TOO_LONG");
    }
    if (selectedThemes) {
      if (!section.theme || !selectedThemes.has(section.theme))
        throw new Error("UNSELECTED_CAREER_THEME");
      if (reportedThemes.has(section.theme))
        throw new Error("DUPLICATE_CAREER_THEME");
      reportedThemes.add(section.theme);
    }
    for (const id of section.evidenceIds)
      if (!valid.has(id)) throw new Error(`UNKNOWN_EVIDENCE_ID:${id}`);
  }
  if (
    selectedThemes &&
    (reportedThemes.size !== selectedThemes.size ||
      [...selectedThemes].some((theme) => !reportedThemes.has(theme)))
  )
    throw new Error("MISSING_CAREER_THEME");
}
