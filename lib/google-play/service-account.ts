import "server-only";
import { createSign } from "node:crypto";
import { z } from "zod";

/**
 * Google service-account OAuth (JWT bearer grant, RFC 7523) signed with
 * node:crypto. Used for the Google Play Developer API and FCM HTTP v1, so the
 * server needs neither firebase-admin nor googleapis.
 *
 * The JSON key comes from a server-only environment variable
 * (`GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, `FIREBASE_SERVICE_ACCOUNT_JSON`). It is
 * never logged and never reaches a browser bundle.
 */
const serviceAccountSchema = z.object({
  type: z.literal("service_account").optional(),
  project_id: z.string().min(1).optional(),
  client_email: z.string().email(),
  private_key: z.string().includes("PRIVATE KEY"),
  token_uri: z.string().url().optional(),
});

export type ServiceAccount = z.infer<typeof serviceAccountSchema>;

export class GoogleAuthError extends Error {
  constructor(
    public readonly code:
      | "SERVICE_ACCOUNT_MISSING"
      | "SERVICE_ACCOUNT_INVALID"
      | "TOKEN_REQUEST_FAILED",
  ) {
    super(code);
  }
}

const GOOGLE_TOKEN_URI = "https://oauth2.googleapis.com/token";

export function parseServiceAccount(raw: string | undefined): ServiceAccount {
  if (!raw?.trim()) throw new GoogleAuthError("SERVICE_ACCOUNT_MISSING");
  let json: unknown;
  try {
    // Accept raw JSON or base64-encoded JSON (easier to paste into Vercel).
    const text = raw.trim().startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");
    json = JSON.parse(text);
  } catch {
    throw new GoogleAuthError("SERVICE_ACCOUNT_INVALID");
  }
  const parsed = serviceAccountSchema.safeParse(json);
  if (!parsed.success) throw new GoogleAuthError("SERVICE_ACCOUNT_INVALID");
  return {
    ...parsed.data,
    // Env stores often escape newlines.
    private_key: parsed.data.private_key.replace(/\\n/g, "\n"),
  };
}

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

export function signServiceAccountJwt(
  account: ServiceAccount,
  scope: string,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: account.client_email,
      scope,
      aud: account.token_uri ?? GOOGLE_TOKEN_URI,
      iat: nowSeconds,
      exp: nowSeconds + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  signer.end();
  return `${header}.${claims}.${base64url(signer.sign(account.private_key))}`;
}

type CachedToken = { token: string; expiresAt: number };
const tokenCache = new Map<string, CachedToken>();

/** Returns a cached OAuth access token for the account and scope. */
export async function getGoogleAccessToken(
  account: ServiceAccount,
  scope: string,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const key = `${account.client_email} ${scope}`;
  const cached = tokenCache.get(key);
  if (cached && cached.expiresAt - 60_000 > Date.now()) return cached.token;

  const response = await fetcher(account.token_uri ?? GOOGLE_TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signServiceAccountJwt(account, scope),
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new GoogleAuthError("TOKEN_REQUEST_FAILED");
  const body = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!body.access_token) throw new GoogleAuthError("TOKEN_REQUEST_FAILED");
  tokenCache.set(key, {
    token: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
  });
  return body.access_token;
}

export function clearGoogleAccessTokenCache() {
  tokenCache.clear();
}
