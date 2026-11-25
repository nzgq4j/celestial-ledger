import { type NextRequest, NextResponse } from "next/server";

/**
 * OAuth and email-link callback. The app keeps its own session, so the
 * one-time code is handed to it; the app exchanges it with the code verifier
 * it stored when the flow started.
 */
export function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const target = new URL("/profile", request.url);
  if (code && /^[A-Za-z0-9._-]{8,512}$/.test(code))
    target.searchParams.set("code", code);
  return NextResponse.redirect(target, {
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
