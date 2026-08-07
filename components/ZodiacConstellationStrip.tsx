const constellations = [
  {
    name: "Aries",
    points: [
      [4, 18],
      [12, 9],
      [22, 12],
      [34, 5],
    ],
  },
  {
    name: "Taurus",
    points: [
      [4, 7],
      [13, 15],
      [23, 13],
      [34, 21],
    ],
  },
  {
    name: "Gemini",
    points: [
      [5, 6],
      [11, 20],
      [27, 19],
      [35, 7],
    ],
  },
  {
    name: "Cancer",
    points: [
      [4, 16],
      [14, 7],
      [22, 18],
      [35, 11],
    ],
  },
  {
    name: "Leo",
    points: [
      [4, 20],
      [12, 10],
      [24, 6],
      [34, 16],
    ],
  },
  {
    name: "Virgo",
    points: [
      [5, 8],
      [15, 18],
      [24, 9],
      [35, 20],
    ],
  },
  {
    name: "Libra",
    points: [
      [4, 17],
      [14, 11],
      [25, 11],
      [35, 17],
    ],
  },
  {
    name: "Scorpio",
    points: [
      [5, 7],
      [13, 19],
      [24, 16],
      [35, 6],
    ],
  },
  {
    name: "Sagittarius",
    points: [
      [4, 20],
      [14, 14],
      [23, 5],
      [35, 10],
    ],
  },
  {
    name: "Capricorn",
    points: [
      [5, 13],
      [14, 5],
      [23, 20],
      [35, 13],
    ],
  },
  {
    name: "Aquarius",
    points: [
      [4, 9],
      [14, 16],
      [24, 8],
      [35, 15],
    ],
  },
  {
    name: "Pisces",
    points: [
      [5, 6],
      [13, 17],
      [25, 10],
      [35, 21],
    ],
  },
] as const;

export function ZodiacConstellationStrip() {
  return (
    <div className="zodiac-constellations" aria-hidden="true">
      {constellations.map(({ name, points }) => (
        <svg key={name} viewBox="0 0 40 26" focusable="false">
          <title>{name}</title>
          <polyline points={points.map(([x, y]) => `${x},${y}`).join(" ")} />
          {points.map(([x, y], index) => (
            <g key={`${name}-${x}-${y}`}>
              {index === 1 && (
                <circle className="star-glow" cx={x} cy={y} r="3" />
              )}
              <circle cx={x} cy={y} r={index === 1 ? "1.6" : "1.15"} />
            </g>
          ))}
        </svg>
      ))}
    </div>
  );
}
