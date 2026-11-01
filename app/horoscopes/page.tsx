import type { Metadata } from "next";
import Link from "next/link";
import { publishedDailySky } from "@/lib/horoscopes/generated";
import { isLocaleTag } from "@/lib/i18n/config";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { localizeAstroTerm } from "@/lib/reports/evidence-label";
import { HoroscopeMidnightRefresh } from "@/components/horoscopes/horoscope-midnight-refresh";
import { HoroscopeDayArc } from "@/components/horoscopes/horoscope-day-arc";
import {
  HoroscopeSignPicker,
  HoroscopeUpsell,
  localizedHoroscopePath,
} from "@/components/horoscopes/horoscope-layout";
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
  const sky = await publishedDailySky(new Date(), pack.tag);
  const path = localizedPublicUrl("/horoscopes", pack.tag);
  const metadata = createPageMetadata({
    title: `${copy.title} | ${sky.displayDate}`,
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
  const sky = await publishedDailySky(new Date(), pack.tag);
  const periodLabels = {
    morning: copy.morning,
    afternoon: copy.afternoon,
    evening: copy.evening,
  };
  return (
    <main className="atlas-shell sign-page">
      <HoroscopeMidnightRefresh />
      <header className="sign-page__header">
        <p className="atlas-kicker">
          {copy.pageKicker} · {sky.displayDate}
        </p>
        <h1 className="atlas-page-title">{copy.pageTitle}</h1>
        <p className="sign-page__intro">{sky.summary ?? copy.introduction}</p>
        <ul className="sign-sky" aria-label={copy.todaysSky}>
          {sky.placements.slice(0, 5).map((item) => (
            <li key={item.name} className="atlas-chip">
              <strong>{localizeAstroTerm(item.name, pack.tag)}</strong>
              {item.degree}° {localizeAstroTerm(item.sign, pack.tag)}
            </li>
          ))}
        </ul>
      </header>
      <HoroscopeSignPicker
        horoscopes={sky.horoscopes}
        locale={pack.tag}
        label={copy.signPicker}
      />
      <section className="sign-grid" aria-label={copy.twelveHoroscopes}>
        {sky.horoscopes.map((item) => (
          <article className="sign-card" key={item.sign}>
            <header className="sign-card__sign">
              <span aria-hidden="true">{item.glyph}</span>
              <div>
                <h2>{item.sign}</h2>
                <p>{item.theme}</p>
              </div>
            </header>
            <p className="sign-card__overview">{item.overview}</p>
            <HoroscopeDayArc
              parts={item.dayParts}
              labels={periodLabels}
              heading={copy.dailyArc}
              compact
            />
            <dl className="sign-card__notes">
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
              className="atlas-link sign-card__action"
              href={localizedHoroscopePath(
                `/horoscopes/${item.slug}`,
                pack.tag,
              )}
            >
              {copy.readFull} {item.sign} <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </section>
      <HoroscopeUpsell copy={copy} />
    </main>
  );
}
