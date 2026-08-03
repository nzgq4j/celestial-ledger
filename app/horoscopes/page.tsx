import Link from "next/link";
import { dailySkyFor } from "@/lib/horoscopes/daily";

export const revalidate = 3600;

export default function DailyHoroscopesPage() {
  const sky = dailySkyFor();
  return (
    <main className="page-shell daily-horoscopes">
      <header className="horoscope-hero">
        <div>
          <p className="eyebrow">Daily celestial almanac · {sky.displayDate}</p>
          <h1>Daily horoscopes</h1>
        </div>
        <p>
          Choose your Sun sign for a detailed reading of today’s themes,
          relationships, work, wellbeing, opportunities, cautions, and the
          calculated sky behind them.
        </p>
      </header>
      <section className="daily-sky-strip" aria-label="Today's sky">
        {sky.placements.slice(0, 5).map((item) => (
          <span key={item.name}>
            <strong>{item.name}</strong>
            {item.degree}° {item.sign}
          </span>
        ))}
      </section>
      <section className="horoscope-grid" aria-label="Twelve daily horoscopes">
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
                <dt>Opportunity</dt>
                <dd>{item.opportunity}</dd>
              </div>
              <div>
                <dt>Reflection</dt>
                <dd>{item.question}</dd>
              </div>
            </dl>
            <Link href={`/horoscopes/${item.slug}`}>
              Read the full {item.sign} horoscope{" "}
              <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
