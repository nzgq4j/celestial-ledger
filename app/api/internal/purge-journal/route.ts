import { PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily retention job (Vercel Cron, CRON_SECRET bearer). Removes journal
 * entries past their one-year expiry and expired claim rows left by the
 * retired checkout flows.
 */
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (
    !expected ||
    request.headers.get("authorization") !== `Bearer ${expected}`
  )
    return Response.json(
      { error: "Unauthorized." },
      { status: 401, headers: PRIVATE_RESPONSE_HEADERS },
    );

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const [journal, pending, signin] = await Promise.all([
    admin.rpc("purge_expired_atlas_journal_entries"),
    admin.from("pending_chart_claims").delete().lt("expires_at", now),
    admin.from("subscription_signin_claims").delete().lt("expires_at", now),
  ]);
  if (journal.error || pending.error || signin.error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Retention purge failed",
        journal: !!journal.error,
        claims: !!(pending.error || signin.error),
      }),
    );
    return Response.json(
      { error: "Purge failed." },
      { status: 500, headers: PRIVATE_RESPONSE_HEADERS },
    );
  }
  return Response.json(
    { purgedJournalEntries: journal.data ?? 0 },
    { headers: PRIVATE_RESPONSE_HEADERS },
  );
}
