import "server-only";

import { getAdminSettings } from "@/lib/admin/settings";

export async function verifyRecaptcha(
  token: string | undefined,
  remoteIp?: string,
  expectedAction = "marketing_subscribe",
) {
  const settings = await getAdminSettings();
  if (!settings.recaptcha.enabled) return true;
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret || !token) {
    console.warn("[recaptcha] Verification unavailable", {
      reason: !secret ? "missing_secret" : "missing_token",
      expectedAction,
    });
    return false;
  }
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);
  const response = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    },
  );
  if (!response.ok) {
    console.warn("[recaptcha] Verification request failed", {
      status: response.status,
      expectedAction,
    });
    return false;
  }
  const result = (await response.json()) as {
    success?: boolean;
    score?: number;
    action?: string;
    hostname?: string;
    "error-codes"?: string[];
  };
  const accepted =
    result.success === true &&
    (result.action === undefined || result.action === expectedAction) &&
    (result.score === undefined || result.score >= 0.5);
  if (!accepted) {
    console.warn("[recaptcha] Verification rejected", {
      success: result.success === true,
      score: result.score,
      action: result.action,
      expectedAction,
      hostname: result.hostname,
      errorCodes: result["error-codes"] ?? [],
    });
  }
  return accepted;
}
