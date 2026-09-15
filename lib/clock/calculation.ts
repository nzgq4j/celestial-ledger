import "server-only";
import { createHash } from "node:crypto";
import {
  Body,
  Illumination,
  MoonPhase,
  SearchMoonQuarter,
  NextMoonQuarter,
  Seasons,
} from "astronomy-engine";
import {
  ASTRONOMY_ENGINE_VERSION,
  CALCULATION_VERSION,
  geocentricLongitude,
  longitudeSpeed,
} from "@/lib/astronomy";
import {
  CLOCK_VERSION,
  clockDateSchema,
  clockSnapshotSchema,
  type ClockEvent,
  type ClockSnapshot,
} from "./domain";

const bodies = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
] as const;
const signs = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];
const quarters = ["New Moon", "First quarter", "Full Moon", "Last quarter"];
const phases = [
  "New Moon",
  "Waxing crescent",
  "First quarter",
  "Waxing gibbous",
  "Full Moon",
  "Waning gibbous",
  "Last quarter",
  "Waning crescent",
];
export function evidenceId(kind: string, data: unknown): string {
  return `${kind}_${createHash("sha256")
    .update(
      JSON.stringify([
        CLOCK_VERSION,
        ASTRONOMY_ENGINE_VERSION,
        CALCULATION_VERSION,
        data,
      ]),
    )
    .digest("hex")
    .slice(0, 24)}`;
}

const calendars = new Map<number, ClockSnapshot["calendar"]>();
export function calculateCalendar(year: number): ClockSnapshot["calendar"] {
  if (!Number.isInteger(year) || year < 2000 || year > 2050)
    throw new RangeError("Unsupported calendar year");
  const cached = calendars.get(year);
  if (cached) return cached;
  const events: ClockEvent[] = [];
  const add = (
    title: string,
    date: Date,
    kind: ClockEvent["kind"],
    quarter?: number,
  ) => {
    const record = {
      title,
      utc: date.toISOString(),
      kind,
      ...(quarter === undefined ? {} : { quarter }),
    };
    events.push({ id: evidenceId("event", record), ...record });
  };
  let moon = SearchMoonQuarter(new Date(Date.UTC(year, 0, 1) - 1000));
  for (
    let count = 0;
    count < 55 && moon.time.date.getUTCFullYear() === year;
    count++
  ) {
    add(quarters[moon.quarter], moon.time.date, "moon", moon.quarter);
    moon = NextMoonQuarter(moon);
  }
  const seasons = Seasons(year);
  add("March equinox", seasons.mar_equinox.date, "season");
  add("June solstice", seasons.jun_solstice.date, "season");
  add("September equinox", seasons.sep_equinox.date, "season");
  add("December solstice", seasons.dec_solstice.date, "season");
  events.sort((a, b) => a.utc.localeCompare(b.utc));
  const result = { id: evidenceId("calendar", { year, events }), events };
  if (calendars.size >= 8) calendars.delete(calendars.keys().next().value!);
  calendars.set(year, result);
  return result;
}

export function calculateClock(utc: string): ClockSnapshot {
  clockDateSchema.parse(utc);
  const date = new Date(utc);
  const year = date.getUTCFullYear();
  const planets = bodies.map((name) => {
    const longitude = geocentricLongitude(name, date);
    const speed = longitudeSpeed(name, date);
    const record = {
      name,
      longitude,
      speed,
      retrograde: speed < 0,
      sign: signs[Math.floor(longitude / 30)],
      degree: longitude % 30,
    };
    return { id: evidenceId("planet", { utc, ...record }), ...record };
  });
  const phase = MoonPhase(date);
  const moon = {
    phase,
    illuminated: Illumination(Body.Moon, date).phase_fraction,
    label: phases[Math.floor((phase + 22.5) / 45) % 8],
  };
  const calendar = calculateCalendar(year);
  let upcoming = calendar.events.filter((e) => e.utc > utc);
  if (upcoming.length < 4 && year < 2050)
    upcoming = [...upcoming, ...calculateCalendar(year + 1).events];
  const record = {
    utc,
    year,
    method: {
      engine: "Astronomy Engine",
      engineVersion: ASTRONOMY_ENGINE_VERSION,
      calculationVersion: `${CALCULATION_VERSION}/${CLOCK_VERSION}`,
      zodiac: "Tropical, geocentric",
      houseSystem: null,
      nodeType: null,
      timezone: "UTC" as const,
      coordinates: null,
    },
    planets,
    moon: { id: evidenceId("moon", { utc, ...moon }), ...moon },
    calendar,
    nextEvents: upcoming.slice(0, 4),
  };
  return clockSnapshotSchema.parse({
    id: evidenceId("clock", record),
    ...record,
  });
}
