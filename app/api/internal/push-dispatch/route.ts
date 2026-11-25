import { PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";
import { deliver, pool, type PushDevice } from "@/lib/push/deliver";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Messages more than this late are skipped rather than sent hours after their time. */
const STALE_MS = 3 * 3600 * 1000;
const BATCH = 500;

/**
 * Sends due daily insights (Vercel Cron every 10 minutes, CRON_SECRET bearer).
 * Delivered messages are marked sent and purged later; devices whose push
 * address no longer exists are removed.
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
  const now = Date.now();
  const { data, error } = await admin
    .from("atlas_push_messages")
    .select(
      "id,title,body,url,device:atlas_push_devices!inner(id,platform,fcm_token,endpoint,p256dh,auth_secret)",
    )
    .is("sent_at", null)
    .lte("send_at", new Date(now).toISOString())
    .gt("send_at", new Date(now - STALE_MS).toISOString())
    .order("send_at", { ascending: true })
    .limit(BATCH);
  if (error)
    return Response.json(
      { error: "Dispatch failed." },
      { status: 500, headers: PRIVATE_RESPONSE_HEADERS },
    );

  type Row = {
    id: string;
    title: string;
    body: string;
    url: string;
    device: PushDevice;
  };
  const rows = (data ?? []) as unknown as Row[];
  const results = await pool(rows, 20, (row) =>
    deliver(row.device, {
      title: row.title,
      body: row.body,
      url: row.url,
      kind: "insight",
    }),
  );

  const sent = rows
    .filter((_, i) => results[i] === "sent" || results[i] === "failed")
    .map((r) => r.id);
  const gone = [
    ...new Set(
      rows.filter((_, i) => results[i] === "gone").map((r) => r.device.id),
    ),
  ];
  if (sent.length)
    await admin
      .from("atlas_push_messages")
      .update({ sent_at: new Date().toISOString() })
      .in("id", sent);
  if (gone.length)
    await admin.from("atlas_push_devices").delete().in("id", gone);

  const count = (k: string) => results.filter((r) => r === k).length;
  return Response.json(
    {
      due: rows.length,
      sent: count("sent"),
      failed: count("failed"),
      retry: count("retry"),
      removed: gone.length,
    },
    { headers: PRIVATE_RESPONSE_HEADERS },
  );
}
