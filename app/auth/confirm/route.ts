import { type NextRequest, NextResponse } from "next/server";

const TYPES = new Set([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

/**
 * Email confirmation links ({{ .SiteURL }}/auth/confirm?token_hash=…&type=…).
 * The token is moved into the URL fragment, which browsers never send to a
 * server, and the app verifies it with its own session.
 */
export function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const target = new URL("/profile", request.url);
  if (
    tokenHash &&
    /^[A-Za-z0-9_-]{8,512}$/.test(tokenHash) &&
    type &&
    TYPES.has(type)
  )
    target.hash = new URLSearchParams({
      token_hash: tokenHash,
      type,
    }).toString();
  return NextResponse.redirect(target, {
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
