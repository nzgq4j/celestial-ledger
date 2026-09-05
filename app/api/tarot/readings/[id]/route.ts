import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSameOrigin, PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS });
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success)
    return json({ error: "Invalid reading" }, 400);
  const client = await createClient();
  const { data } = await client.auth.getUser();
  if (!data.user) return json({ error: "Sign in required" }, 401);
  // Explicit owner predicate also lets owners delete expired, RLS-hidden snapshots.
  const result = await createAdminClient()
    .from("tarot_readings")
    .delete()
    .eq("id", id)
    .eq("user_id", data.user.id)
    .select("id");
  if (result.error) return json({ error: "Could not delete reading" }, 500);
  if (!result.data?.length) return json({ error: "Reading not found" }, 404);
  return json({ deleted: true });
}
