import { createClient } from "@/lib/supabase/server";
import { isSameOrigin, PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (typeof auth?.claims?.sub !== "string")
    return json({ error: "Unauthorized." }, 401);
  const { data, error } = await supabase
    .from("daily_readings")
    .select(
      "id,birth_profile_id,reading_date,observation_time_zone,locale,status,content,evidence,generated_at,expires_at",
    )
    .eq("id", id)
    .single();
  if (error || !data) return json({ error: "Daily reading not found." }, 404);
  return json(data);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request))
    return json({ error: "Cross-origin requests are not allowed." }, 403);
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (typeof auth?.claims?.sub !== "string")
    return json({ error: "Unauthorized." }, 401);
  const { error } = await supabase.from("daily_readings").delete().eq("id", id);
  if (error)
    return json({ error: "The daily reading could not be deleted." }, 409);
  return new Response(null, { status: 204, headers: PRIVATE_RESPONSE_HEADERS });
}
