import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { isDemoMode, supabasePublicConfig } from "./config";

export async function updateSession(
  request: NextRequest,
  requestHeaders: Headers = request.headers,
) {
  if (isDemoMode())
    return NextResponse.next({ request: { headers: requestHeaders } });
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const { url, publishableKey } = supabasePublicConfig();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({
          request: { headers: requestHeaders },
        });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getClaims();
  return response;
}
