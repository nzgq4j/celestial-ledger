import type { DailyReadingAnalysis } from "@/lib/daily-readings/domain";

const zodiacMarks = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

const bodyGlyphs: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
  "North Node": "☊",
};

export function projectLongitude(longitude: number, radius = 39) {
  const angle = ((longitude - 90) * Math.PI) / 180;
  return {
    x: Number((50 + radius * Math.cos(angle)).toFixed(3)),
    y: Number((50 + radius * Math.sin(angle)).toFixed(3)),
  };
}

function formatPosition(position: DailyReadingAnalysis["positions"][number]) {
  return `${position.degreeInSign}° ${position.minuteInSign.toString().padStart(2, "0")}′ ${position.sign}`;
}

export function DailyReadingVisuals({
  analysis,
}: {
  analysis: DailyReadingAnalysis;
}) {
  const number = new Intl.NumberFormat(analysis.locale, {
    maximumFractionDigits: 1,
  });
  const activeTransits = [...analysis.transits]
    .sort((first, second) => second.strength - first.strength)
    .slice(0, 5);
  const illumination = Math.round(analysis.lunarPhase.illumination * 100);

  return (
    <section
      className="daily-reading-visuals"
      aria-labelledby="daily-reading-visuals-title"
    >
      <div className="daily-reading-visuals__heading">
        <div>
          <p className="section-kicker">The sky at the reading moment</p>
          <h2 id="daily-reading-visuals-title">Celestial field</h2>
        </div>
        <p>
          Current positions and the strongest contacts to your natal chart,
          calculated for the reading&apos;s local-noon reference point.
        </p>
      </div>

      <div className="daily-reading-visuals__grid">
        <figure className="daily-sky-map">
          <svg
            viewBox="0 0 100 100"
            role="img"
            aria-labelledby="daily-sky-map-title daily-sky-map-description"
          >
            <title id="daily-sky-map-title">Current planetary positions</title>
            <desc id="daily-sky-map-description">
              A circular zodiac map plotting each calculated current longitude.
            </desc>
            <circle className="daily-sky-map__outer" cx="50" cy="50" r="46" />
            <circle className="daily-sky-map__inner" cx="50" cy="50" r="31" />
            {zodiacMarks.map((sign, index) => {
              const inner = projectLongitude(index * 30, 31);
              const outer = projectLongitude(index * 30, 46);
              const label = projectLongitude(index * 30 + 15, 42.5);
              return (
                <g key={sign}>
                  <line
                    className="daily-sky-map__division"
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                  />
                  <text className="daily-sky-map__sign" x={label.x} y={label.y}>
                    {sign.slice(0, 2).toUpperCase()}
                  </text>
                </g>
              );
            })}
            {analysis.positions.map((position, index) => {
              const point = projectLongitude(
                position.longitudeDegrees,
                34 + (index % 3) * 4,
              );
              const anchor = projectLongitude(position.longitudeDegrees, 29);
              return (
                <g
                  key={position.evidenceId}
                  role="img"
                  tabIndex={0}
                  aria-label={`${position.body}: ${formatPosition(position)}; ${position.motion}`}
                >
                  <line
                    className="daily-sky-map__position-line"
                    x1={anchor.x}
                    y1={anchor.y}
                    x2={point.x}
                    y2={point.y}
                  />
                  <circle
                    className="daily-sky-map__position"
                    cx={point.x}
                    cy={point.y}
                    r="3.1"
                  />
                  <text
                    className="daily-sky-map__glyph"
                    x={point.x}
                    y={point.y}
                  >
                    {bodyGlyphs[position.body] ?? position.body.slice(0, 1)}
                  </text>
                </g>
              );
            })}
            <circle className="daily-sky-map__core" cx="50" cy="50" r="2" />
            <line
              className="daily-sky-map__axis"
              x1="42"
              y1="50"
              x2="58"
              y2="50"
            />
          </svg>
          <figcaption>
            Zodiac longitudes are plotted directly from the recorded ephemeris
            positions. Hover or focus a planetary mark for its exact placement.
          </figcaption>
        </figure>

        <div className="daily-reading-visuals__data">
          <article className="daily-lunar-gauge">
            <div className="daily-lunar-gauge__orb" aria-hidden="true">
              <svg viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="17" pathLength="100" />
                <circle
                  className="daily-lunar-gauge__value"
                  cx="22"
                  cy="22"
                  r="17"
                  pathLength="100"
                  strokeDasharray={`${illumination} ${100 - illumination}`}
                />
              </svg>
              <strong>{illumination}%</strong>
            </div>
            <div>
              <p className="section-kicker">Lunar light</p>
              <h3>{analysis.lunarPhase.name}</h3>
              <p>
                {number.format(analysis.lunarPhase.angleDegrees)}° phase angle ·{" "}
                {illumination}% illuminated
              </p>
              <code>{analysis.lunarPhase.evidenceId}</code>
            </div>
          </article>

          <section
            className="daily-transit-field"
            aria-labelledby="transit-field-title"
          >
            <div className="daily-transit-field__title">
              <div>
                <p className="section-kicker">Ranked by strength</p>
                <h3 id="transit-field-title">Active transit field</h3>
              </div>
              <span>{activeTransits.length} contacts</span>
            </div>
            <ol>
              {activeTransits.map((transit) => {
                const strength = Math.round(transit.strength * 100);
                return (
                  <li key={transit.evidenceId}>
                    <div>
                      <strong>
                        {transit.transitingBody} {transit.aspect.toLowerCase()}{" "}
                        {transit.natalTarget}
                      </strong>
                      <span>
                        {transit.state} · {transit.orbDegrees.toFixed(2)}° orb
                      </span>
                    </div>
                    <div
                      className="daily-transit-field__bar"
                      role="img"
                      aria-label={`${strength}% relative strength`}
                    >
                      <span style={{ width: `${strength}%` }} />
                    </div>
                    <code>{transit.evidenceId}</code>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </div>
    </section>
  );
}
