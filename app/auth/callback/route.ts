import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { isDemoMode, supabasePublicConfig } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  if (isDemoMode()) {
    return NextResponse.redirect(
      new URL("/auth/login?error=preview_disabled", request.url),
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next");
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/account";

  if (code) {
    const response = NextResponse.redirect(
      new URL(next, "https://www.celestialatlas.app"),
    );
    const { url, publishableKey } = supabasePublicConfig();
    const supabase = createServerClient<Database>(url, publishableKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }

  return NextResponse.redirect(
    new URL("/auth/login?error=oauth_failed", request.url),
  );
}
