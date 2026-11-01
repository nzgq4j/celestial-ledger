"use client";

import { useLocale } from "@/components/LocaleProvider";
import { localizeAstroTerm } from "@/lib/reports/evidence-label";
import type { AspectName, NatalChart, PlanetName } from "@/lib/types";
import "@/app/styles/atlas-public.css";

/** Variation selector that keeps astrological glyphs in text presentation. */
export const TEXT_GLYPH = "︎";

export const planetGlyphs: Partial<Record<PlanetName, string>> = {
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

export const aspectGlyphs: Record<AspectName, string> = {
  Conjunction: "☌",
  Opposition: "☍",
  Trine: "△",
  Square: "□",
  Sextile: "⚹",
};

/** Harmonious aspects are drawn in cyan, hard aspects in red. */
const aspectTone: Record<AspectName, "soft" | "hard" | "neutral"> = {
  Conjunction: "neutral",
  Opposition: "hard",
  Trine: "soft",
  Square: "hard",
  Sextile: "soft",
};

export const zodiacSigns = [
  { name: "Aries", glyph: "♈" },
  { name: "Taurus", glyph: "♉" },
  { name: "Gemini", glyph: "♊" },
  { name: "Cancer", glyph: "♋" },
  { name: "Leo", glyph: "♌" },
  { name: "Virgo", glyph: "♍" },
  { name: "Libra", glyph: "♎" },
  { name: "Scorpio", glyph: "♏" },
  { name: "Sagittarius", glyph: "♐" },
  { name: "Capricorn", glyph: "♑" },
  { name: "Aquarius", glyph: "♒" },
  { name: "Pisces", glyph: "♓" },
] as const;

/** Returns the sign glyph in text presentation, or an empty string. */
export function signGlyph(sign: string) {
  const match = zodiacSigns.find((item) => item.name === sign);
  return match ? match.glyph + TEXT_GLYPH : "";
}

const SIZE = 440;
const CENTER = SIZE / 2;
const OUTER = CENTER - 6; // outer gold ring
const SIGN_INNER = OUTER - 34; // inner edge of the sign band
const PLANET_INNER = SIGN_INNER - 70; // inner edge of the planet band
const HUB = 30;
const PLANET_LEVELS = [158, 138, 120];

/**
 * Converts ecliptic longitude to SVG coordinates with the Ascendant on the
 * left horizon and longitude increasing anticlockwise, as on a printed chart.
 * Charts without a known birth time place 0° Aries on the left horizon.
 */
function point(longitude: number, radius: number, ascendant: number) {
  const angle = ((180 - (longitude - ascendant)) * Math.PI) / 180;
  const x = CENTER + radius * Math.cos(angle);
  const y = CENTER - radius * Math.sin(angle);
  return {
    x: Number(x.toFixed(6)),
    y: Number(y.toFixed(6)),
  };
}

/** Staggers glyphs that sit within a few degrees of each other. */
function planetLevels(longitudes: number[]) {
  const order = longitudes
    .map((longitude, index) => ({ longitude, index }))
    .sort((a, b) => a.longitude - b.longitude);
  const levels = new Array<number>(longitudes.length).fill(0);
  order.forEach((item, position) => {
    if (position === 0) return;
    const previous = order[position - 1];
    if (item.longitude - previous.longitude < 9)
      levels[item.index] = (levels[previous.index] + 1) % PLANET_LEVELS.length;
  });
  return levels;
}

export function NatalChartWheel({
  chart,
  details = true,
}: {
  chart: NatalChart;
  /** Shows the zodiac key and ephemeris register beneath the wheel. */
  details?: boolean;
}) {
  const { pack, locale } = useLocale();
  const copy = pack.messages.home;
  const ascendant = chart.ascendant?.longitude ?? 0;
  const placements = chart.placements.filter((p) => planetGlyphs[p.name]);
  const placementMap = new Map(placements.map((p) => [p.name, p]));
  const levels = planetLevels(placements.map((p) => p.longitude));
  const at = (longitude: number, radius: number) =>
    point(longitude, radius, ascendant);
  const summary = [
    copy.resultTitle,
    ...placements.map(
      (p) =>
        `${localizeAstroTerm(p.name, locale)} ${p.degree}° ${localizeAstroTerm(p.sign, locale)}`,
    ),
    chart.ascendant
      ? `${copy.rising} ${localizeAstroTerm(chart.ascendant.sign, locale)}`
      : `${copy.rising}: ${copy.risingUnavailable}`,
  ].join(", ");
  const angleLabels = [
    chart.ascendant && { key: "AC", longitude: chart.ascendant.longitude },
    chart.midheaven && { key: "MC", longitude: chart.midheaven.longitude },
  ].filter((item): item is { key: string; longitude: number } => Boolean(item));

  const wheel = (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={summary}
      aria-describedby={details ? "wheel-desc" : undefined}
      className="natal-wheel__svg"
    >
      <circle
        className="natal-wheel__ring natal-wheel__ring--outer"
        cx={CENTER}
        cy={CENTER}
        r={OUTER}
      />
      <circle
        className="natal-wheel__ring"
        cx={CENTER}
        cy={CENTER}
        r={SIGN_INNER}
      />
      <circle
        className="natal-wheel__ring"
        cx={CENTER}
        cy={CENTER}
        r={PLANET_INNER}
      />
      <circle className="natal-wheel__ring" cx={CENTER} cy={CENTER} r={HUB} />
      {zodiacSigns.map((sign, i) => {
        const a = at(i * 30, OUTER),
          b = at(i * 30, SIGN_INNER),
          g = at(i * 30 + 15, (OUTER + SIGN_INNER) / 2);
        return (
          <g key={sign.name} aria-hidden="true">
            <line
              className="natal-wheel__sign-line"
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
            />
            <text
              className="natal-wheel__sign"
              x={g.x}
              y={g.y}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {sign.glyph + TEXT_GLYPH}
            </text>
          </g>
        );
      })}
      {chart.houses.map((house) => {
        const a = at(house.longitude, PLANET_INNER),
          b = at(house.longitude, HUB);
        const angular = house.house % 3 === 1;
        return (
          <line
            key={house.house}
            className={`natal-wheel__house${angular ? " natal-wheel__house--angle" : ""}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            aria-hidden="true"
          />
        );
      })}
      {chart.aspects.map((aspect, i) => {
        const p1 = placementMap.get(aspect.body1),
          p2 = placementMap.get(aspect.body2);
        if (!p1 || !p2) return null;
        const q1 = at(p1.longitude, PLANET_INNER - 2),
          q2 = at(p2.longitude, PLANET_INNER - 2);
        return (
          <line
            key={i}
            className={`natal-wheel__aspect natal-wheel__aspect--${aspectTone[aspect.type]}`}
            x1={q1.x}
            y1={q1.y}
            x2={q2.x}
            y2={q2.y}
            aria-hidden="true"
          />
        );
      })}
      {placements.map((placement, i) => {
        const tickStart = at(placement.longitude, SIGN_INNER),
          tickEnd = at(placement.longitude, SIGN_INNER - 8),
          label = at(placement.longitude, PLANET_LEVELS[levels[i]]);
        return (
          <g key={placement.name} aria-hidden="true">
            <line
              className="natal-wheel__tick"
              x1={tickStart.x}
              y1={tickStart.y}
              x2={tickEnd.x}
              y2={tickEnd.y}
            />
            <text
              className="natal-wheel__planet"
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {planetGlyphs[placement.name] + TEXT_GLYPH}
            </text>
          </g>
        );
      })}
      {angleLabels.map((angle) => {
        const position = at(angle.longitude, PLANET_INNER - 14);
        return (
          <text
            key={angle.key}
            className="natal-wheel__angle"
            x={position.x}
            y={position.y}
            textAnchor="middle"
            dominantBaseline="central"
            aria-hidden="true"
          >
            {angle.key}
          </text>
        );
      })}
    </svg>
  );

  if (!details)
    return (
      <figure className="natal-wheel natal-wheel--bare">
        {wheel}
        {!chart.timeKnown && (
          <figcaption className="natal-wheel__notice">
            {copy.housesUnavailable}
          </figcaption>
        )}
      </figure>
    );

  return (
    <figure className="natal-wheel" aria-labelledby="wheel-title">
      <h2 id="wheel-title" className="natal-wheel__title">
        Natal Chart
      </h2>
      <div className="natal-wheel__layout">
        <div className="natal-wheel__plate">{wheel}</div>
        <aside
          className="natal-wheel__legend"
          aria-label="Zodiac symbol legend"
        >
          <p className="atlas-kicker">Zodiac key</p>
          <ol>
            {zodiacSigns.map((sign) => (
              <li key={sign.name}>
                <span aria-hidden="true">{sign.glyph + TEXT_GLYPH}</span>
                <span>{localizeAstroTerm(sign.name, locale)}</span>
              </li>
            ))}
          </ol>
          <p className="natal-wheel__key">
            <span>
              <i className="natal-wheel__swatch natal-wheel__swatch--soft" />
              Trine · sextile
            </span>
            <span>
              <i className="natal-wheel__swatch natal-wheel__swatch--hard" />
              Square · opposition
            </span>
          </p>
        </aside>
      </div>
      {!chart.timeKnown && (
        <aside className="natal-wheel__notice" role="note">
          <strong>House lines unavailable</strong>
          <span>
            Birth time was marked unknown, so the Ascendant, Midheaven, and
            twelve house cusps are intentionally omitted. Add an exact birth
            time and recalculate to reveal them.
          </span>
        </aside>
      )}
      <figcaption id="wheel-desc" className="natal-wheel__register">
        <p className="natal-wheel__caption">
          The wheel shows your chart as one connected pattern: planets describe
          the energies at work, zodiac signs colour their expression, houses
          locate them in life, and the central lines reveal major relationships
          between them.
        </p>
        <div className="natal-wheel__register-heading">
          <div>
            <p className="atlas-kicker">Technical register</p>
            <h3>Primary ephemeris positions</h3>
          </div>
          <span className="atlas-meta">{chart.utc}</span>
        </div>
        <div className="natal-table-wrap">
          <table className="natal-table">
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
        <dl className="natal-wheel__status">
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
