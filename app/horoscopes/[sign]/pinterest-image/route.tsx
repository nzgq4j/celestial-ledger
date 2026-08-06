import { ImageResponse } from "next/og";
import { constellations } from "@/lib/horoscopes/constellations";
import { dailySkyFor } from "@/lib/horoscopes/daily";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function conciseSummary(value: string) {
  return `Today's clearest choice: ${value.toLowerCase()}.`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sign: string }> },
) {
  const { sign } = await params;
  const sky = dailySkyFor(new Date(), "en-GB");
  const reading = sky.horoscopes.find((item) => item.slug === sign);
  if (!reading) return new Response("Not found", { status: 404 });
  const constellation = constellations[reading.slug];
  const summary = conciseSummary(reading.theme);
  const heroUrl = new URL("/hero1.png", request.url).toString();

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        overflow: "hidden",
        color: "#f5eddb",
        background: "#020711",
      }}
    >
      {/* ImageResponse requires a native image element for full-bleed artwork. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroUrl}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "50% 50%",
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "radial-gradient(circle at 50% 34%, rgba(5,15,31,.12), rgba(2,7,17,.52) 48%, rgba(2,7,17,.88) 100%), linear-gradient(180deg, rgba(2,7,17,.54) 0%, rgba(3,10,23,.32) 44%, rgba(3,10,23,.9) 78%, rgba(2,7,17,.97) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "78px 62px 52px",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            color: "#d3b46f",
            fontSize: 27,
            letterSpacing: ".15em",
            textTransform: "uppercase",
          }}
        >
          <span>Celestial Atlas</span>
          <span>{sky.displayDate}</span>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <svg
            width="760"
            height="550"
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
                stroke="#d4ac56"
                strokeWidth="0.55"
                opacity="0.95"
              />
            ))}
            {constellation.points.map(([x, y], index) => (
              <g key={`${x}-${y}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={index % 3 === 0 ? "2.15" : "1.65"}
                  fill="#fff7df"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={index % 3 === 0 ? "4.6" : "3.7"}
                  fill="none"
                  stroke="#e1bd6b"
                  strokeWidth="0.36"
                  opacity="0.7"
                />
              </g>
            ))}
          </svg>
          <div
            style={{
              display: "flex",
              color: "#d3b46f",
              fontSize: 28,
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
              fontSize: 118,
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
              fontSize: 32,
              letterSpacing: ".07em",
              textTransform: "uppercase",
            }}
          >
            {reading.theme}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            borderTop: "1px solid rgba(211,180,111,.5)",
            paddingTop: 34,
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#f5eddb",
              fontFamily: "Georgia",
              fontSize: 28,
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
              marginTop: 25,
              color: "#d8d1c2",
              fontSize: 18,
              letterSpacing: ".06em",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
            }}
          >
            Morning / Afternoon / Evening / Relationships / Business / Money
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 33,
              paddingTop: 23,
              borderTop: "1px solid rgba(211,180,111,.28)",
              color: "#e2bf70",
              fontSize: 25,
              fontWeight: 600,
              letterSpacing: ".12em",
              textTransform: "lowercase",
            }}
          >
            celestialatlas.app
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1000,
      height: 1500,
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    },
  );
}
