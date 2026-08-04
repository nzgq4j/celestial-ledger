import Link from "next/link";
import { notFound } from "next/navigation";
import { dailySkyFor, zodiacSlugs } from "@/lib/horoscopes/daily";
import { getServerTranslationPack } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export function generateStaticParams() {
  return zodiacSlugs.map((sign) => ({ sign }));
}

export default async function HoroscopeDetailPage({
  params,
}: {
  params: Promise<{ sign: string }>;
}) {
  const { sign: slug } = await params;
  const pack = await getServerTranslationPack();
  const copy = pack.messages.horoscopes;
  const sky = dailySkyFor(new Date(), pack.tag);
  const reading = sky.horoscopes.find(
    (item) => item.slug === slug.toLowerCase(),
  );
  if (!reading) notFound();
  return (
    <main className="page-shell horoscope-detail">
      <Link className="horoscope-back" href="/horoscopes">
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
      <section className="horoscope-reading">
        <article className="horoscope-reading__lead">
          <p>{reading.overview}</p>
        </article>
        <article>
          <h2>{copy.relationships}</h2>
          <p>{reading.relationships}</p>
        </article>
        <article>
          <h2>{copy.work}</h2>
          <p>{reading.work}</p>
        </article>
        <article>
          <h2>{copy.wellbeing}</h2>
          <p>{reading.wellbeing}</p>
        </article>
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
