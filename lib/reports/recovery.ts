import { z } from "zod";
import type { BirthInput } from "@/lib/types";
import {
  buildCareerEvidence,
  type CareerEvidenceBundle,
} from "@/lib/reports/career";
import type { LocaleTag } from "@/lib/i18n/config";
import { reportLanguageInstruction } from "@/lib/reports/language";

export const RECOVERY_SCHEMA_VERSION = "recovery-2";
export const RECOVERY_PROMPT_VERSION = "recovery-2";
export const RECOVERY_SAFETY_VERSION = "recovery-safety-1";

export const recoveryThemeSchema = z.enum([
  "grounding",
  "relationships",
  "self_trust",
  "daily_rhythms",
  "boundaries",
  "renewal",
]);
export type RecoveryTheme = z.infer<typeof recoveryThemeSchema>;

export const recoveryThemes = [
  {
    id: "grounding",
    label: "Grounding",
    detail: "Steadiness and returning to centre",
  },
  {
    id: "relationships",
    label: "Relationships",
    detail: "Connection, trust and mutual care",
  },
  {
    id: "self_trust",
    label: "Self-trust",
    detail: "Inner authority and honest self-knowledge",
  },
  {
    id: "daily_rhythms",
    label: "Daily rhythms",
    detail: "Rituals, rest and sustaining momentum",
  },
  {
    id: "boundaries",
    label: "Boundaries",
    detail: "Protection, discernment and clear limits",
  },
  {
    id: "renewal",
    label: "Renewal",
    detail: "Release, transformation and new beginnings",
  },
] as const satisfies readonly {
  id: RecoveryTheme;
  label: string;
  detail: string;
}[];

const evidenceReference = z.string().regex(/^(placement|angle|house|aspect):/);
const recoverySectionSchema = z
  .object({
    title: z.string().min(1).max(100),
    theme: recoveryThemeSchema,
    narrative: z.string().min(1).max(1800),
    evidenceIds: z.array(evidenceReference).min(1).max(8),
    reflectionQuestions: z.array(z.string().min(1).max(240)).min(1).max(3),
  })
  .strict();

export const recoveryReportSchema = z
  .object({
    title: z.string().min(1).max(120),
    introduction: z.string().min(1).max(1200),
    sections: z.array(recoverySectionSchema).min(1).max(6),
    closing: z.string().min(1).max(1000),
  })
  .strict();
export type RecoveryReport = z.infer<typeof recoveryReportSchema>;

export const recoveryReportJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "introduction", "sections", "closing"],
  properties: {
    title: { type: "string" },
    introduction: { type: "string" },
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
          "narrative",
          "evidenceIds",
          "reflectionQuestions",
        ],
        properties: {
          title: { type: "string" },
          theme: { type: "string", enum: recoveryThemeSchema.options },
          narrative: { type: "string" },
          evidenceIds: {
            type: "array",
            minItems: 1,
            maxItems: 8,
            items: { type: "string" },
          },
          reflectionQuestions: {
            type: "array",
            minItems: 1,
            maxItems: 3,
            items: { type: "string" },
          },
        },
      },
    },
    closing: { type: "string" },
  },
} as const;

export async function buildRecoveryEvidence(input: BirthInput) {
  return buildCareerEvidence(input);
}

export function recoveryPrompt(
  evidence: CareerEvidenceBundle,
  themes: RecoveryTheme[],
  locale: LocaleTag = "en-GB",
) {
  const labels = recoveryThemes
    .filter((theme) => themes.includes(theme.id))
    .map((theme) => `${theme.id}: ${theme.label} — ${theme.detail}`);
  return `Create a Celestial Atlas Recovery Reflection from the immutable natal evidence and reviewed themes below.

Voice and craft:
${reportLanguageInstruction(locale)}
- Write from inside astrology: mystical, compassionate, confident and specific.
- Reveal constructive patterns without forced optimism, shame or fatalism.
- Use only the selected themes, with exactly one section per theme and no additional sections.
- Give each section a distinct interpretive focus. Do not repeat sentences, chart interpretations, section titles, or reflection questions across sections.
- Never invent or recalculate chart facts. Every section must cite supplied evidence IDs.
- If timeKnown is false, do not use houses, angles or exact-time claims.

Safety boundaries:
- This is reflective astrology for an adult, not diagnosis or clinical assessment.
- Do not give treatment, medication or detox instructions.
- Do not predict relapse, recovery, sobriety or inevitable outcomes.
- Do not blame the reader or claim astrology causes substance use.
- Do not discourage professional, medical, peer or emergency support.
- Do not introduce crisis scenarios or substance-use details that were not supplied.
- Do not include a disclaimer section; keep the report focused on the reading.

Selected reviewed themes:
${labels.join("\n")}

Immutable natal evidence:
${JSON.stringify(evidence)}`;
}

const prohibitedOutput = [
  /you (?:have|suffer from) (?:an? )?(?:addiction|disorder|disease)/i,
  /(?:stop|start|change|reduce|increase) (?:your )?medication/i,
  /(?:will|are going to) relapse/i,
  /(?:guaranteed|destined|certain) (?:recovery|sobriety|relapse)/i,
  /(?:your chart|astrology) (?:caused|causes|made you)/i,
  /(?:avoid|do not seek|don't seek) (?:professional|medical|peer) support/i,
];

export function validateRecoveryReport(
  report: RecoveryReport,
  evidence: CareerEvidenceBundle,
  themes: RecoveryTheme[],
) {
  const validEvidence = new Set(evidence.items.map((item) => item.id));
  const selectedThemes = new Set(themes);
  const reportedThemes = new Set<RecoveryTheme>();
  const combined = [
    report.title,
    report.introduction,
    report.closing,
    ...report.sections.flatMap((section) => [
      section.title,
      section.narrative,
      ...section.reflectionQuestions,
    ]),
  ].join("\n");
  if (prohibitedOutput.some((pattern) => pattern.test(combined)))
    throw new Error("RECOVERY_SAFETY_REJECTED");
  for (const section of report.sections) {
    if (!selectedThemes.has(section.theme))
      throw new Error("UNSELECTED_RECOVERY_THEME");
    if (reportedThemes.has(section.theme))
      throw new Error("DUPLICATE_RECOVERY_THEME");
    reportedThemes.add(section.theme);
    for (const id of section.evidenceIds)
      if (!validEvidence.has(id)) throw new Error(`UNKNOWN_EVIDENCE_ID:${id}`);
  }
  if (
    reportedThemes.size !== selectedThemes.size ||
    [...selectedThemes].some((theme) => !reportedThemes.has(theme))
  )
    throw new Error("MISSING_RECOVERY_THEME");
}
