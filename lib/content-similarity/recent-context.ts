import type { createAdminClient } from "@/lib/supabase/admin";
import {
  contentTokens,
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
  segments?: string[];
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
  return readerProseSegments(value).join("\n").trim();
}

/** Individual reader-facing prose fields, excluding evidence and metadata. */
export function readerProseSegments(value: unknown) {
  return collectReaderProse(value)
    .map((item) => item.trim())
    .filter(Boolean);
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

const MINIMUM_SIMILARITY_SEGMENT_WORDS = 12;
const RECENT_CONTEXT_LIMIT = 7;

function meaningfulSegments(item: RecentContentItem) {
  return (item.segments ?? item.text.split("\n")).filter(
    (segment) =>
      contentTokens(segment).length >= MINIMUM_SIMILARITY_SEGMENT_WORDS,
  );
}

function representativeExcerpts(item: RecentContentItem) {
  const segments = meaningfulSegments(item);
  if (!segments.length) return [excerpt(item.text)];
  const positions = [
    0,
    Math.floor((segments.length - 1) / 2),
    segments.length - 1,
  ];
  return [...new Set(positions)].map((index) => excerpt(segments[index], 34));
}

export function rollingLookbackStart(value: string, days = 7) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/u.test(value) ||
    !Number.isInteger(days) ||
    days < 1
  )
    throw new Error("INVALID_RECENT_CONTENT_WINDOW");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    throw new Error("INVALID_RECENT_CONTENT_WINDOW");
  date.setUTCDate(date.getUTCDate() - (days - 1));
  return date.toISOString().slice(0, 10);
}

export function assembleRecentContentContext(
  items: RecentContentItem[],
  input: {
    currentKind: GeneratedContentKind;
    periodStart: string;
    periodEnd: string;
    reportType?: string;
    excludeId?: string;
  },
): RecentContentContext {
  const eligible = items.filter((item) => item.id !== input.excludeId);
  const byMostRecent = (left: RecentContentItem, right: RecentContentItem) =>
    right.generatedAt.localeCompare(left.generatedAt);
  const sameType = eligible
    .filter(
      (item) =>
        item.kind === input.currentKind &&
        (input.currentKind !== "report" ||
          item.reportType === input.reportType),
    )
    .sort(byMostRecent)
    .slice(0, RECENT_CONTEXT_LIMIT);
  const crossTypeWindowStart = rollingLookbackStart(input.periodStart);
  const crossType = eligible
    .filter(
      (item) =>
        item.kind !== input.currentKind &&
        overlaps(item, crossTypeWindowStart, input.periodEnd),
    )
    .sort(byMostRecent)
    .slice(0, RECENT_CONTEXT_LIMIT);
  const all = [
    ...new Map(
      [...sameType, ...crossType].map((item) => [item.id, item]),
    ).values(),
  ];
  return { sameType, crossType, all };
}

export function recentContentInstruction(context: RecentContentContext) {
  if (!context.all.length) return "";
  const compact = context.all.map((item) => ({
    kind: item.kind,
    period: `${item.periodStart} to ${item.periodEnd}`,
    ...(item.reportType ? { reportType: item.reportType } : {}),
    excerpts: representativeExcerpts(item),
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
  let reportsQuery = input.admin
    .from("reports")
    .select("id,report_type,completed_at,output")
    .eq("user_id", input.userId)
    .eq("birth_profile_id", input.birthProfileId)
    .eq("status", "completed")
    .eq("locale", input.locale)
    .lte("completed_at", `${input.periodEnd}T23:59:59.999Z`);
  if (input.currentKind === "report" && input.reportType)
    reportsQuery = reportsQuery.eq("report_type", input.reportType);

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
      .select(
        "id,week_start_date,week_end_date,reading_start_date,reading_end_date,generated_at,content",
      )
      .eq("user_id", input.userId)
      .eq("birth_profile_id", input.birthProfileId)
      .eq("status", "completed")
      .eq("locale", input.locale)
      .lte("reading_start_date", input.periodEnd)
      .order("reading_start_date", { ascending: false })
      .limit(8),
    reportsQuery.order("completed_at", { ascending: false }).limit(14),
  ]);

  const items: RecentContentItem[] = [];
  for (const row of daily.data ?? []) {
    const segments = readerProseSegments(row.content);
    const text = segments.join("\n");
    if (text)
      items.push({
        id: row.id,
        kind: "daily",
        periodStart: row.reading_date,
        periodEnd: row.reading_date,
        generatedAt: row.generated_at,
        text,
        segments,
      });
  }
  for (const row of weekly.data ?? []) {
    const segments = readerProseSegments(row.content);
    const text = segments.join("\n");
    if (text)
      items.push({
        id: row.id,
        kind: "weekly",
        periodStart: row.reading_start_date ?? row.week_start_date,
        periodEnd: row.reading_end_date ?? row.week_end_date,
        generatedAt: row.generated_at,
        text,
        segments,
      });
  }
  for (const row of reports.data ?? []) {
    const segments = readerProseSegments(row.output);
    const text = segments.join("\n");
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
        segments,
      });
  }

  return assembleRecentContentContext(items, input);
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
  const candidateSegments = readerProseSegments(input.candidate).filter(
    (segment) =>
      contentTokens(segment).length >= MINIMUM_SIMILARITY_SEGMENT_WORDS,
  );
  const maximumAgainst = (items: RecentContentItem[]) =>
    Math.max(
      maximumReferenceSimilarity(
        candidate,
        items.map((item) => item.text),
      ),
      ...items.flatMap((item) =>
        candidateSegments.map((segment) =>
          maximumReferenceSimilarity(segment, meaningfulSegments(item)),
        ),
      ),
    );
  if (maximumAgainst(input.context.sameType) > HISTORICAL_SIMILARITY_THRESHOLD)
    throw new Error(input.historicalErrorCode);
  if (maximumAgainst(input.context.crossType) > CROSS_TYPE_SIMILARITY_THRESHOLD)
    throw new Error(input.crossTypeErrorCode);
}

export function maximumContextSimilarity(
  candidate: unknown,
  items: RecentContentItem[],
) {
  const candidateText = readerProse(candidate);
  const candidateSegments = readerProseSegments(candidate).filter(
    (segment) =>
      contentTokens(segment).length >= MINIMUM_SIMILARITY_SEGMENT_WORDS,
  );
  return Math.max(
    0,
    ...items.map((item) => contentSimilarity(candidateText, item.text)),
    ...items.flatMap((item) =>
      candidateSegments.map((segment) =>
        maximumReferenceSimilarity(segment, meaningfulSegments(item)),
      ),
    ),
  );
}
