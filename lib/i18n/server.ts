import "server-only";

import { cookies, headers } from "next/headers";
import {
  defaultLocale,
  isLocaleTag,
  localeRegistry,
  localeRequestHeader,
  type TranslationPack,
} from "@/lib/i18n/config";

export const localeCookieName = "celestial-atlas-locale";

export async function getServerTranslationPack(
  requestedLocale?: string,
): Promise<TranslationPack> {
  const requestHeaders = await headers();
  const cookieStore = await cookies();
  const value =
    requestedLocale ??
    requestHeaders.get(localeRequestHeader) ??
    cookieStore.get(localeCookieName)?.value;
  const locale = value && isLocaleTag(value) ? value : defaultLocale;
  return localeRegistry[locale].load();
}
