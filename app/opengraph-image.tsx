import { ImageResponse } from "next/og";

export const alt = "Celestial Atlas — ancient sky, personal atlas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "76px 84px",
        color: "#f5eddb",
        background:
          "radial-gradient(circle at 78% 34%, rgba(209,173,91,.22), transparent 21%), linear-gradient(135deg, #030811 0%, #08172b 58%, #111b30 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          color: "#d3b46f",
          fontSize: 24,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 76,
            height: 76,
            border: "2px solid #d3b46f",
            borderRadius: "50%",
            fontSize: 35,
          }}
        >
          CA
        </span>
        Celestial Atlas
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: "Georgia", fontSize: 78, lineHeight: 1.03 }}>
          Navigate your cosmos.
        </div>
        <div
          style={{
            marginTop: 24,
            color: "#c9c0b0",
            fontFamily: "Georgia",
            fontSize: 30,
          }}
        >
          Natal charts, daily astrology and evidence-linked private readings.
        </div>
      </div>
    </div>,
    size,
  );
}
