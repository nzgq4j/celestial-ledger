"use client";

import type { NatalChart } from "@/lib/types";

const aspectStyle: Record<string, { color: string; opacity: number }> = {
  Conjunction: { color: "var(--gold)", opacity: 0.42 },
  Opposition: { color: "var(--map-red)", opacity: 0.58 },
  Trine: { color: "var(--map-cyan)", opacity: 0.5 },
  Square: { color: "var(--copper)", opacity: 0.55 },
  Sextile: { color: "var(--muted)", opacity: 0.42 },
};
const glyphs: Record<string, string> = {
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

const zodiacSigns = [
  { name: "Aries", glyph: "♈︎" },
  { name: "Taurus", glyph: "♉︎" },
  { name: "Gemini", glyph: "♊︎" },
  { name: "Cancer", glyph: "♋︎" },
  { name: "Leo", glyph: "♌︎" },
  { name: "Virgo", glyph: "♍︎" },
  { name: "Libra", glyph: "♎︎" },
  { name: "Scorpio", glyph: "♏︎" },
  { name: "Sagittarius", glyph: "♐︎" },
  { name: "Capricorn", glyph: "♑︎" },
  { name: "Aquarius", glyph: "♒︎" },
  { name: "Pisces", glyph: "♓︎" },
] as const;

function point(longitude: number, radius: number, center = 210) {
  const angle = ((longitude - 90) * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}

export function NatalChartWheel({ chart }: { chart: NatalChart }) {
  const placementMap = new Map(chart.placements.map((p) => [p.name, p]));
  return (
    <figure className="panel chart-wheel" aria-labelledby="wheel-title">
      <h2 id="wheel-title" className="text-lg font-semibold gold mb-3">
        Natal Chart
      </h2>
      <div className="chart-wheel__layout">
        <svg
          viewBox="0 0 420 420"
          role="img"
          aria-describedby="wheel-desc"
          className="chart-wheel__svg"
        >
          <defs>
            <clipPath id="aspect-field">
              <circle cx="210" cy="210" r="82" />
            </clipPath>
          </defs>
          <circle
            cx="210"
            cy="210"
            r="190"
            fill="var(--surface-field)"
            stroke="var(--gold)"
            strokeWidth="2"
          />
          <circle
            cx="210"
            cy="210"
            r="150"
            fill="none"
            stroke="var(--control-border)"
          />
          <circle cx="210" cy="210" r="85" fill="none" stroke="var(--line)" />
          {Array.from({ length: 12 }, (_, i) => {
            const p1 = point(i * 30, 150),
              p2 = point(i * 30, 190),
              glyphPosition = point(i * 30 + 15, 170),
              tickStart = point(i * 30 + 15, 151),
              tickEnd = point(i * 30 + 15, 155),
              sign = zodiacSigns[i];
            return (
              <g key={i}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="var(--control-border)"
                />
                <line
                  x1={tickStart.x}
                  y1={tickStart.y}
                  x2={tickEnd.x}
                  y2={tickEnd.y}
                  stroke="var(--gold)"
                  strokeWidth="0.8"
                />
                <text
                  x={glyphPosition.x}
                  y={glyphPosition.y}
                  fill="var(--gold)"
                  fontSize="18"
                  fontFamily="Georgia, 'Times New Roman', serif"
                  fontWeight="400"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  aria-hidden="true"
                >
                  {sign.glyph}
                </text>
              </g>
            );
          })}
          {chart.houses.map((h) => {
            const a = point(h.longitude, 85),
              b = point(h.longitude, 150);
            return (
              <line
                key={h.house}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--gold)"
                strokeWidth="1.2"
              />
            );
          })}
          {chart.aspects.map((a, i) => {
            const p1 = placementMap.get(a.body1),
              p2 = placementMap.get(a.body2);
            if (!p1 || !p2) return null;
            const style = aspectStyle[a.type] ?? aspectStyle.Sextile;
            const q1 = point(p1.longitude, 82),
              q2 = point(p2.longitude, 82);
            return (
              <line
                key={i}
                x1={q1.x}
                y1={q1.y}
                x2={q2.x}
                y2={q2.y}
                stroke={style.color}
                strokeWidth="0.7"
                opacity={style.opacity}
                clipPath="url(#aspect-field)"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          {chart.placements.map((p, i) => {
            const q = point(p.longitude, 130 - (i % 3) * 10);
            return (
              <g key={p.name}>
                <circle
                  cx={q.x}
                  cy={q.y}
                  r="11"
                  fill="var(--surface)"
                  stroke="var(--gold)"
                />
                <text
                  x={q.x}
                  y={q.y + 1}
                  fill="var(--ivory)"
                  fontSize="14"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {glyphs[p.name] || p.name[0]}
                </text>
              </g>
            );
          })}
        </svg>
        <aside className="zodiac-legend" aria-label="Zodiac symbol legend">
          <p className="zodiac-legend__title">Zodiac key</p>
          <ol>
            {zodiacSigns.map((sign) => (
              <li key={sign.name}>
                <span className="zodiac-legend__glyph" aria-hidden="true">
                  {sign.glyph}
                </span>
                <span>{sign.name}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
      {!chart.timeKnown && (
        <aside className="chart-time-notice" role="note">
          <strong>House lines unavailable</strong>
          <span>
            Birth time was marked unknown, so the Ascendant, Midheaven, and
            twelve house cusps are intentionally omitted. Add an exact birth
            time and recalculate to reveal them.
          </span>
        </aside>
      )}
      <aside className="meaning-note">
        <h3>What does this mean for me?</h3>
        <p>
          The wheel shows your chart as one connected pattern: planets describe
          the energies at work, zodiac signs colour their expression, houses
          locate them in life, and the central lines reveal major relationships
          between them.
        </p>
      </aside>
      <figcaption id="wheel-desc" className="ephemeris-register">
        <div className="ephemeris-register__heading">
          <div>
            <p className="section-kicker">Technical register</p>
            <h3>Primary ephemeris positions</h3>
          </div>
          <span>{chart.utc}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Celestial body</th>
                <th>Zodiac sign</th>
                <th>Degree</th>
                <th>Minute</th>
                <th>Motion</th>
              </tr>
            </thead>
            <tbody>
              {chart.placements.map((placement) => (
                <tr key={placement.name}>
                  <td>{placement.name}</td>
                  <td>{placement.sign}</td>
                  <td>{placement.degree}°</td>
                  <td>{String(placement.minute).padStart(2, "0")}′</td>
                  <td>{placement.retrograde ? "Retrograde" : "Direct"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="ephemeris-register__status">
          <div>
            <dt>Birth time</dt>
            <dd>{chart.timeKnown ? "Recorded" : "Unknown"}</dd>
          </div>
          <div>
            <dt>House system</dt>
            <dd>{chart.calculation.houseSystem}</dd>
          </div>
          <div>
            <dt>Angles</dt>
            <dd>{chart.timeKnown ? "Calculated" : "Omitted"}</dd>
          </div>
          <div>
            <dt>Major aspects</dt>
            <dd>{chart.aspects.length}</dd>
          </div>
        </dl>
      </figcaption>
    </figure>
  );
}
