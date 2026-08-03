import { createClient } from "@/lib/supabase/server";
import { PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";

export const dynamic = "force-dynamic";
export async function GET(
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
  return Response.json(data, { headers: PRIVATE_RESPONSE_HEADERS });
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
