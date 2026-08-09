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
    { day: "Mon", action: "Observe", value: 58, label: "Signal" },
    { day: "Tue", action: "Connect", value: 82, label: "Scope" },
    { day: "Wed", action: "Review", value: 64, label: "Choice" },
    { day: "Thu", action: "Choose", value: 88, label: "Boundary" },
    { day: "Fri", action: "Soften", value: 67, label: "Language" },
    { day: "Sat", action: "Restore", value: 45, label: "Visibility" },
    { day: "Sun", action: "Integrate", value: 72, label: "Direction" },
  ] as const;
  const width = 760;
  const height = 260;
  const left = 52;
  const right = 32;
  const top = 24;
  const bottom = 74;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const points = days.map((item, index) => ({
    ...item,
    x: left + (plotWidth * index) / (days.length - 1),
    y: top + plotHeight * (1 - item.value / 100),
  }));
  const baseline = top + plotHeight;
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `M ${points[0].x} ${baseline} L ${points
    .map((point) => `${point.x} ${point.y}`)
    .join(" L ")} L ${points.at(-1)!.x} ${baseline} Z`;
  return (
    <figure className="sample-signature-visual sample-week-current">
      <svg
        className="sample-week-current__chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Seven day emphasis chart showing signal, scope, choice, boundary, language, visibility and direction"
      >
        <defs>
          <linearGradient
            id="sample-week-current-fill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((value) => {
          const y = top + plotHeight * (1 - value / 100);
          return (
            <g key={value}>
              <line
                className="sample-week-current__grid"
                x1={left}
                x2={width - right}
                y1={y}
                y2={y}
              />
              <text className="sample-week-current__axis" x={20} y={y + 4}>
                {value}
              </text>
            </g>
          );
        })}
        <path className="sample-week-current__area" d={area} />
        {points.map((point) => (
          <rect
            key={`${point.day}-bar`}
            className="sample-week-current__bar"
            x={point.x - 13}
            y={point.y}
            width="26"
            height={baseline - point.y}
            rx="4"
          />
        ))}
        <polyline className="sample-week-current__curve" points={line} />
        {points.map((point) => (
          <g key={point.day}>
            <circle
              className="sample-week-current__point"
              cx={point.x}
              cy={point.y}
              r="6"
            />
            <text
              className="sample-week-current__day"
              x={point.x}
              y={height - 45}
            >
              {point.day}
            </text>
            <text
              className="sample-week-current__theme"
              x={point.x}
              y={height - 27}
            >
              {point.action}
            </text>
            <text
              className="sample-week-current__value"
              x={point.x}
              y={height - 10}
            >
              {point.value} - {point.label}
            </text>
          </g>
        ))}
      </svg>
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
