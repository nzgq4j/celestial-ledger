import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { isLocaleTag, localeRequestHeader } from "@/lib/i18n/config";

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const requestedLocale = request.nextUrl.searchParams.get("lang");
  if (requestedLocale && isLocaleTag(requestedLocale))
    requestHeaders.set(localeRequestHeader, requestedLocale);
  return updateSession(request, requestHeaders);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
