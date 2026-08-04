import { z } from "zod";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSameOrigin,
  PRIVATE_RESPONSE_HEADERS,
  readLimitedJson,
} from "@/lib/api-security";
import {
  CAREER_PROMPT_VERSION,
  CAREER_SAFETY_VERSION,
  CAREER_SCHEMA_VERSION,
} from "@/lib/reports/career";
import {
  RECOVERY_PROMPT_VERSION,
  RECOVERY_SAFETY_VERSION,
  RECOVERY_SCHEMA_VERSION,
  recoveryThemeSchema,
} from "@/lib/reports/recovery";
import { isDemoMode } from "@/lib/supabase/config";
import { runNextReportJob } from "@/app/api/internal/report-worker/route";

export const runtime = "nodejs";
export const maxDuration = 60;
const inputSchema = z
  .object({
    entitlementId: z.string().uuid().optional(),
    reportType: z.enum(["career_purpose", "recovery_reflection"]).optional(),
    birthProfileId: z.string().uuid(),
    adultConfirmed: z.boolean().optional(),
    recoveryThemes: z.array(recoveryThemeSchema).min(1).max(6).optional(),
  })
  .strict()
  .refine((value) => value.entitlementId || value.reportType, {
    message: "Choose a report type.",
  });
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

export async function POST(request: Request) {
  if (isDemoMode())
    return json(
      { error: "Report generation is disabled in preview demo mode." },
      403,
    );
  if (!isSameOrigin(request))
    return json({ error: "Cross-origin requests are not allowed." }, 403);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (typeof userId !== "string")
    return json({ error: "Sign in to generate a report." }, 401);
  try {
    const input = inputSchema.parse(await readLimitedJson(request, 2048));
    const admin = createAdminClient();
    let reportType = input.reportType;
    if (input.entitlementId) {
      const { data: entitlement } = await admin
        .from("entitlements")
        .select("report_type")
        .eq("id", input.entitlementId)
        .eq("user_id", userId)
        .single();
      if (!entitlement)
        return json({ error: "This report entitlement was not found." }, 404);
      reportType = entitlement.report_type as
        "career_purpose" | "recovery_reflection";
    }
    if (!reportType) return json({ error: "Choose a report type." }, 422);
    const isRecovery = reportType === "recovery_reflection";
    if (isRecovery && (!input.adultConfirmed || !input.recoveryThemes?.length))
      return json(
        {
          error:
            "Confirm you are 18 or older and choose at least one reflection theme.",
        },
        422,
      );
    if (isRecovery) {
      const { error: profileError } = await admin
        .from("profiles")
        .update({ adult_confirmed_at: new Date().toISOString() })
        .eq("id", userId);
      if (profileError)
        return json(
          { error: "Adult confirmation could not be recorded." },
          500,
        );
    }
    const versions = {
      p_user_id: userId,
      p_birth_profile_id: input.birthProfileId,
      p_schema_version: isRecovery
        ? RECOVERY_SCHEMA_VERSION
        : CAREER_SCHEMA_VERSION,
      p_prompt_version: isRecovery
        ? RECOVERY_PROMPT_VERSION
        : CAREER_PROMPT_VERSION,
      p_safety_version: isRecovery
        ? RECOVERY_SAFETY_VERSION
        : CAREER_SAFETY_VERSION,
      p_recovery_themes: isRecovery ? input.recoveryThemes : null,
    };
    const { data, error } = input.entitlementId
      ? await admin.rpc("queue_paid_report", {
          ...versions,
          p_entitlement_id: input.entitlementId,
        })
      : await admin.rpc("queue_complimentary_report", {
          ...versions,
          p_report_type: reportType,
        });
    if (error) return json({ error: "The report could not be queued." }, 409);
    after(async () => {
      const result = await runNextReportJob();
      if (!result.ok)
        console.error(
          JSON.stringify({
            level: "error",
            message: "Immediate report worker invocation failed",
            status: result.status,
          }),
        );
    });
    return json({ reportId: data, status: "queued" }, 202);
  } catch (error) {
    return json(
      {
        error:
          error instanceof z.ZodError
            ? "Invalid report request."
            : "The report could not be queued.",
      },
      error instanceof z.ZodError ? 422 : 500,
    );
  }
}
