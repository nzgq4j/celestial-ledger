import type { ClockEvent, ClockSnapshot, WeatherFeed } from "./domain";

export type ClockExplanation = {
  title: string;
  value: string;
  meaning: string;
  reading: string;
  evidenceId: string;
  utc?: string;
  source: string;
};

export function explainPlanet(
  planet: ClockSnapshot["planets"][number],
  snapshot: ClockSnapshot,
): ClockExplanation {
  return {
    title: planet.name,
    value: `${planet.degree.toFixed(2)}° ${planet.sign} · ${planet.retrograde ? "Retrograde" : "Direct"}`,
    meaning: `This is ${planet.name}’s apparent position as seen from Earth, measured within the tropical zodiac. Each sign spans 30°; this is not a compass direction or height above your horizon.`,
    reading: planet.retrograde
      ? "The dashed outline means apparent motion is backwards through the zodiac. The planet has not reversed its physical orbit. Its track highlights its longitude, not its distance from Earth."
      : "The solid outline means apparent motion is forwards through the zodiac. Its track highlights its longitude, not its distance from Earth.",
    evidenceId: planet.id,
    utc: snapshot.utc,
    source: `Astronomy Engine ${snapshot.method.engineVersion}`,
  };
}

export function explainEvent(
  event: ClockEvent,
  time: Date,
  engineVersion: string,
): ClockExplanation {
  const phaseMeanings = [
    "The Moon and Sun have the same geocentric ecliptic longitude. The Moon is near the Sun in our sky, with its sunlit side mostly facing away from Earth.",
    "The Moon is a quarter of the way through its phase cycle. Roughly half its apparent disc is illuminated, and the illuminated portion is growing.",
    "The Moon is opposite the Sun in geocentric ecliptic longitude. Its apparent disc is almost fully illuminated as seen from Earth.",
    "The Moon is three quarters of the way through its phase cycle. Roughly half its apparent disc is illuminated, and the illuminated portion is shrinking.",
  ];
  const seasonMeaning = event.title.includes("equinox")
    ? "The Sun crosses Earth’s equatorial plane. This marks the start of astronomical spring in one hemisphere and autumn in the other; local day and night are not necessarily exactly equal."
    : "The Sun reaches its northernmost or southernmost declination. This marks the start of astronomical summer in one hemisphere and winter in the other.";
  return {
    title: event.title,
    value:
      event.utc <= time.toISOString()
        ? "Past calculated event"
        : "Upcoming calculated event",
    meaning:
      event.kind === "moon" ? phaseMeanings[event.quarter ?? 0] : seasonMeaning,
    reading:
      "Its position around the ring is the date within the UTC year. Filled marks are before the displayed moment; outlined marks are after it. Select to inspect the event.",
    evidenceId: event.id,
    utc: event.utc,
    source: `Astronomy Engine ${engineVersion}`,
  };
}

export function explainObservation(
  observation: WeatherFeed["observations"][number],
  feed: WeatherFeed,
): ClockExplanation {
  return {
    title: feed.kind === "kp" ? "Geomagnetic activity" : "Solar wind speed",
    value: `${observation.value} ${feed.unit}${feed.status === "stale" ? " · Older data" : ""}`,
    meaning:
      feed.kind === "kp"
        ? "Kp measures planetary geomagnetic disturbance on a scale from 0 to 9. Higher values mean greater disturbance. It does not confirm aurora at your location."
        : "The speed of charged particles flowing from the Sun, measured by a spacecraft. This is space weather, not wind at ground level.",
    reading: `This is an observation, not a forecast. The ring spans the seven days before the displayed moment.${feed.kind === "wind" ? " The latest valid sample in each hour is shown." : " Kp is reported in three-hour intervals."}${feed.status === "stale" ? " The feed is stale; check the observation time." : ""}`,
    evidenceId: observation.id,
    utc: observation.utc,
    source: `NOAA · ${observation.source}`,
  };
}
