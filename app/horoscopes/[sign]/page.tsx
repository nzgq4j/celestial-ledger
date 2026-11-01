import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { zodiacSlugs } from "@/lib/horoscopes/daily";
import { publishedDailySky } from "@/lib/horoscopes/generated";
import { isLocaleTag } from "@/lib/i18n/config";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { HoroscopeMidnightRefresh } from "@/components/horoscopes/horoscope-midnight-refresh";
import { HoroscopeDayArc } from "@/components/horoscopes/horoscope-day-arc";
import {
  HoroscopeSignPicker,
  HoroscopeUpsell,
  localizedHoroscopePath,
} from "@/components/horoscopes/horoscope-layout";
import { SocialShareLinks } from "@/components/SocialShareLinks";
import { StructuredData } from "@/components/StructuredData";
import {
  createPageMetadata,
  localizedAlternates,
  localizedPublicUrl,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

export const dynamic = "force-dynamic";
export function generateStaticParams() {
  return zodiacSlugs.map((sign) => ({ sign }));
}

type HoroscopeDetailProps = {
  params: Promise<{ sign: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: HoroscopeDetailProps): Promise<Metadata> {
  const [{ sign: value }, { lang }] = await Promise.all([params, searchParams]);
  const requestedLocale = lang && isLocaleTag(lang) ? lang : undefined;
  const pack = await getServerTranslationPack(requestedLocale);
  const sky = await publishedDailySky(new Date(), pack.tag);
  const reading = sky.horoscopes.find(
    (item) => item.slug === value.toLowerCase(),
  );
  if (!reading) return {};
  const route = `/horoscopes/${reading.slug}`;
  const path = localizedPublicUrl(route, pack.tag);
  const publishedAt = `${sky.date}T00:00:00.000Z`;
  const metadata = createPageMetadata({
    title: `${reading.sign} ${pack.messages.horoscopes.dailyHoroscope} | ${reading.displayDate}`,
    description: reading.bottomLine,
    path,
    locale: pack.tag,
    type: "article",
    image: `${route}/opengraph-image`,
    publishedTime: publishedAt,
    modifiedTime: publishedAt,
    keywords: [`${reading.sign} horoscope`, `${reading.sign} daily reading`],
  });
  return {
    ...metadata,
    alternates: { canonical: path, languages: localizedAlternates(route) },
  };
}

export default async function HoroscopeDetailPage({
  params,
  searchParams,
}: HoroscopeDetailProps) {
  const [{ sign: slug }, { lang }] = await Promise.all([params, searchParams]);
  const requestedLocale = lang && isLocaleTag(lang) ? lang : undefined;
  const pack = await getServerTranslationPack(requestedLocale);
  const copy = pack.messages.horoscopes;
  const sky = await publishedDailySky(new Date(), pack.tag);
  const reading = sky.horoscopes.find(
    (item) => item.slug === slug.toLowerCase(),
  );
  if (!reading) notFound();
  const route = `/horoscopes/${reading.slug}`;
  const shareUrl = localizedPublicUrl(route, pack.tag);
  const imageUrl = `${SITE_URL}${route}/opengraph-image`;
  const pinterestImageUrl = `${SITE_URL}${route}/pinterest-image`;
  const title = `${reading.sign} ${copy.dailyHoroscope} | ${reading.displayDate}`;
  const publishedAt = `${sky.date}T00:00:00.000Z`;
  const periodLabels = {
    morning: copy.morning,
    afternoon: copy.afternoon,
    evening: copy.evening,
  };
  return (
    <main className="atlas-shell sign-page">
      <HoroscopeMidnightRefresh />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description: reading.bottomLine,
          image: [imageUrl],
          datePublished: publishedAt,
          dateModified: publishedAt,
          inLanguage: pack.tag,
          mainEntityOfPage: shareUrl,
          author: { "@type": "Organization", name: SITE_NAME },
          publisher: { "@type": "Organization", name: SITE_NAME },
        }}
      />
      <nav className="sign-breadcrumb" aria-label="Breadcrumb">
        <Link href={localizedHoroscopePath("/horoscopes", pack.tag)}>
          {copy.allHoroscopes}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{reading.sign}</span>
      </nav>
      <header className="sign-page__header">
        <p className="atlas-kicker">
          {copy.pageKicker} · {reading.displayDate}
        </p>
        <h1 className="atlas-page-title">
          <span className="sign-page__glyph" aria-hidden="true">
            {reading.glyph}
          </span>
          {reading.sign} <em>{copy.dailyHoroscope}</em>
        </h1>
        <p className="sign-page__intro">{reading.theme}</p>
      </header>
      <HoroscopeSignPicker
        horoscopes={sky.horoscopes}
        locale={pack.tag}
        label={copy.signPicker}
        selectedSlug={reading.slug}
      />
      <article className="sign-reading">
        <section className="atlas-card atlas-card--feature sign-reading__lead">
          <p className="atlas-kicker">
            {copy.bottomLineLabel.replace("{sign}", reading.sign)}
          </p>
          <h2
            className={`sign-reading__headline${reading.bottomLine.length > 120 ? " sign-reading__headline--long" : ""}`}
          >
            {reading.bottomLine}
          </h2>
          <HoroscopeDayArc
            parts={reading.dayParts}
            labels={periodLabels}
            heading={copy.dailyArc}
            introduction={copy.dailyArcIntroduction}
          />
        </section>
        <div className="sign-reading__areas">
          {[
            [copy.areaRelationships, reading.relationships],
            [copy.areaWork, reading.business],
            [copy.areaMoney, reading.money],
            [copy.areaWellbeing, reading.wellbeing],
          ].map(([label, text]) => (
            <section className="sign-area" key={label}>
              <h2>{label}</h2>
              <p>{text}</p>
            </section>
          ))}
          <HoroscopeUpsell copy={copy} />
        </div>
      </article>
      <section className="sign-guidance" aria-label={copy.whyReading}>
        <article className="sign-area">
          <h2>{copy.opportunity}</h2>
          <p>{reading.opportunity}</p>
        </article>
        <article className="sign-area">
          <h2>{copy.watchFor}</h2>
          <p>{reading.caution}</p>
        </article>
        <article className="sign-area sign-area--question">
          <h2>{copy.questionForDay}</h2>
          <p>{reading.question}</p>
        </article>
      </section>
      <div className="sign-footer">
        <aside className="sign-evidence">
          <p className="atlas-kicker">{copy.whyReading}</p>
          <h2>{copy.celestialEvidence}</h2>
          <ul>
            {reading.evidence.map((item) => (
              <li key={item} className="atlas-evidence">
                {item}
              </li>
            ))}
          </ul>
          <p>{copy.calculationNote}</p>
        </aside>
        <SocialShareLinks
          url={shareUrl}
          sign={reading.sign}
          title={title}
          description={reading.bottomLine}
          landscapeImageUrl={imageUrl}
          portraitImageUrl={pinterestImageUrl}
          heading={copy.shareReading}
          copyLabel={copy.copyLink}
          copiedLabel={copy.linkCopied}
        />
      </div>
    </main>
  );
}
