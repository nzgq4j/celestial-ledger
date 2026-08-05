import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dailySkyFor, zodiacSlugs } from "@/lib/horoscopes/daily";
import { isLocaleTag } from "@/lib/i18n/config";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { HoroscopeDayArc } from "@/components/horoscopes/horoscope-day-arc";
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
  const sky = dailySkyFor(new Date(), pack.tag);
  const reading = sky.horoscopes.find(
    (item) => item.slug === value.toLowerCase(),
  );
  if (!reading) return {};
  const route = `/horoscopes/${reading.slug}`;
  const path = localizedPublicUrl(route, pack.tag);
  const publishedAt = `${sky.date}T00:00:00.000Z`;
  const metadata = createPageMetadata({
    title: `${reading.sign} ${pack.messages.horoscopes.dailyHoroscope} — ${reading.displayDate}`,
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
  const sky = dailySkyFor(new Date(), pack.tag);
  const reading = sky.horoscopes.find(
    (item) => item.slug === slug.toLowerCase(),
  );
  if (!reading) notFound();
  const periodLabels = {
    morning: copy.morning,
    afternoon: copy.afternoon,
    evening: copy.evening,
  };
  const route = `/horoscopes/${reading.slug}`;
  const shareUrl = localizedPublicUrl(route, pack.tag);
  const imageUrl = `${SITE_URL}${route}/opengraph-image`;
  const pinterestImageUrl = `${SITE_URL}${route}/pinterest-image`;
  const title = `${reading.sign} ${copy.dailyHoroscope} — ${reading.displayDate}`;
  const publishedAt = `${sky.date}T00:00:00.000Z`;
  return (
    <main className="page-shell horoscope-detail">
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
      <Link
        className="horoscope-back"
        href={
          pack.tag === "en-GB" ? "/horoscopes" : `/horoscopes?lang=${pack.tag}`
        }
      >
        ← {copy.allHoroscopes}
      </Link>
      <header>
        <span className="horoscope-detail__glyph" aria-hidden="true">
          {reading.glyph}
        </span>
        <div>
          <p className="eyebrow">
            {reading.displayDate} · {copy.sunSignReading}
          </p>
          <h1>
            {reading.sign} — {copy.dailyHoroscope}
          </h1>
          <p>{reading.theme}</p>
        </div>
      </header>
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
      <section className="horoscope-reading">
        <article className="horoscope-reading__lead">
          <p className="section-kicker">{copy.bottomLine}</p>
          <p>{reading.bottomLine}</p>
        </article>
        <HoroscopeDayArc
          heading={copy.dailyArc}
          introduction={copy.dailyArcIntroduction}
          labels={periodLabels}
          parts={reading.dayParts}
        />
        <div className="horoscope-reading__chapters">
          <article>
            <h2>{copy.relationships}</h2>
            <p>{reading.relationships}</p>
          </article>
          <article>
            <h2>{copy.business}</h2>
            <p>{reading.business}</p>
          </article>
          <article>
            <h2>{copy.money}</h2>
            <p>{reading.money}</p>
          </article>
        </div>
        <article className="horoscope-guidance">
          <div>
            <h2>{copy.opportunity}</h2>
            <p>{reading.opportunity}</p>
          </div>
          <div>
            <h2>{copy.watchFor}</h2>
            <p>{reading.caution}</p>
          </div>
        </article>
        <article className="horoscope-question">
          <p className="section-kicker">{copy.questionForDay}</p>
          <h2>{reading.question}</h2>
        </article>
      </section>
      <aside className="horoscope-evidence">
        <p className="eyebrow">{copy.whyReading}</p>
        <h2>{copy.celestialEvidence}</h2>
        <ul>
          {reading.evidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>{copy.calculationNote}</p>
      </aside>
    </main>
  );
}
