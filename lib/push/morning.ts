import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendFcmMessage, type FcmMessage, type FcmResult } from "./fcm";
import { MORNING_PUSH_PATH, morningPushCopy } from "./messages";
import { localClock, morningAlertDueOn } from "./schedule";

type Admin = ReturnType<typeof createAdminClient>;
const PAGE_SIZE = 500;
const SEND_CONCURRENCY = 10;

export type MorningPushSummary = {
  scanned: number;
  sent: number;
  removed: number;
  failed: number;
};

/**
 * Sends the morning reading alert to every device whose local time has
 * reached its alert time today and that has not been alerted today.
 * Called by the cron route /api/internal/morning-push (every 15 minutes).
 * Each device is claimed with a conditional update before sending, so
 * overlapping runs never alert twice.
 */
export async function sendDueMorningPushes(
  options: {
    now?: Date;
    admin?: Admin;
    send?: (message: FcmMessage) => Promise<FcmResult>;
    deadlineMs?: number;
  } = {},
): Promise<MorningPushSummary> {
  const now = options.now ?? new Date();
  const admin = options.admin ?? createAdminClient();
  const send = options.send ?? ((message) => sendFcmMessage(message));
  const deadline = Date.now() + (options.deadlineMs ?? 240_000);
  // Anything notified on or after "tomorrow in UTC" is done for every zone.
  const latestDoneDate = localClock(
    new Date(now.getTime() + 14 * 3_600_000),
    "UTC",
  ).date;
  const summary: MorningPushSummary = {
    scanned: 0,
    sent: 0,
    removed: 0,
    failed: 0,
  };

  let cursor = "00000000-0000-0000-0000-000000000000";
  while (Date.now() < deadline) {
    const { data, error } = await admin
      .from("device_push_tokens")
      .select(
        "id,token,locale,timezone,morning_alert_enabled,morning_alert_local_time,last_notified_on",
      )
      .eq("morning_alert_enabled", true)
      .or(`last_notified_on.is.null,last_notified_on.lt.${latestDoneDate}`)
      .gt("id", cursor)
      .order("id")
      .limit(PAGE_SIZE);
    if (error) throw new Error("DEVICE_TOKEN_LOOKUP_FAILED");
    const rows = data ?? [];
    if (!rows.length) break;
    cursor = rows[rows.length - 1].id;
    summary.scanned += rows.length;

    const due = rows
      .map((row) => ({ row, date: morningAlertDueOn(row, now) }))
      .filter((entry): entry is { row: (typeof rows)[number]; date: string } =>
        Boolean(entry.date),
      );
    for (let index = 0; index < due.length; index += SEND_CONCURRENCY) {
      await Promise.all(
        due
          .slice(index, index + SEND_CONCURRENCY)
          .map(async ({ row, date }) => {
            let claim = admin
              .from("device_push_tokens")
              .update({ last_notified_on: date })
              .eq("id", row.id);
            claim = row.last_notified_on
              ? claim.lt("last_notified_on", date)
              : claim.is("last_notified_on", null);
            const { data: claimed } = await claim.select("id");
            if (!claimed?.length) return;
            const copy = morningPushCopy(row.locale);
            let result: FcmResult;
            try {
              result = await send({
                token: row.token,
                title: copy.title,
                body: copy.body,
                url: MORNING_PUSH_PATH,
              });
            } catch {
              result = {
                ok: false,
                unregistered: false,
                retryable: true,
                code: "SEND_FAILED",
              };
            }
            if (result.ok) {
              summary.sent += 1;
            } else if (result.unregistered) {
              await admin.from("device_push_tokens").delete().eq("id", row.id);
              summary.removed += 1;
            } else {
              summary.failed += 1;
              // Release the claim so a transient failure retries next run.
              if (result.retryable)
                await admin
                  .from("device_push_tokens")
                  .update({ last_notified_on: row.last_notified_on })
                  .eq("id", row.id);
            }
          }),
      );
    }
    if (rows.length < PAGE_SIZE) break;
  }
  return summary;
}

/**
 * Hook for the daily reading flow: once a user has opened or generated
 * today's reading, there is no need to alert them today. Marks each of the
 * user's devices as notified for its own local date. Never throws.
 */
export async function suppressMorningPushForToday(
  userId: string,
  options: { now?: Date; admin?: Admin } = {},
): Promise<void> {
  try {
    const now = options.now ?? new Date();
    const admin = options.admin ?? createAdminClient();
    const { data } = await admin
      .from("device_push_tokens")
      .select("id,timezone,last_notified_on")
      .eq("user_id", userId)
      .eq("morning_alert_enabled", true);
    await Promise.all(
      (data ?? []).map((row) => {
        const today = localClock(now, row.timezone).date;
        if (row.last_notified_on && row.last_notified_on >= today)
          return Promise.resolve();
        return admin
          .from("device_push_tokens")
          .update({ last_notified_on: today })
          .eq("id", row.id);
      }),
    );
  } catch {
    // Best effort: an extra alert is better than failing the reading.
  }
}
