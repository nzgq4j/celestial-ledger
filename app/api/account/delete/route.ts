import { z } from "zod";
import { readLimitedJson } from "@/lib/api-security";
import { appJson, appPreflight, authenticateRequest } from "@/lib/request-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Deletion needs a sign-in within this window, in place of re-entering a password. */
export const RECENT_SIGN_IN_SECONDS = 15 * 60;

const schema = z.object({ confirmation: z.literal("DELETE") }).strict();

export const OPTIONS = appPreflight;

/**
 * Deletes the signed-in account. The profile, journal and other owner data
 * are removed by the database's cascading rules.
 */
export async function POST(request: Request) {
  const fail = (code: string, error: string, status: number) =>
    appJson(request, { code, error }, status);

  const auth = await authenticateRequest(request);
  if (!auth.ok)
    return fail(auth.code.toUpperCase(), "Sign in first.", auth.status);
  const { userId, authTime } = auth.user;

  let body: unknown;
  try {
    body = await readLimitedJson(request, 256);
  } catch {
    return fail("INVALID_REQUEST", "Invalid request.", 400);
  }
  if (!schema.safeParse(body).success)
    return fail("CONFIRMATION_REQUIRED", "Type DELETE to confirm.", 422);

  const now = Math.floor(Date.now() / 1000);
  if (!authTime || now - authTime > RECENT_SIGN_IN_SECONDS)
    return fail(
      "REAUTH_REQUIRED",
      "Sign in again to delete your account.",
      401,
    );

  const admin = createAdminClient();
  // A subscription that will renew must be cancelled first, or it would keep billing.
  const { data: renewing } = await admin
    .from("account_subscriptions")
    .select("provider")
    .eq("user_id", userId)
    .in("status", ["incomplete", "trialing", "active", "past_due", "paused"])
    .eq("cancel_at_period_end", false)
    .maybeSingle();
  if (renewing)
    return fail(
      "ACTIVE_SUBSCRIPTION",
      "Cancel Atlas+ before deleting your account.",
      409,
    );

  // Deleting the user also ends its sessions.
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Account deletion failed",
        code: error.code ?? "UNKNOWN",
      }),
    );
    return fail(
      "DELETE_BLOCKED",
      "Your account could not be deleted automatically. Contact us and we will remove it.",
      409,
    );
  }
  return appJson(request, { deleted: true });
}
