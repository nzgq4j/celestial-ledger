import { ImageResponse } from "next/og";
import { dailySkyFor } from "@/lib/horoscopes/daily";

export const alt = "Daily sun sign reading from Celestial Atlas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 76px",
        color: "#f5eddb",
        background:
          "radial-gradient(circle at 80% 28%, rgba(209,173,91,.26), transparent 24%), linear-gradient(145deg, #030811, #0b1a31 62%, #101a2c)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "#d3b46f",
          fontSize: 22,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        <span>Celestial Atlas</span>
        <span>{sky.displayDate}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 42 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 180,
            height: 180,
            border: "2px solid #d3b46f",
            borderRadius: "50%",
            color: "#e0bd70",
            fontSize: 108,
          }}
        >
          {name.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{ color: "#d3b46f", fontSize: 24, letterSpacing: ".1em" }}
          >
            DAILY SUN SIGN READING
          </div>
          <div style={{ fontFamily: "Georgia", fontSize: 92 }}>{name}</div>
          <div style={{ maxWidth: 720, color: "#c9c0b0", fontSize: 30 }}>
            {theme}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", color: "#a8a092", fontSize: 21 }}>
        Morning · Afternoon · Evening · Relationships · Business · Money
      </div>
    </div>,
    size,
  );
}
