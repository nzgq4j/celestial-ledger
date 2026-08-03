import { z } from "zod";
import { isSameOrigin, PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const idSchema = z.string().uuid();
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  if (!isSameOrigin(request))
    return json({ error: "Cross-origin requests are not allowed." }, 403);
  const parsedId = idSchema.safeParse((await context.params).id);
  if (!parsedId.success) return json({ error: "Invalid profile ID." }, 400);
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || typeof auth?.claims?.sub !== "string")
    return json({ error: "Sign in to delete this birth profile." }, 401);
  const { data, error } = await supabase
    .from("birth_profiles")
    .delete()
    .eq("id", parsedId.data)
    .select("id")
    .maybeSingle();
  if (error) return json({ error: "The profile could not be deleted." }, 500);
  if (!data) return json({ error: "Birth profile not found." }, 404);
  return json({ deleted: true });
}
