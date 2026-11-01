import Link from "next/link";
import type { DailyHoroscope } from "@/lib/horoscopes/daily";
import type { LocaleTag } from "@/lib/i18n/config";
import { isDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import "@/app/styles/atlas-public.css";

/** Conventional tropical Sun-sign start dates (month, day), Aries first. */
const SIGN_STARTS = [
  [3, 21],
  [4, 20],
  [5, 21],
  [6, 21],
  [7, 23],
  [8, 23],
  [9, 23],
  [10, 23],
  [11, 22],
  [12, 22],
  [1, 20],
  [2, 19],
] as const;

/** Localised date range for a Sun sign, e.g. "21 Mar – 19 Apr". */
export function signDateRange(index: number, locale: LocaleTag) {
  const [startMonth, startDay] = SIGN_STARTS[index];
  const [nextMonth, nextDay] = SIGN_STARTS[(index + 1) % 12];
  const start = new Date(Date.UTC(2001, startMonth - 1, startDay));
  const end = new Date(Date.UTC(2001, nextMonth - 1, nextDay - 1));
  const format = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return `${format.format(start)} – ${format.format(end)}`;
}

export function localizedHoroscopePath(path: string, locale: LocaleTag) {
  return locale === "en-GB" ? path : `${path}?lang=${locale}`;
}

/** The 12-sign picker shared by the index and every sign page. */
export function HoroscopeSignPicker({
  horoscopes,
  locale,
  label,
  selectedSlug,
}: {
  horoscopes: DailyHoroscope[];
  locale: LocaleTag;
  label: string;
  selectedSlug?: string;
}) {
  return (
    <nav className="sign-picker" aria-label={label}>
      <ul>
        {horoscopes.map((item, index) => (
          <li key={item.slug}>
            <Link
              href={localizedHoroscopePath(`/horoscopes/${item.slug}`, locale)}
              aria-current={item.slug === selectedSlug ? "page" : undefined}
              className="sign-picker__sign"
            >
              <span className="sign-picker__glyph" aria-hidden="true">
                {item.glyph}
              </span>
              <span className="sign-picker__name">{item.sign}</span>
              <span className="sign-picker__dates">
                {signDateRange(index, locale)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * The dashed "your whole chart" card. Signed-in readers go to Today; everyone
 * else is sent to the free chart calculator.
 */
export async function HoroscopeUpsell({
  copy,
}: {
  copy: Record<string, string>;
}) {
  const signedIn = await hasSession();
  return (
    <aside className="sign-upsell">
      <p>{copy.upsellCopy}</p>
      <Link className="atlas-button" href={signedIn ? "/account" : "/#chart"}>
        {signedIn ? copy.upsellSignedIn : copy.upsellSignedOut}
      </Link>
    </aside>
  );
}

async function hasSession() {
  if (isDemoMode()) return false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    return !error && typeof data?.claims?.sub === "string";
  } catch {
    return false;
  }
}
