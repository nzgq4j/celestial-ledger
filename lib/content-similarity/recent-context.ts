import type { createAdminClient } from "@/lib/supabase/admin";
import {
  contentSimilarity,
  maximumReferenceSimilarity,
} from "@/lib/content-similarity/similarity";

export type GeneratedContentKind = "daily" | "weekly" | "report";

export type RecentContentItem = {
  id: string;
  kind: GeneratedContentKind;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  text: string;
  reportType?: string;
};

export type RecentContentContext = {
  sameType: RecentContentItem[];
  crossType: RecentContentItem[];
  all: RecentContentItem[];
};

type AdminClient = ReturnType<typeof createAdminClient>;

const READER_FACING_KEYS = new Set([
  "title",
  "headline",
  "introduction",
  "closing",
  "bottomLine",
  "narrative",
  "bringIntoLife",
  "reflectionQuestions",
  "journalingPrompts",
  "practicalApplications",
  "action",
  "watchFor",
  "response",
]);

function collectReaderProse(
  value: unknown,
  parentKey = "",
  result: string[] = [],
) {
  if (typeof value === "string") {
    if (
      READER_FACING_KEYS.has(parentKey) &&
      !/^(?:placement|angle|house|aspect):/u.test(value)
    )
      result.push(value);
    return result;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectReaderProse(item, parentKey, result);
    return result;
  }
  if (!value || typeof value !== "object") return result;
  for (const [key, item] of Object.entries(value))
    collectReaderProse(item, key, result);
  return result;
}

/** Extract prose only. Evidence IDs and calculation metadata are intentionally excluded. */
export function readerProse(value: unknown) {
  return collectReaderProse(value).join("\n").trim();
}

function overlaps(
  item: Pick<RecentContentItem, "periodStart" | "periodEnd">,
  start: string,
  end: string,
) {
  return item.periodStart <= end && item.periodEnd >= start;
}

function excerpt(value: string, maximumWords = 110) {
  const words = value.split(/\s+/u).filter(Boolean);
  return words.slice(0, maximumWords).join(" ");
}

export function recentContentInstruction(context: RecentContentContext) {
  if (!context.all.length) return "";
  const compact = context.all.map((item) => ({
    kind: item.kind,
    period: `${item.periodStart} to ${item.periodEnd}`,
    ...(item.reportType ? { reportType: item.reportType } : {}),
    excerpt: excerpt(item.text),
  }));
  return `Recent reader-specific content to avoid imitating:\n${JSON.stringify(compact)}\n\nDo not reuse its syntax, examples, conclusions, metaphors, practical advice, or journaling prompts. You may and must still cite the same real evidence or address the same real topic when the current evidence requires it; phrase and develop the interpretation independently.`;
}

export async function loadRecentContentContext(input: {
  admin: AdminClient;
  userId: string;
  birthProfileId: string;
  currentKind: GeneratedContentKind;
  periodStart: string;
  periodEnd: string;
  locale: string;
  reportType?: string;
  excludeId?: string;
}): Promise<RecentContentContext> {
  const [daily, weekly, reports] = await Promise.all([
    input.admin
      .from("daily_readings")
      .select("id,reading_date,generated_at,content")
      .eq("user_id", input.userId)
      .eq("birth_profile_id", input.birthProfileId)
      .eq("status", "completed")
      .eq("locale", input.locale)
      .lte("reading_date", input.periodEnd)
      .order("reading_date", { ascending: false })
      .limit(14),
    input.admin
      .from("weekly_readings")
      .select("id,week_start_date,week_end_date,generated_at,content")
      .eq("user_id", input.userId)
      .eq("birth_profile_id", input.birthProfileId)
      .eq("status", "completed")
      .eq("locale", input.locale)
      .lte("week_start_date", input.periodEnd)
      .order("week_start_date", { ascending: false })
      .limit(8),
    input.admin
      .from("reports")
      .select("id,report_type,completed_at,output")
      .eq("user_id", input.userId)
      .eq("birth_profile_id", input.birthProfileId)
      .eq("status", "completed")
      .eq("locale", input.locale)
      .order("completed_at", { ascending: false })
      .limit(14),
  ]);

  const items: RecentContentItem[] = [];
  for (const row of daily.data ?? []) {
    const text = readerProse(row.content);
    if (text)
      items.push({
        id: row.id,
        kind: "daily",
        periodStart: row.reading_date,
        periodEnd: row.reading_date,
        generatedAt: row.generated_at,
        text,
      });
  }
  for (const row of weekly.data ?? []) {
    const text = readerProse(row.content);
    if (text)
      items.push({
        id: row.id,
        kind: "weekly",
        periodStart: row.week_start_date,
        periodEnd: row.week_end_date,
        generatedAt: row.generated_at,
        text,
      });
  }
  for (const row of reports.data ?? []) {
    const text = readerProse(row.output);
    const completedDate = row.completed_at?.slice(0, 10);
    if (text && completedDate)
      items.push({
        id: row.id,
        kind: "report",
        reportType: row.report_type,
        periodStart: completedDate,
        periodEnd: completedDate,
        generatedAt: row.completed_at!,
        text,
      });
  }

  const eligible = items.filter((item) => item.id !== input.excludeId);
  const sameType = eligible
    .filter(
      (item) =>
        item.kind === input.currentKind &&
        (input.currentKind !== "report" ||
          item.reportType === input.reportType),
    )
    .slice(0, 7);
  const crossType = eligible.filter(
    (item) =>
      item.kind !== input.currentKind &&
      overlaps(item, input.periodStart, input.periodEnd),
  );
  const all = [
    ...new Map(
      [...sameType, ...crossType].map((item) => [item.id, item]),
    ).values(),
  ];
  return { sameType, crossType, all };
}

export const HISTORICAL_SIMILARITY_THRESHOLD = 0.38;
export const CROSS_TYPE_SIMILARITY_THRESHOLD = 0.52;

export function assertRecentContentDiversity(input: {
  candidate: unknown;
  context: RecentContentContext;
  historicalErrorCode: string;
  crossTypeErrorCode: string;
}) {
  const candidate = readerProse(input.candidate);
  if (!candidate) return;
  if (
    maximumReferenceSimilarity(
      candidate,
      input.context.sameType.map((item) => item.text),
    ) > HISTORICAL_SIMILARITY_THRESHOLD
  )
    throw new Error(input.historicalErrorCode);
  if (
    maximumReferenceSimilarity(
      candidate,
      input.context.crossType.map((item) => item.text),
    ) > CROSS_TYPE_SIMILARITY_THRESHOLD
  )
    throw new Error(input.crossTypeErrorCode);
}

export function maximumContextSimilarity(
  candidate: unknown,
  items: RecentContentItem[],
) {
  return Math.max(
    0,
    ...items.map((item) =>
      contentSimilarity(readerProse(candidate), item.text),
    ),
  );
}
