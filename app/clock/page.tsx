import { CelestialClock } from "@/components/clock/CelestialClock";
import { calculateClock } from "@/lib/clock/calculation";
import { utcMinute } from "@/lib/clock/domain";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { createPageMetadata } from "@/lib/seo";
import "./clock.css";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({
  title: "Celestial Clock",
  description:
    "Explore time, Moon phases, seasons and planetary movement in an interactive astronomical clock, with optional NOAA space weather.",
  path: "/clock",
});
export default async function ClockPage() {
  const pack = await getServerTranslationPack();
  const copy = pack.messages.clock;
  return (
    <main className="atlas-shell clock-page">
      <header className="clock-page-heading">
        <p className="atlas-kicker">{copy.kicker}</p>
        <h1 className="atlas-page-title">{copy.title}</h1>
        <p>{copy.introduction}</p>
      </header>
      <CelestialClock
        initial={calculateClock(utcMinute(new Date()))}
        copy={copy}
        locale={pack.tag}
      />
    </main>
  );
}
