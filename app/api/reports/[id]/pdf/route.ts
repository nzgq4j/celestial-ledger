import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  careerReportSchema,
  type CareerEvidenceBundle,
} from "@/lib/reports/career";
import { recoveryReportSchema } from "@/lib/reports/recovery";
import { buildReportPdf } from "@/lib/reports/pdf";
import { defaultLocale, isLocaleTag, localeRegistry } from "@/lib/i18n/config";
import { localizeEvidenceLabel } from "@/lib/reports/evidence-label";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = z
    .string()
    .uuid()
    .safeParse((await params).id);
  if (!id.success)
    return Response.json({ error: "Invalid report." }, { status: 400 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub)
    return Response.json({ error: "Sign in required." }, { status: 401 });
  const [{ data: report }, { data: evidenceRow }] = await Promise.all([
    supabase
      .from("reports")
      .select("id,report_type,status,locale,output,completed_at")
      .eq("id", id.data)
      .maybeSingle(),
    supabase
      .from("report_evidence")
      .select("evidence")
      .eq("report_id", id.data)
      .maybeSingle(),
  ]);
  if (!report || report.status !== "completed" || !evidenceRow?.evidence)
    return Response.json({ error: "Report unavailable." }, { status: 404 });
  const isRecovery = report.report_type === "recovery_reflection";
  const output = isRecovery
    ? recoveryReportSchema.safeParse(report.output)
    : careerReportSchema.safeParse(report.output);
  const evidence = evidenceRow.evidence as unknown as CareerEvidenceBundle;
  if (!output.success || !evidence?.items)
    return Response.json({ error: "Report unavailable." }, { status: 422 });
  const locale = isLocaleTag(report.locale) ? report.locale : defaultLocale;
  const pack = await localeRegistry[locale].load();
  const copy = pack.messages.account;
  const evidenceById = new Map(evidence.items.map((item) => [item.id, item]));
  const bytes = await buildReportPdf({
    edition: isRecovery
      ? copy.recoveryPrivateEdition
      : copy.careerPrivateEdition,
    title: output.data.title,
    introduction: output.data.introduction,
    uncertainty: evidence.uncertainty.map(() => copy.unknownTimeEvidence),
    sections: output.data.sections.map((section) => ({
      title: section.title,
      bottomLine: section.bottomLine,
      narrative: section.narrative,
      bringIntoLife: section.bringIntoLife,
      journalingPrompts: section.journalingPrompts,
      reflectionQuestions: section.reflectionQuestions,
      evidence: section.evidenceIds.map((evidenceId) => {
        const item = evidenceById.get(evidenceId);
        return item ? localizeEvidenceLabel(item, locale) : evidenceId;
      }),
    })),
    closing: output.data.closing,
    disclaimer:
      !isRecovery && "disclaimer" in output.data
        ? output.data.disclaimer
        : undefined,
    evidenceTitle: copy.evidenceConstellation,
    evidence: evidence.items.map((item) => localizeEvidenceLabel(item, locale)),
    visualEvidence: evidence.items.map((item) => ({
      id: item.id,
      label: localizeEvidenceLabel(item, locale),
      kind: item.kind,
      ...(item.kind === "aspect" && typeof item.data.body1 === "string"
        ? { body1: item.data.body1 }
        : {}),
      ...(item.kind === "aspect" && typeof item.data.body2 === "string"
        ? { body2: item.data.body2 }
        : {}),
    })),
    generatedAt: new Date(report.completed_at ?? Date.now()).toLocaleDateString(
      locale,
    ),
    labels: {
      bottomLine: copy.bottomLine,
      bringIntoLife: copy.bringIntoLife,
      journalingPrompts: copy.journalingPrompts,
      questions: copy.questionsToCarry,
    },
  });
  const filename = `${report.report_type.replaceAll("_", "-")}-${report.id.slice(0, 8)}.pdf`;
  return new Response(Buffer.from(bytes), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
