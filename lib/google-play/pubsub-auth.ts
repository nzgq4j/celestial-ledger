import { createPublicKey, verify, type JsonWebKey } from "node:crypto";

/**
 * Verifies the OIDC token Pub/Sub attaches to authenticated push requests
 * (`Authorization: Bearer <jwt>`): RS256 signature against Google's published
 * keys, issuer, audience, service-account email and expiry.
 * https://cloud.google.com/pubsub/docs/authenticate-push-subscriptions
 */
export const GOOGLE_OIDC_CERTS_URL =
  "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = new Set([
  "https://accounts.google.com",
  "accounts.google.com",
]);
const CLOCK_SKEW_SECONDS = 300;

export type GoogleJwk = JsonWebKey & { kid?: string; alg?: string };
export type JwksFetcher = () => Promise<GoogleJwk[]>;

export class PubSubAuthError extends Error {
  constructor(
    public readonly code:
      | "MISSING_TOKEN"
      | "MALFORMED_TOKEN"
      | "UNKNOWN_KEY"
      | "BAD_SIGNATURE"
      | "BAD_ISSUER"
      | "BAD_AUDIENCE"
      | "BAD_EMAIL"
      | "EXPIRED"
      | "NOT_CONFIGURED",
  ) {
    super(code);
  }
}

let cachedKeys: { keys: GoogleJwk[]; expiresAt: number } | null = null;

export const fetchGoogleJwks: JwksFetcher = async () => {
  if (cachedKeys && cachedKeys.expiresAt > Date.now()) return cachedKeys.keys;
  const response = await fetch(GOOGLE_OIDC_CERTS_URL, { cache: "no-store" });
  if (!response.ok) throw new PubSubAuthError("UNKNOWN_KEY");
  const body = (await response.json()) as { keys?: GoogleJwk[] };
  const maxAge = Number(
    /max-age=(\d+)/.exec(response.headers.get("cache-control") ?? "")?.[1] ??
      3600,
  );
  cachedKeys = {
    keys: body.keys ?? [],
    expiresAt: Date.now() + Math.min(maxAge, 86_400) * 1000,
  };
  return cachedKeys.keys;
};

function decodeSegment<T>(segment: string): T {
  try {
    return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as T;
  } catch {
    throw new PubSubAuthError("MALFORMED_TOKEN");
  }
}

export type PubSubClaims = {
  iss?: string;
  aud?: string;
  email?: string;
  email_verified?: boolean;
  exp?: number;
  iat?: number;
};

export async function verifyPubSubOidcToken(
  authorization: string | null,
  options: {
    audience: string | undefined;
    serviceAccountEmail: string | undefined;
    fetchKeys?: JwksFetcher;
    nowSeconds?: number;
  },
): Promise<PubSubClaims> {
  if (!options.audience || !options.serviceAccountEmail)
    throw new PubSubAuthError("NOT_CONFIGURED");
  const match =
    /^Bearer\s+([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(
      authorization ?? "",
    );
  if (!match) throw new PubSubAuthError("MISSING_TOKEN");
  const [, headerSegment, payloadSegment, signatureSegment] = match;
  const header = decodeSegment<{ alg?: string; kid?: string }>(headerSegment);
  if (header.alg !== "RS256" || !header.kid)
    throw new PubSubAuthError("MALFORMED_TOKEN");

  const keys = await (options.fetchKeys ?? fetchGoogleJwks)();
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) throw new PubSubAuthError("UNKNOWN_KEY");
  const valid = verify(
    "RSA-SHA256",
    Buffer.from(`${headerSegment}.${payloadSegment}`),
    createPublicKey({ key: jwk, format: "jwk" }),
    Buffer.from(signatureSegment, "base64url"),
  );
  if (!valid) throw new PubSubAuthError("BAD_SIGNATURE");

  const claims = decodeSegment<PubSubClaims>(payloadSegment);
  const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!claims.iss || !GOOGLE_ISSUERS.has(claims.iss))
    throw new PubSubAuthError("BAD_ISSUER");
  if (claims.aud !== options.audience)
    throw new PubSubAuthError("BAD_AUDIENCE");
  if (
    claims.email !== options.serviceAccountEmail ||
    claims.email_verified !== true
  )
    throw new PubSubAuthError("BAD_EMAIL");
  if (
    typeof claims.exp !== "number" ||
    claims.exp + CLOCK_SKEW_SECONDS < now ||
    (typeof claims.iat === "number" && claims.iat - CLOCK_SKEW_SECONDS > now)
  )
    throw new PubSubAuthError("EXPIRED");
  return claims;
}
