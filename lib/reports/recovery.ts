import { z } from "zod";
import type { BirthInput } from "@/lib/types";
import {
  buildCareerEvidence,
  type CareerEvidenceBundle,
} from "@/lib/reports/career";
import type { LocaleTag } from "@/lib/i18n/config";
import { reportLanguageInstruction } from "@/lib/reports/language";

export const RECOVERY_SCHEMA_VERSION = "recovery-4";
export const RECOVERY_PROMPT_VERSION = "recovery-4";
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
    bottomLine: z.string().min(1).max(1200).optional(),
    narrative: z.string().min(1).max(12000),
    bringIntoLife: z.string().min(1).max(2400).optional(),
    evidenceIds: z.array(evidenceReference).min(1).max(8),
    reflectionQuestions: z.array(z.string().min(1).max(240)).min(1).max(3),
    journalingPrompts: z
      .array(z.string().min(1).max(320))
      .min(3)
      .max(5)
      .optional(),
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
          theme: { type: "string", enum: recoveryThemeSchema.options },
          bottomLine: { type: "string", minLength: 1, maxLength: 1200 },
          narrative: { type: "string", minLength: 6500, maxLength: 12000 },
          bringIntoLife: { type: "string", minLength: 1, maxLength: 2400 },
          evidenceIds: {
            type: "array",
            minItems: 1,
            maxItems: 8,
            items: { type: "string", minLength: 1, maxLength: 240 },
          },
          reflectionQuestions: {
            type: "array",
            minItems: 1,
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
- Structure every section with: a concise bottomLine field (the BLUF), a narrative of 850-950 words of interpretation and analysis (never fewer than 750 words), a specific bringIntoLife field containing grounded practices, and 3-5 distinct writing-based journalingPrompts. Keep reflectionQuestions as 1-3 short questions that can be carried into the day.
- Without naming, citing, or alluding to any recovery program or therapy model, weave in relevant principles such as honest self-inventory, acceptance of what cannot be controlled, responsibility for present choices, repair where safe and appropriate, connection with trusted support, attention to one day and one action at a time, identifying automatic thoughts, testing interpretations against evidence, reframing unhelpful patterns, noticing triggers, and choosing workable alternative responses.
- Apply those principles specifically to the selected theme and supplied chart evidence; do not turn them into generic recovery advice or repeat the same principles in every section.
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
  /\b12[ -]?step(?:s)?\b/i,
  /\btwelve[ -]?step(?:s)?\b/i,
  /\bCBT\b/,
  /\bcognitive behavio(?:u)?ral therapy\b/i,
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
      section.bottomLine ?? "",
      section.narrative,
      section.bringIntoLife ?? "",
      ...section.reflectionQuestions,
      ...(section.journalingPrompts ?? []),
    ]),
  ].join("\n");
  if (prohibitedOutput.some((pattern) => pattern.test(combined)))
    throw new Error("RECOVERY_SAFETY_REJECTED");
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
        throw new Error("INCOMPLETE_RECOVERY_SECTION_FORMAT");
      if (section.narrative.trim().split(/\s+/).filter(Boolean).length < 750)
        throw new Error("RECOVERY_SECTION_TOO_SHORT");
    }
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
