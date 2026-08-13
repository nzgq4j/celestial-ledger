import Link from "next/link";
import { NatalChartWheel } from "@/components/NatalChartWheel";
import { NatalInterpretation } from "@/components/NatalInterpretation";
import { createPageMetadata } from "@/lib/seo";
import { sampleNatalInterpretation } from "@/lib/sample-reports/natal-chart";
import { sampleChart, sampleIdentity } from "@/lib/samples";
import type { Placement } from "@/lib/types";

export const metadata = createPageMetadata({
  title: "Complete Sample Natal Chart",
  description:
    "Explore a complete calculated natal chart with the chart wheel, angles, planetary positions, houses, aspects and a full interpretation.",
  path: "/samples/natal-chart",
  keywords: [
    "sample natal chart",
    "complete birth chart example",
    "natal chart interpretation",
  ],
});

function position(placement: Placement | undefined) {
  if (!placement) return "Not available";
  return `${placement.degree}° ${String(placement.minute).padStart(2, "0")}′ ${placement.sign}`;
}

export default async function SampleNatalChartPage() {
  const chart = await sampleChart();
  const sun = chart.placements.find((item) => item.name === "Sun");
  const moon = chart.placements.find((item) => item.name === "Moon");
  const anchors = [
    {
      label: "Sun",
      glyph: "☉",
      position: position(sun),
      note: "Gemini in the eleventh house",
    },
    {
      label: "Moon",
      glyph: "☽",
      position: position(moon),
      note: "Sagittarius in the fifth house",
    },
    {
      label: "Ascendant",
      glyph: "AC",
      position: position(chart.ascendant),
      note: "Cancer rising",
    },
    {
      label: "Midheaven",
      glyph: "MC",
      position: position(chart.midheaven),
      note: "Pisces at the public angle",
    },
  ];

  return (
    <main className="page-shell sample-natal-chart">
      <Link href="/samples" className="horoscope-back">
        ← All sample editions
      </Link>

      <header className="sample-natal-chart__hero">
        <div>
          <p className="eyebrow">Complete calculated edition</p>
          <h1>Natal Chart</h1>
          <p>
            A full reading of one birth chart, from its defining angles and
            planetary pattern to the houses, aspects and larger story they form
            together.
          </p>
        </div>
        <dl>
          <div>
            <dt>Sample subject</dt>
            <dd>
              {sampleIdentity.name} · {sampleIdentity.sex}
            </dd>
          </div>
          <div>
            <dt>Birth</dt>
            <dd>
              <time dateTime="1967-05-24T08:43:00-05:00">
                {sampleIdentity.born}
              </time>
            </dd>
          </div>
          <div>
            <dt>Place</dt>
            <dd>{sampleIdentity.place}</dd>
          </div>
          <div>
            <dt>Chart basis</dt>
            <dd>
              {chart.calculation.zodiac} zodiac ·{" "}
              {chart.calculation.houseSystem}
            </dd>
          </div>
        </dl>
      </header>

      <section
        className="sample-natal-chart__anchors"
        aria-labelledby="anchors-title"
      >
        <header>
          <p className="section-kicker">The four chart anchors</p>
          <h2 id="anchors-title">The structure at first sight</h2>
        </header>
        <div>
          {anchors.map((anchor) => (
            <article key={anchor.label}>
              <span aria-hidden="true">{anchor.glyph}</span>
              <p>{anchor.label}</p>
              <h3>{anchor.position}</h3>
              <small>{anchor.note}</small>
            </article>
          ))}
        </div>
      </section>

      <NatalChartWheel chart={chart} />

      <section
        className="sample-natal-chart__interpretation"
        aria-labelledby="interpretation-title"
      >
        <header>
          <p className="eyebrow">Full interpretation</p>
          <h2 id="interpretation-title">Reading the chart as a whole</h2>
          <p>
            Each chapter begins with a distinct part of the chart, then follows
            the relationships between placements so the reading develops as one
            connected portrait.
          </p>
        </header>
        <article>
          <NatalInterpretation text={sampleNatalInterpretation} />
        </article>
      </section>

      <section className="sample-chart-data" id="chart-data">
        <header>
          <p className="eyebrow">Complete chart appendix</p>
          <h2>Positions, houses, angles and aspects</h2>
          <p>
            Calculated for 24 May 1967 at 8:43 AM in Tuscaloosa, Alabama. The
            corresponding UTC time is {chart.utc}.
          </p>
        </header>

        <div className="sample-chart-data__tables">
          <div className="sample-natal-chart__table-wrap">
            <table>
              <caption>Planetary positions</caption>
              <thead>
                <tr>
                  <th>Point</th>
                  <th>Position</th>
                  <th>House</th>
                  <th>Motion</th>
                </tr>
              </thead>
              <tbody>
                {chart.placements.map((item) => (
                  <tr key={item.name}>
                    <th>{item.name}</th>
                    <td>{position(item)}</td>
                    <td>{item.house}</td>
                    <td>{item.retrograde ? "Retrograde" : "Direct"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <div className="sample-natal-chart__table-wrap">
              <table>
                <caption>Angles</caption>
                <thead>
                  <tr>
                    <th>Angle</th>
                    <th>Position</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>Ascendant</th>
                    <td>{position(chart.ascendant)}</td>
                  </tr>
                  <tr>
                    <th>Midheaven</th>
                    <td>{position(chart.midheaven)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="sample-natal-chart__table-wrap">
              <table>
                <caption>House cusps</caption>
                <thead>
                  <tr>
                    <th>House</th>
                    <th>Cusp</th>
                  </tr>
                </thead>
                <tbody>
                  {chart.houses.map((house) => (
                    <tr key={house.house}>
                      <th>{house.house}</th>
                      <td>
                        {house.degree}° {String(house.minute).padStart(2, "0")}′{" "}
                        {house.sign}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="sample-natal-chart__table-wrap">
          <table>
            <caption>Major aspects</caption>
            <thead>
              <tr>
                <th>First point</th>
                <th>Aspect</th>
                <th>Second point</th>
                <th>Orb</th>
              </tr>
            </thead>
            <tbody>
              {chart.aspects.map((aspect, index) => (
                <tr key={`${aspect.body1}-${aspect.body2}-${index}`}>
                  <th>{aspect.body1}</th>
                  <td>{aspect.type}</td>
                  <td>{aspect.body2}</td>
                  <td>{aspect.orb.toFixed(2)}°</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="sample-natal-chart__calculation">
          <div>
            <dt>Ephemeris</dt>
            <dd>{chart.calculation.ephemeris}</dd>
          </div>
          <div>
            <dt>Engine</dt>
            <dd>{chart.calculation.engineVersion}</dd>
          </div>
          <div>
            <dt>Calculation version</dt>
            <dd>{chart.calculation.calculationVersion}</dd>
          </div>
          <div>
            <dt>Coordinates</dt>
            <dd>
              {chart.input.place.latitude}, {chart.input.place.longitude}
            </dd>
          </div>
        </dl>
      </section>

      <aside className="sample-natal-chart__cta">
        <div>
          <p className="eyebrow">Your chart begins with your sky</p>
          <h2>Create your own natal chart.</h2>
          <p>
            Enter your birth details to calculate your planetary positions,
            angles, houses and aspects.
          </p>
        </div>
        <Link href="/#chart" className="button-primary">
          Create my free natal chart
        </Link>
      </aside>
    </main>
  );
}
