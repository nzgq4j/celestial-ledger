import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSameOrigin, PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";

export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = z
    .string()
    .uuid()
    .safeParse((await params).id);
  if (!id.success) return json({ error: "Invalid weekly reading." }, 400);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (typeof auth?.claims?.sub !== "string")
    return json({ error: "Unauthorized." }, 401);
  const { data } = await supabase
    .from("weekly_readings")
    .select(
      "id,birth_profile_id,week_start_date,week_end_date,observation_time_zone,locale,status,analysis,content,evidence,generated_at,expires_at",
    )
    .eq("id", id.data)
    .eq("user_id", auth.claims.sub)
    .maybeSingle();
  return data ? json(data) : json({ error: "Weekly reading not found." }, 404);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request))
    return json({ error: "Cross-origin requests are not allowed." }, 403);
  const id = z
    .string()
    .uuid()
    .safeParse((await params).id);
  if (!id.success) return json({ error: "Invalid weekly reading." }, 400);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (typeof auth?.claims?.sub !== "string")
    return json({ error: "Unauthorized." }, 401);
  const { error } = await supabase
    .from("weekly_readings")
    .delete()
    .eq("id", id.data)
    .eq("user_id", auth.claims.sub);
  return error
    ? json({ error: "The weekly reading could not be deleted." }, 409)
    : new Response(null, { status: 204, headers: PRIVATE_RESPONSE_HEADERS });
}
