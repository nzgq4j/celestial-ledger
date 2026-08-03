import { z } from "zod";
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
import { isDemoMode } from "@/lib/supabase/config";

export const runtime = "nodejs";
const inputSchema = z
  .object({
    entitlementId: z.string().uuid(),
    birthProfileId: z.string().uuid(),
  })
  .strict();
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
    const { data, error } = await createAdminClient().rpc("queue_paid_report", {
      p_user_id: userId,
      p_entitlement_id: input.entitlementId,
      p_birth_profile_id: input.birthProfileId,
      p_schema_version: CAREER_SCHEMA_VERSION,
      p_prompt_version: CAREER_PROMPT_VERSION,
      p_safety_version: CAREER_SAFETY_VERSION,
    });
    if (error)
      return json(
        { error: "The report could not be queued for this entitlement." },
        409,
      );
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
