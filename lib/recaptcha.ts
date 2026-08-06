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
  if (!secret || !token) return false;
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
  if (!response.ok) return false;
  const result = (await response.json()) as {
    success?: boolean;
    score?: number;
    action?: string;
  };
  return (
    result.success === true &&
    (result.action === undefined || result.action === expectedAction) &&
    (result.score === undefined || result.score >= 0.5)
  );
}
