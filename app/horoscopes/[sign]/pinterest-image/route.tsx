import { ImageResponse } from "next/og";
import { dailySkyFor } from "@/lib/horoscopes/daily";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Point = readonly [number, number];
type Constellation = {
  points: readonly Point[];
  edges: readonly (readonly [number, number])[];
};

const constellations: Record<string, Constellation> = {
  aries: {
    points: [
      [12, 49],
      [30, 39],
      [51, 35],
      [72, 41],
      [88, 55],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  taurus: {
    points: [
      [12, 17],
      [34, 37],
      [50, 53],
      [66, 37],
      [89, 16],
      [27, 69],
      [73, 69],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
      [2, 6],
    ],
  },
  gemini: {
    points: [
      [27, 16],
      [29, 40],
      [30, 68],
      [70, 17],
      [68, 41],
      [66, 70],
      [48, 31],
      [49, 58],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [3, 4],
      [4, 5],
      [1, 6],
      [6, 4],
      [2, 7],
      [7, 5],
    ],
  },
  cancer: {
    points: [
      [16, 26],
      [37, 37],
      [51, 51],
      [72, 27],
      [85, 18],
      [70, 68],
      [89, 76],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
      [5, 6],
    ],
  },
  leo: {
    points: [
      [18, 54],
      [30, 33],
      [49, 23],
      [60, 39],
      [49, 54],
      [67, 66],
      [88, 55],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [4, 0],
    ],
  },
  virgo: {
    points: [
      [10, 30],
      [27, 41],
      [43, 32],
      [56, 49],
      [76, 43],
      [91, 55],
      [61, 71],
      [38, 66],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [3, 6],
      [6, 7],
      [7, 1],
    ],
  },
  libra: {
    points: [
      [17, 57],
      [35, 35],
      [50, 20],
      [66, 35],
      [84, 57],
      [50, 62],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [1, 5],
      [5, 3],
      [0, 5],
      [5, 4],
    ],
  },
  scorpio: {
    points: [
      [10, 26],
      [24, 36],
      [39, 32],
      [51, 47],
      [65, 54],
      [79, 50],
      [89, 65],
      [78, 76],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
    ],
  },
  sagittarius: {
    points: [
      [18, 25],
      [42, 36],
      [67, 22],
      [84, 12],
      [72, 46],
      [51, 59],
      [29, 68],
      [79, 72],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [1, 4],
      [4, 5],
      [5, 6],
      [4, 7],
      [5, 1],
    ],
  },
  capricorn: {
    points: [
      [12, 33],
      [34, 20],
      [58, 29],
      [83, 20],
      [73, 53],
      [51, 72],
      [28, 59],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 0],
      [2, 5],
    ],
  },
  aquarius: {
    points: [
      [10, 28],
      [27, 18],
      [43, 31],
      [60, 20],
      [78, 33],
      [91, 24],
      [16, 60],
      [34, 49],
      [51, 62],
      [69, 51],
      [88, 63],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 10],
      [2, 8],
    ],
  },
  pisces: {
    points: [
      [11, 29],
      [24, 18],
      [35, 32],
      [25, 46],
      [48, 49],
      [69, 44],
      [81, 27],
      [91, 39],
      [81, 56],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [2, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 5],
    ],
  },
};

function conciseSummary(value: string) {
  return `Let ${value.toLowerCase()} guide today's clearest choice.`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sign: string }> },
) {
  const { sign } = await params;
  const sky = dailySkyFor(new Date(), "en-GB");
  const reading = sky.horoscopes.find((item) => item.slug === sign);
  if (!reading) return new Response("Not found", { status: 404 });
  const constellation = constellations[reading.slug];
  const summary = conciseSummary(reading.theme);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "82px 76px 70px",
        color: "#f5eddb",
        background:
          "radial-gradient(circle at 50% 25%, rgba(209,173,91,.18), transparent 29%), linear-gradient(165deg, #020711 0%, #07162a 62%, #111b30 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "#d3b46f",
          fontSize: 24,
          letterSpacing: ".17em",
          textTransform: "uppercase",
        }}
      >
        <span>Celestial Atlas</span>
        <span>{sky.displayDate}</span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <svg
          width="720"
          height="530"
          viewBox="0 0 100 82"
          aria-label={`${reading.sign} constellation`}
        >
          {constellation.edges.map(([start, end]) => (
            <line
              key={`${start}-${end}`}
              x1={constellation.points[start][0]}
              y1={constellation.points[start][1]}
              x2={constellation.points[end][0]}
              y2={constellation.points[end][1]}
              stroke="#b9964e"
              strokeWidth="0.45"
              opacity="0.76"
            />
          ))}
          {constellation.points.map(([x, y], index) => (
            <g key={`${x}-${y}`}>
              <circle
                cx={x}
                cy={y}
                r={index % 3 === 0 ? "2.15" : "1.65"}
                fill="#f5eddb"
              />
              <circle
                cx={x}
                cy={y}
                r={index % 3 === 0 ? "4.6" : "3.7"}
                fill="none"
                stroke="#d3b46f"
                strokeWidth="0.28"
                opacity="0.45"
              />
            </g>
          ))}
        </svg>
        <div
          style={{
            display: "flex",
            color: "#d3b46f",
            fontSize: 24,
            letterSpacing: ".14em",
            textTransform: "uppercase",
          }}
        >
          Daily Sun Sign Reading
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontFamily: "Georgia",
            fontSize: 104,
            lineHeight: 1,
          }}
        >
          {reading.sign}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 22,
            color: "#d3b46f",
            fontSize: 28,
            letterSpacing: ".08em",
            textTransform: "uppercase",
          }}
        >
          {reading.theme}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderTop: "1px solid rgba(211,180,111,.5)",
          paddingTop: 38,
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#f5eddb",
            fontFamily: "Georgia",
            fontSize: 25,
            lineHeight: 1.35,
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {summary}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 34,
            color: "#9f9a90",
            fontSize: 17,
            letterSpacing: ".08em",
            whiteSpace: "nowrap",
            textTransform: "uppercase",
          }}
        >
          Morning / Afternoon / Evening / Relationships / Business / Money
        </div>
      </div>
    </div>,
    {
      width: 1000,
      height: 1500,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    },
  );
}
