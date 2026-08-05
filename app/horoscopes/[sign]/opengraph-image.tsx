import { ImageResponse } from "next/og";
import { headers } from "next/headers";
import { constellations } from "@/lib/horoscopes/constellations";
import { dailySkyFor } from "@/lib/horoscopes/daily";
import { SITE_URL } from "@/lib/seo";

export const alt = "Daily sun sign reading from Celestial Atlas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function conciseSummary(value: string) {
  return `Today's clearest choice: ${value.toLowerCase()}.`;
}

export default async function HoroscopeOpenGraphImage({
  params,
}: {
  params: Promise<{ sign: string }>;
}) {
  const { sign } = await params;
  const sky = dailySkyFor(new Date(), "en-GB");
  const reading = sky.horoscopes.find((item) => item.slug === sign);
  const name = reading?.sign ?? "Daily Horoscope";
  const theme = reading?.theme ?? "The living sky, read for today";
  const constellation = constellations[reading?.slug ?? "aries"];
  const summary = conciseSummary(theme);
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";
  const isLocalHost = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const heroUrl = isLocalHost
    ? `http://${host}/hero1.png`
    : `${SITE_URL}/hero1.png`;

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
          objectPosition: "50% 52%",
          opacity: 0.76,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "linear-gradient(90deg, rgba(2,7,17,.92) 0%, rgba(3,10,23,.74) 43%, rgba(3,10,23,.28) 72%, rgba(2,7,17,.64) 100%), linear-gradient(180deg, rgba(2,7,17,.38) 0%, rgba(2,7,17,.18) 48%, rgba(2,7,17,.9) 100%)",
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
          padding: "42px 54px 36px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#e2bf70",
            fontSize: 20,
            letterSpacing: ".15em",
            textTransform: "uppercase",
          }}
        >
          <span>Celestial Atlas</span>
          <span>{sky.displayDate}</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 28,
          }}
        >
          <div
            style={{
              width: 635,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                color: "#e2bf70",
                fontSize: 22,
                letterSpacing: ".13em",
                textTransform: "uppercase",
              }}
            >
              Daily Sun Sign Reading
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 8,
                fontFamily: "Georgia",
                fontSize: name.length > 9 ? 76 : 92,
                lineHeight: 1,
              }}
            >
              {name}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 14,
                color: "#e2bf70",
                fontSize: 27,
                letterSpacing: ".065em",
                textTransform: "uppercase",
              }}
            >
              {theme}
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: 620,
                marginTop: 27,
                paddingTop: 22,
                borderTop: "1px solid rgba(226,191,112,.52)",
                color: "#fff7df",
                fontFamily: "Georgia",
                fontSize: 25,
                lineHeight: 1.35,
              }}
            >
              {summary}
            </div>
          </div>

          <div
            style={{
              width: 440,
              height: 340,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(226,191,112,.24)",
              background: "rgba(2,7,17,.2)",
            }}
          >
            <svg
              width="410"
              height="310"
              viewBox="0 0 100 82"
              aria-label={`${name} constellation`}
            >
              {constellation.edges.map(([start, end]) => (
                <line
                  key={`${start}-${end}`}
                  x1={constellation.points[start][0]}
                  y1={constellation.points[start][1]}
                  x2={constellation.points[end][0]}
                  y2={constellation.points[end][1]}
                  stroke="#d4ac56"
                  strokeWidth="0.58"
                  opacity="0.96"
                />
              ))}
              {constellation.points.map(([x, y], index) => (
                <g key={`${x}-${y}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r={index % 3 === 0 ? "2.2" : "1.7"}
                    fill="#fff7df"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={index % 3 === 0 ? "4.8" : "3.9"}
                    fill="none"
                    stroke="#e1bd6b"
                    strokeWidth="0.36"
                    opacity="0.72"
                  />
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 20,
            borderTop: "1px solid rgba(226,191,112,.38)",
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#d8d1c2",
              fontSize: 15,
              letterSpacing: ".055em",
              textTransform: "uppercase",
            }}
          >
            Morning / Afternoon / Evening / Relationships / Business / Money
          </div>
          <div
            style={{
              display: "flex",
              color: "#e2bf70",
              fontSize: 21,
              fontWeight: 600,
              letterSpacing: ".1em",
              textTransform: "lowercase",
            }}
          >
            celestialatlas.app
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
