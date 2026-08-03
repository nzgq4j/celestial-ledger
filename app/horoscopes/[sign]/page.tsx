import Link from "next/link";
import { notFound } from "next/navigation";
import { dailySkyFor, zodiacSlugs } from "@/lib/horoscopes/daily";

export const revalidate = 3600;
export function generateStaticParams() {
  return zodiacSlugs.map((sign) => ({ sign }));
}

export default async function HoroscopeDetailPage({
  params,
}: {
  params: Promise<{ sign: string }>;
}) {
  const { sign: slug } = await params;
  const sky = dailySkyFor();
  const reading = sky.horoscopes.find(
    (item) => item.slug === slug.toLowerCase(),
  );
  if (!reading) notFound();
  return (
    <main className="page-shell horoscope-detail">
      <Link className="horoscope-back" href="/horoscopes">
        ← All daily horoscopes
      </Link>
      <header>
        <span className="horoscope-detail__glyph" aria-hidden="true">
          {reading.glyph}
        </span>
        <div>
          <p className="eyebrow">{reading.displayDate} · Sun sign reading</p>
          <h1>{reading.sign} daily horoscope</h1>
          <p>{reading.theme}</p>
        </div>
      </header>
      <section className="horoscope-reading">
        <article className="horoscope-reading__lead">
          <p>{reading.overview}</p>
        </article>
        <article>
          <h2>Relationships and connection</h2>
          <p>{reading.relationships}</p>
        </article>
        <article>
          <h2>Work, purpose, and practical movement</h2>
          <p>{reading.work}</p>
        </article>
        <article>
          <h2>Wellbeing rhythm</h2>
          <p>{reading.wellbeing}</p>
        </article>
        <article className="horoscope-guidance">
          <div>
            <h2>Opportunity</h2>
            <p>{reading.opportunity}</p>
          </div>
          <div>
            <h2>Watch for</h2>
            <p>{reading.caution}</p>
          </div>
        </article>
        <article className="horoscope-question">
          <p className="section-kicker">Question for the day</p>
          <h2>{reading.question}</h2>
        </article>
      </section>
      <aside className="horoscope-evidence">
        <p className="eyebrow">Why this reading</p>
        <h2>Today’s celestial evidence</h2>
        <ul>
          {reading.evidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          Calculated for 12:00 UTC using Astronomy Engine and interpreted
          through a tropical, whole-sign Sun-chart layer.
        </p>
      </aside>
    </main>
  );
}
