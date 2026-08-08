import { PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!expected || authorization !== `Bearer ${expected}`)
    return Response.json(
      { error: "Unauthorized." },
      { status: 401, headers: PRIVATE_RESPONSE_HEADERS },
    );
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const [{ error: pendingError }, { error: signinError }] = await Promise.all([
    admin.from("pending_chart_claims").delete().lt("expires_at", now),
    admin.from("subscription_signin_claims").delete().lt("expires_at", now),
  ]);
  if (pendingError || signinError)
    return Response.json(
      { error: "Cleanup failed." },
      { status: 500, headers: PRIVATE_RESPONSE_HEADERS },
    );
  return Response.json(
    { cleaned: true },
    { headers: PRIVATE_RESPONSE_HEADERS },
  );
}
