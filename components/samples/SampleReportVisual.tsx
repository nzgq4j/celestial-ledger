import type { NatalChart, PlanetName } from "@/lib/types";
import type { SampleReportKey } from "@/lib/sample-reports/presentation";

function placement(chart: NatalChart, name: PlanetName) {
  const point = chart.placements.find((item) => item.name === name);
  return point ? `${point.name} · ${point.degree}° ${point.sign}` : name;
}

function CareerConstellation({ chart }: { chart: NatalChart }) {
  const nodes = [
    { name: "Sun" as const, x: 50, y: 17, role: "Purpose" },
    { name: "Mercury" as const, x: 21, y: 52, role: "Language" },
    { name: "Mars" as const, x: 79, y: 52, role: "Effort" },
    { name: "Saturn" as const, x: 50, y: 84, role: "Mastery" },
  ];
  return (
    <figure className="sample-signature-visual sample-vocation-map">
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-labelledby="vocation-map-title vocation-map-desc"
      >
        <title id="vocation-map-title">Vocation constellation</title>
        <desc id="vocation-map-desc">
          A constellation joining the chart’s Sun, Mercury, Mars and Saturn as
          purpose, language, effort and mastery.
        </desc>
        <path d="M50 17 L21 52 L50 84 L79 52 Z M21 52 L79 52" />
        {nodes.map((node) => (
          <g key={node.name} transform={`translate(${node.x} ${node.y})`}>
            <circle r="5" />
            <text className="sample-signature-visual__role" y="-8">
              {node.role}
            </text>
            <text className="sample-signature-visual__point" y="1">
              {node.name}
            </text>
            <text className="sample-signature-visual__position" y="9">
              {placement(chart, node.name).replace(`${node.name} · `, "")}
            </text>
          </g>
        ))}
      </svg>
      <figcaption>
        The vocational synthesis joins four recorded natal anchors: purpose, the
        instrument of thought, the pattern of effort and the long
        apprenticeship.
      </figcaption>
    </figure>
  );
}

function RecoveryCompass({ chart }: { chart: NatalChart }) {
  const moon = chart.placements.find((item) => item.name === "Moon");
  return (
    <figure className="sample-signature-visual sample-renewal-compass">
      <div
        className="sample-renewal-compass__dial"
        role="img"
        aria-label="Renewal compass showing grounding, self-trust, boundaries and relationship around a lunar centre"
      >
        <span className="sample-renewal-compass__axis sample-renewal-compass__axis--vertical" />
        <span className="sample-renewal-compass__axis sample-renewal-compass__axis--horizontal" />
        <span className="sample-renewal-compass__label sample-renewal-compass__label--north">
          Grounding
        </span>
        <span className="sample-renewal-compass__label sample-renewal-compass__label--east">
          Boundaries
        </span>
        <span className="sample-renewal-compass__label sample-renewal-compass__label--south">
          Relationship
        </span>
        <span className="sample-renewal-compass__label sample-renewal-compass__label--west">
          Self-trust
        </span>
        <span className="sample-renewal-compass__centre">
          <strong>Moon</strong>
          <small>
            {moon ? `${moon.degree}° ${moon.sign}` : "Natal anchor"}
          </small>
        </span>
      </div>
      <figcaption>
        The lunar centre is held by four practical directions. No single
        direction carries renewal alone; the compass becomes trustworthy through
        repeated return.
      </figcaption>
    </figure>
  );
}

function WeeklyCurrent() {
  const days = [
    ["Mon", "Observe", 2],
    ["Tue", "Connect", 3],
    ["Wed", "Review", 2],
    ["Thu", "Choose", 3],
    ["Fri", "Soften", 2],
    ["Sat", "Restore", 1],
    ["Sun", "Integrate", 2],
  ] as const;
  return (
    <figure className="sample-signature-visual sample-week-current">
      <div
        className="sample-week-current__plot"
        role="img"
        aria-label="Seven day interpretive current from observation through choice to restoration and integration"
      >
        <span className="sample-week-current__line" />
        {days.map(([day, action, level]) => (
          <div key={day} data-level={level}>
            <span aria-hidden="true" />
            <strong>{day}</strong>
            <small>{action}</small>
          </div>
        ))}
      </div>
      <figcaption>
        The week gathers signal at the opening, concentrates choice at midweek,
        and widens toward restoration before Sunday’s integration.
      </figcaption>
    </figure>
  );
}

export function SampleReportVisual({
  report,
  chart,
}: {
  report: SampleReportKey;
  chart: NatalChart;
}) {
  return (
    <section
      className="sample-report-visual"
      aria-labelledby="sample-report-visual-title"
    >
      <header>
        <p className="section-kicker">Signature map</p>
        <h2 id="sample-report-visual-title">
          {report === "career-purpose"
            ? "The vocation constellation"
            : report === "recovery-reflection"
              ? "The renewal compass"
              : "The seven-day current"}
        </h2>
      </header>
      {report === "career-purpose" ? (
        <CareerConstellation chart={chart} />
      ) : report === "recovery-reflection" ? (
        <RecoveryCompass chart={chart} />
      ) : (
        <WeeklyCurrent />
      )}
    </section>
  );
}
