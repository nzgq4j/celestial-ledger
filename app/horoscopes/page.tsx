import Link from "next/link";
import { dailySkyFor } from "@/lib/horoscopes/daily";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { localizeAstroTerm } from "@/lib/reports/evidence-label";

export const dynamic = "force-dynamic";

export default async function DailyHoroscopesPage() {
  const pack = await getServerTranslationPack();
  const copy = pack.messages.horoscopes;
  const sky = dailySkyFor(new Date(), pack.tag);
  return (
    <main className="page-shell daily-horoscopes">
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
            <p>{item.overview}</p>
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
            <Link href={`/horoscopes/${item.slug}`}>
              {copy.readFull} {item.sign} <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
