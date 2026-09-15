import { CelestialClock } from "@/components/clock/CelestialClock";
import { calculateClock } from "@/lib/clock/calculation";
import { utcMinute } from "@/lib/clock/domain";
import { createPageMetadata } from "@/lib/seo";
import "./clock.css";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({
  title: "Celestial Clock",
  description:
    "Explore time, Moon phases, seasons and planetary movement in an interactive astronomical clock, with optional NOAA space weather.",
  path: "/clock",
});
export default function ClockPage() {
  return (
    <main className="clock-page">
      <header className="clock-page-heading">
        <div>
          <h1>Celestial Clock</h1>
          <p>One moment. Many rhythms.</p>
        </div>
        <p>
          Follow the Moon, the turning year and the planets moving through the
          zodiac. Select a mark to look closer.
        </p>
      </header>
      <CelestialClock initial={calculateClock(utcMinute(new Date()))} />
    </main>
  );
}
