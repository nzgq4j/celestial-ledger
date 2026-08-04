import "server-only";

import { cookies } from "next/headers";
import {
  defaultLocale,
  isLocaleTag,
  localeRegistry,
  type TranslationPack,
} from "@/lib/i18n/config";

export const localeCookieName = "celestial-atlas-locale";

export async function getServerTranslationPack(): Promise<TranslationPack> {
  const cookieStore = await cookies();
  const value = cookieStore.get(localeCookieName)?.value;
  const locale = value && isLocaleTag(value) ? value : defaultLocale;
  return localeRegistry[locale].load();
}
