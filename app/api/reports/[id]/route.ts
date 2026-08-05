import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSameOrigin, PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";
import { after } from "next/server";
import { runNextReportJob } from "@/app/api/internal/report-worker/route";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub)
    return Response.json(
      { error: "Unauthorized." },
      { status: 401, headers: PRIVATE_RESPONSE_HEADERS },
    );
  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, report_type, status, schema_version, model_version, output, failure_code, completed_at, expires_at, report_evidence(evidence)",
    )
    .eq("id", id)
    .single();
  if (error || !data)
    return Response.json(
      { error: "Report not found." },
      { status: 404, headers: PRIVATE_RESPONSE_HEADERS },
    );
  const summary = new URL(request.url).searchParams.has("summary");
  return Response.json(
    summary
      ? {
          id: data.id,
          status: data.status,
          failureCode: data.failure_code,
          completedAt: data.completed_at,
        }
      : data,
    { headers: PRIVATE_RESPONSE_HEADERS },
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request))
    return Response.json(
      { error: "Cross-origin requests are not allowed." },
      { status: 403, headers: PRIVATE_RESPONSE_HEADERS },
    );
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (typeof userId !== "string")
    return Response.json(
      { error: "Unauthorized." },
      { status: 401, headers: PRIVATE_RESPONSE_HEADERS },
    );
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reports")
    .update({
      status: "queued",
      failure_code: null,
      next_attempt_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("status", "failed")
    .select("id")
    .maybeSingle();
  if (error || !data)
    return Response.json(
      { error: "This report could not be restarted." },
      { status: 409, headers: PRIVATE_RESPONSE_HEADERS },
    );
  after(async () => {
    await runNextReportJob();
  });
  return Response.json(
    { id, status: "queued" },
    { status: 202, headers: PRIVATE_RESPONSE_HEADERS },
  );
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub)
    return Response.json(
      { error: "Unauthorized." },
      { status: 401, headers: PRIVATE_RESPONSE_HEADERS },
    );
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error)
    return Response.json(
      { error: "The report could not be deleted." },
      { status: 409, headers: PRIVATE_RESPONSE_HEADERS },
    );
  return new Response(null, { status: 204, headers: PRIVATE_RESPONSE_HEADERS });
}
