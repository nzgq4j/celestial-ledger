import OpenAI from "openai";
import type { BirthInput } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";
import {
  buildCareerEvidence,
  careerPrompt,
  careerReportJsonSchema,
  careerReportSchema,
  validateEvidenceLinks,
} from "@/lib/reports/career";
import {
  buildRecoveryEvidence,
  recoveryPrompt,
  recoveryReportJsonSchema,
  recoveryReportSchema,
  recoveryThemeSchema,
  validateRecoveryReport,
} from "@/lib/reports/recovery";
import { bindEvidenceIds } from "@/lib/reports/evidence-schema";
import { defaultLocale, isLocaleTag } from "@/lib/i18n/config";

export const runtime = "nodejs";
export const maxDuration = 300;
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

export async function runNextReportJob() {
  const startedAt = Date.now();
  const admin = createAdminClient();
  const { data: jobs, error: claimError } = await admin.rpc("claim_report_job");
  const job = jobs?.[0];
  if (claimError) return json({ error: "Job claim failed." }, 500);
  if (!job) return json({ claimed: false });
  console.log(
    JSON.stringify({
      level: "info",
      message: "Report worker claimed job",
      reportType: job.report_type,
    }),
  );
  try {
    if (!["career_purpose", "recovery_reflection"].includes(job.report_type))
      throw new Error("UNSUPPORTED_REPORT_TYPE");
    const { data: profile, error } = await admin
      .from("birth_profiles")
      .select(
        "birth_date,birth_time,time_unknown,disambiguation,city,region,country,display_name,latitude,longitude,time_zone",
      )
      .eq("id", job.birth_profile_id)
      .eq("user_id", job.user_id)
      .single();
    if (error || !profile) throw new Error("BIRTH_PROFILE_NOT_FOUND");
    const birthInput: BirthInput = {
      date: profile.birth_date,
      time: profile.birth_time ?? undefined,
      timeUnknown: profile.time_unknown,
      disambiguation: profile.disambiguation as BirthInput["disambiguation"],
      place: {
        id: job.birth_profile_id,
        city: profile.city,
        region: profile.region ?? undefined,
        country: profile.country,
        displayName: profile.display_name,
        latitude: profile.latitude,
        longitude: profile.longitude,
        timeZone: profile.time_zone,
      },
    };
    const recoveryThemes =
      job.report_type === "recovery_reflection"
        ? recoveryThemeSchema.array().min(1).max(6).parse(job.recovery_themes)
        : undefined;
    const { chart, evidence } =
      job.report_type === "recovery_reflection"
        ? await buildRecoveryEvidence(birthInput)
        : await buildCareerEvidence(birthInput);
    const model = process.env.OPENAI_REPORT_MODEL || "gpt-5-mini";
    const reportLocale =
      typeof job.locale === "string" && isLocaleTag(job.locale)
        ? job.locale
        : defaultLocale;
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const prompt = recoveryThemes
      ? recoveryPrompt(evidence, recoveryThemes, reportLocale)
      : careerPrompt(evidence, reportLocale);
    let report;
    let draftError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await client.responses.create({
          model,
          store: false,
          input:
            attempt === 0
              ? prompt
              : `${prompt}\n\nThe previous draft did not pass validation. Create a fresh draft and use only the exact evidence IDs supplied above.`,
          text: {
            format: {
              type: "json_schema",
              name: recoveryThemes
                ? "recovery_reflection_report"
                : "career_purpose_report",
              strict: true,
              schema: bindEvidenceIds(
                recoveryThemes
                  ? recoveryReportJsonSchema
                  : careerReportJsonSchema,
                evidence.items.map((item) => item.id),
              ),
            },
          },
        });
        const rawReport: unknown = JSON.parse(response.output_text);
        if (recoveryThemes) {
          const recoveryReport = recoveryReportSchema.parse(rawReport);
          validateRecoveryReport(recoveryReport, evidence, recoveryThemes);
          report = recoveryReport;
        } else {
          const careerReport = careerReportSchema.parse(rawReport);
          validateEvidenceLinks(careerReport, evidence);
          report = careerReport;
        }
        break;
      } catch (error) {
        draftError = error;
        if (attempt === 0)
          console.warn(
            JSON.stringify({
              level: "warning",
              message: "Report draft failed validation; regenerating",
              reportType: job.report_type,
            }),
          );
      }
    }
    if (!report) throw draftError ?? new Error("GENERATION_FAILED");
    const { error: completeError } = await admin.rpc("complete_report_job", {
      p_report_id: job.id,
      p_output: report,
      p_evidence: evidence,
      p_model_version: model,
      p_calculation_version: chart.calculation.calculationVersion,
      p_ephemeris_version: `${chart.calculation.ephemeris} ${chart.calculation.engineVersion}`,
      p_timezone_name: chart.input.place.timeZone,
    });
    if (completeError) throw new Error("COMPLETION_FAILED");
    console.log(
      JSON.stringify({
        level: "info",
        message: "Report worker completed job",
        reportType: job.report_type,
        durationMs: Date.now() - startedAt,
      }),
    );
    return json({ claimed: true, reportId: job.id, status: "completed" });
  } catch (error) {
    const code =
      error instanceof Error ? error.message.slice(0, 80) : "GENERATION_FAILED";
    await admin.rpc("fail_report_job", {
      p_report_id: job.id,
      p_failure_code: code,
      p_retryable: !/UNSUPPORTED|BIRTH_PROFILE_NOT_FOUND/.test(code),
    });
    console.error(
      JSON.stringify({
        level: "error",
        message: "Report worker failed job",
        reportType: job.report_type,
        code,
        durationMs: Date.now() - startedAt,
      }),
    );
    return json({ claimed: true, reportId: job.id, status: "failed" }, 500);
  }
}

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (
    !expected ||
    request.headers.get("authorization") !== `Bearer ${expected}`
  )
    return json({ error: "Unauthorized." }, 401);
  return runNextReportJob();
}

export const GET = POST;
