import type { Metadata } from "next";
import Link from "next/link";
import { dailySkyFor } from "@/lib/horoscopes/daily";
import { isLocaleTag } from "@/lib/i18n/config";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { localizeAstroTerm } from "@/lib/reports/evidence-label";
import { HoroscopeDayArc } from "@/components/horoscopes/horoscope-day-arc";
import { HoroscopeMidnightRefresh } from "@/components/horoscopes/horoscope-midnight-refresh";
import {
  createPageMetadata,
  localizedAlternates,
  localizedPublicUrl,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type HoroscopePageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export async function generateMetadata({
  searchParams,
}: HoroscopePageProps): Promise<Metadata> {
  const { lang } = await searchParams;
  const requestedLocale = lang && isLocaleTag(lang) ? lang : undefined;
  const pack = await getServerTranslationPack(requestedLocale);
  const copy = pack.messages.horoscopes;
  const sky = dailySkyFor(new Date(), pack.tag);
  const path = localizedPublicUrl("/horoscopes", pack.tag);
  const metadata = createPageMetadata({
    title: `${copy.title} — ${sky.displayDate}`,
    description: copy.introduction,
    path,
    locale: pack.tag,
    keywords: ["daily sun sign horoscope", "today's horoscope"],
  });
  return {
    ...metadata,
    alternates: {
      canonical: path,
      languages: localizedAlternates("/horoscopes"),
    },
  };
}

export default async function DailyHoroscopesPage({
  searchParams,
}: HoroscopePageProps) {
  const { lang } = await searchParams;
  const requestedLocale = lang && isLocaleTag(lang) ? lang : undefined;
  const pack = await getServerTranslationPack(requestedLocale);
  const copy = pack.messages.horoscopes;
  const sky = dailySkyFor(new Date(), pack.tag);
  const periodLabels = {
    morning: copy.morning,
    afternoon: copy.afternoon,
    evening: copy.evening,
  };
  return (
    <main className="page-shell daily-horoscopes">
      <HoroscopeMidnightRefresh />
      <header className="horoscope-hero">
        <div>
          <p className="eyebrow">
            {copy.almanac} · {sky.displayDate}
          </p>
          <h1>{copy.title}</h1>
        </div>
        <p>{copy.introduction}</p>
      </header>
      <section className="daily-sky-strip" aria-label={copy.todaysSky}>
        {sky.placements.slice(0, 5).map((item) => (
          <span key={item.name}>
            <strong>{localizeAstroTerm(item.name, pack.tag)}</strong>
            {item.degree}° {localizeAstroTerm(item.sign, pack.tag)}
          </span>
        ))}
      </section>
      <section className="horoscope-grid" aria-label={copy.twelveHoroscopes}>
        {sky.horoscopes.map((item) => (
          <article className="horoscope-card" key={item.sign}>
            <div className="horoscope-card__sign">
              <span aria-hidden="true">{item.glyph}</span>
              <div>
                <p>{item.sign}</p>
                <small>{item.theme}</small>
              </div>
            </div>
            <p className="horoscope-card__overview">{item.overview}</p>
            <HoroscopeDayArc
              compact
              heading={copy.dailyArc}
              labels={periodLabels}
              parts={item.dayParts}
            />
            <dl>
              <div>
                <dt>{copy.opportunity}</dt>
                <dd>{item.opportunity}</dd>
              </div>
              <div>
                <dt>{copy.reflection}</dt>
                <dd>{item.question}</dd>
              </div>
            </dl>
            <Link
              className="button-primary horoscope-card__action"
              href={
                pack.tag === "en-GB"
                  ? `/horoscopes/${item.slug}`
                  : `/horoscopes/${item.slug}?lang=${pack.tag}`
              }
            >
              {copy.readFull} {item.sign} <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
