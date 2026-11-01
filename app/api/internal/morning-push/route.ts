import { sendDueMorningPushes } from "@/lib/push/morning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const responseHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: responseHeaders });
}

/** Vercel Cron (every 15 minutes): morning reading alerts for the Android app. */
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (
    !expected ||
    request.headers.get("authorization") !== `Bearer ${expected}`
  ) {
    return json({ error: "Unauthorized." }, 401);
  }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    return json({ ok: true, skipped: "push_not_configured" });

  try {
    const summary = await sendDueMorningPushes({ deadlineMs: 240_000 });
    console.log(
      JSON.stringify({
        level: "info",
        message: "Morning push run complete",
        ...summary,
      }),
    );
    return json({ ok: true, ...summary });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Morning push run failed",
        code:
          error instanceof Error
            ? error.message.slice(0, 80)
            : "MORNING_PUSH_FAILED",
      }),
    );
    return json({ ok: false, error: "Morning push run failed." }, 500);
  }
}
