import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSameOrigin, PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";
import { supabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Origins of the Celestial Atlas app's native WebView (Capacitor on Android
 * and iOS). The app authenticates with a bearer token, never cookies, so
 * cross-origin requests from these origins cannot be forged by other sites.
 */
export const APP_ORIGINS = [
  "https://localhost",
  "capacitor://localhost",
] as const;

export type RequestUser = {
  userId: string;
  email: string | null;
  /** Unix seconds of the most recent sign-in on this session, when known. */
  authTime: number | null;
  via: "bearer" | "cookie";
};

export type RequestAuth =
  | { ok: true; user: RequestUser }
  | { ok: false; status: 401 | 403; code: "origin_rejected" | "sign_in_required" };

const BEARER = /^Bearer ([A-Za-z0-9._-]{20,4096})$/;

export function bearerToken(request: Request): string | null {
  const match = BEARER.exec(request.headers.get("authorization") ?? "");
  return match ? match[1] : null;
}

/** CORS headers for the app's native origins; empty for any other origin. */
export function appCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin || !(APP_ORIGINS as readonly string[]).includes(origin))
    return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

/** Private JSON response that carries CORS headers for the app. */
export function appJson(request: Request, body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { ...PRIVATE_RESPONSE_HEADERS, ...appCorsHeaders(request) },
  });
}

/** Answers a CORS preflight from the app. */
export function appPreflight(request: Request) {
  return new Response(null, {
    status: 204,
    headers: { ...PRIVATE_RESPONSE_HEADERS, ...appCorsHeaders(request) },
  });
}

function latestAuthTime(claims: Record<string, unknown>): number | null {
  const amr = claims.amr;
  if (!Array.isArray(amr)) return null;
  const times = amr
    .map((entry) =>
      entry && typeof entry === "object"
        ? (entry as { timestamp?: unknown }).timestamp
        : undefined,
    )
    .filter((t): t is number => typeof t === "number" && Number.isFinite(t));
  return times.length ? Math.max(...times) : null;
}

function toUser(
  claims: Record<string, unknown> | undefined,
  via: RequestUser["via"],
): RequestUser | null {
  const userId = claims?.sub;
  if (typeof userId !== "string" || !userId) return null;
  const email =
    typeof claims?.email === "string" && claims.email.trim()
      ? claims.email
      : null;
  return { userId, email, authTime: latestAuthTime(claims ?? {}), via };
}

/**
 * Authenticates a request from either the app (bearer token, any allowed
 * origin) or the website (session cookie, same origin only).
 */
export async function authenticateRequest(
  request: Request,
): Promise<RequestAuth> {
  const token = bearerToken(request);
  if (token) {
    const { url, publishableKey } = supabasePublicConfig();
    const client = createSupabaseClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await client.auth.getClaims(token);
    const user = error ? null : toUser(data?.claims, "bearer");
    return user
      ? { ok: true, user }
      : { ok: false, status: 401, code: "sign_in_required" };
  }
  if (!isSameOrigin(request))
    return { ok: false, status: 403, code: "origin_rejected" };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const user = error ? null : toUser(data?.claims, "cookie");
  return user
    ? { ok: true, user }
    : { ok: false, status: 401, code: "sign_in_required" };
}
