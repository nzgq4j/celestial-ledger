import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";
import "@/app/styles/atlas-public.css";

export const metadata = createPageMetadata({
  title: "Our Astrological Method",
  description:
    "How Celestial Atlas reads the Western tropical zodiac, planetary placements, equal houses, aspects, and the living pattern of a natal chart.",
  path: "/method",
  keywords: [
    "astrology method",
    "ephemeris",
    "tropical zodiac",
    "equal houses",
  ],
});

export default function MethodPage() {
  return (
    <main className="atlas-shell public-page">
      <header className="public-page__hero">
        <p className="atlas-kicker">Our method</p>
        <h1 className="atlas-page-title">
          The sky is measured. The chart is read.
        </h1>
        <p>
          Celestial Atlas works within Western tropical astrology, joining the
          visible order of the heavens to the ancient language of planets,
          signs, houses, and aspects.
        </p>
      </header>

      <section className="public-grid">
        <article className="public-card">
          <span aria-hidden="true">☉</span>
          <p className="atlas-kicker">The zodiac</p>
          <h2>Tropical signs</h2>
          <p>
            The zodiac begins at the March equinox and follows the twelve signs
            through the seasonal wheel. Each sign gives a planet its manner,
            temperament, and way of moving through life.
          </p>
        </article>
        <article className="public-card">
          <span aria-hidden="true">↟</span>
          <p className="atlas-kicker">The earthly horizon</p>
          <h2>Ascendant and houses</h2>
          <p>
            When birth time is known, the Ascendant opens the chart and twelve
            equal houses unfold from it. They locate celestial forces within the
            lived territories of identity, relationship, work, home, and
            calling.
          </p>
        </article>
        <article className="public-card">
          <span aria-hidden="true">△</span>
          <p className="atlas-kicker">The conversation</p>
          <h2>Major aspects</h2>
          <p>
            Conjunctions, oppositions, trines, squares, and sextiles reveal how
            planets meet one another—where their powers combine, challenge,
            support, or awaken the chart&apos;s deeper tensions.
          </p>
        </article>
      </section>

      <section className="public-steps">
        <div>
          <p className="atlas-kicker">From first breath to personal atlas</p>
          <h2 className="atlas-section-title">
            Every reading begins with the whole chart.
          </h2>
        </div>
        <ol>
          <li>
            <strong>The moment is placed</strong>
            <p>
              Birth date, local time, birthplace, historical timezone, and
              coordinates establish the precise celestial moment and horizon.
            </p>
          </li>
          <li>
            <strong>The natal pattern is drawn</strong>
            <p>
              Planetary longitudes, the lunar node, Ascendant, Midheaven,
              houses, and major aspects are assembled into one chart.
            </p>
          </li>
          <li>
            <strong>The symbols are brought together</strong>
            <p>
              A reading follows relationships across the chart rather than
              treating placements as isolated fragments. Every theme returns to
              the celestial factors from which it arose.
            </p>
          </li>
        </ol>
      </section>

      <aside className="public-callout">
        <p className="atlas-kicker">When birth time is unknown</p>
        <h2>The planets still speak, but the horizon remains veiled.</h2>
        <p>
          Celestial Atlas preserves the planetary and aspect pattern while
          leaving the Ascendant, Midheaven, and houses unassigned. It never
          invents an angle for a time that was not recorded.
        </p>
      </aside>

      <aside className="public-callout">
        <p className="atlas-kicker">A private celestial record</p>
        <h2>Privacy belongs to the method.</h2>
        <p>
          Celestial Atlas is private by design. Personal charts and readings are
          kept within the account that owns them, with access limited to their
          owner. Birth data never appears in URLs, keeping the details of your
          first moment out of links, browser history, and shared addresses.
        </p>
      </aside>

      <div className="public-actions">
        <Link href="/#chart" className="atlas-button">
          Create my free natal chart
        </Link>
        <Link href="/reports" className="atlas-button-ghost">
          Explore personal readings
        </Link>
      </div>
    </main>
  );
}
