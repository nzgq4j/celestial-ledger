"use client";

import type { ClockSnapshot, SpaceWeather } from "@/lib/clock/domain";
import { yearFraction } from "@/lib/clock/domain";
import {
  explainEvent,
  explainObservation,
  explainPlanet,
} from "@/lib/clock/explanations";
import { ClockTooltipProvider, ClockTooltipTarget } from "./ClockTooltip";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const glyphs = ["☉", "☽", "☿", "♀", "♂", "♃", "♄", "♅", "♆", "♇"];
const zodiac = [
  "♈",
  "♉",
  "♊",
  "♋",
  "♌",
  "♍",
  "♎",
  "♏",
  "♐",
  "♑",
  "♒",
  "♓",
];
const colors = [
  "#e3c777",
  "#d9e5f3",
  "#9bc7d9",
  "#deb5c8",
  "#e7a182",
  "#d2b991",
  "#c4c2a0",
  "#92d4cc",
  "#a6b6ed",
  "#d4a7da",
];
export function dialPoint(degrees: number, radius: number) {
  const angle = ((degrees - 90) * Math.PI) / 180;
  return {
    x: Number((450 + Math.cos(angle) * radius).toFixed(6)),
    y: Number((450 + Math.sin(angle) * radius).toFixed(6)),
  };
}
function arc(radius: number, start: number, end: number) {
  const a = dialPoint(start, radius),
    b = dialPoint(end, radius);
  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${end - start > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;
}

export function ClockDial({
  snapshot,
  time,
  weather,
  selected,
  onSelect,
}: {
  snapshot: ClockSnapshot;
  time: Date;
  weather: SpaceWeather | null;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const year = snapshot.year;
  const civilId = `civil:${time.toISOString()}`;
  const dayCount = new Date(
    Date.UTC(year, time.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const timeRings = [
    {
      radius: 105,
      divisions: 24,
      value: time.getUTCHours(),
      color: "#b3a3d8",
      label: "Hours",
    },
    {
      radius: 125,
      divisions: 60,
      value: time.getUTCMinutes(),
      color: "#88c6d4",
      label: "Minutes",
    },
    {
      radius: 142,
      divisions: 60,
      value: time.getUTCSeconds(),
      color: "#e3c777",
      label: "Seconds",
    },
    {
      radius: 166,
      divisions: 7,
      value: time.getUTCDay(),
      color: "#a9bacf",
      label: "Weekday",
    },
    {
      radius: 190,
      divisions: dayCount,
      value: time.getUTCDate() - 1,
      color: "#c6bb9e",
      label: "Date",
    },
  ];
  const seasons = snapshot.calendar.events.filter((e) => e.kind === "season");
  const boundaries = [
    0,
    ...seasons.map((e) => yearFraction(e.utc, year) * 360),
    360,
  ];
  const seasonColors = ["#809bbb", "#a4c6ab", "#dcc779", "#d4a589", "#809bbb"];
  const nowAngle =
    Math.min(1, Math.max(0, yearFraction(time.toISOString(), year))) * 360;
  const yearPointer = dialPoint(nowAngle, 272);
  return (
    <ClockTooltipProvider resetKey={`${snapshot.id}:${Boolean(weather)}`}>
      <svg
        className="celestial-dial"
        viewBox="0 0 900 900"
        role="group"
        aria-label="Celestial clock. Inner rings show UTC time and calendar dates. Outer rings show tropical planetary longitudes. Select a mark for details."
      >
        <defs>
          <radialGradient id="clock-face">
            <stop stopColor="#14293e" />
            <stop offset="1" stopColor="#081421" />
          </radialGradient>
        </defs>
        <circle
          cx="450"
          cy="450"
          r="414"
          fill="url(#clock-face)"
          stroke="#3a4a5c"
        />
        <g data-evidence-id={civilId}>
          {timeRings.map((ring) => (
            <ClockTooltipTarget
              key={ring.label}
              className={ring.label === "Seconds" ? "clock-seconds" : ""}
              explanation={{
                title: ring.label,
                value:
                  ring.label === "Weekday"
                    ? [
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                      ][ring.value]
                    : `${ring.value + (ring.label === "Date" ? 1 : 0)}${ring.label === "Date" ? ` of ${dayCount}` : " UTC"}`,
                meaning:
                  ring.label === "Date"
                    ? "The day of the month. The number of segments follows the length of the displayed month, including leap days."
                    : ring.label === "Weekday"
                      ? "The seven segments follow the UTC week, starting with Sunday at the top."
                      : `This band divides the ${ring.label === "Hours" ? "UTC day into 24 hours" : ring.label === "Minutes" ? "hour into 60 minutes" : "minute into 60 seconds"}.`,
                reading:
                  "The brightest segment marks the displayed value. Dimmer segments show the rest of this cycle. Each time band has its own scale.",
                evidenceId: civilId,
                utc: time.toISOString(),
                source: "UTC civil calendar",
              }}
            >
              {Array.from({ length: ring.divisions }, (_, i) => (
                <path
                  key={i}
                  d={arc(
                    ring.radius,
                    (i * 360) / ring.divisions + 0.8,
                    ((i + 1) * 360) / ring.divisions - 0.8,
                  )}
                  stroke={ring.color}
                  strokeOpacity={
                    i === ring.value ? 1 : i < ring.value ? 0.38 : 0.12
                  }
                  strokeWidth={ring.label === "Date" ? 13 : 12}
                  fill="none"
                />
              ))}
            </ClockTooltipTarget>
          ))}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, i) => (
            <text
              key={label}
              {...dialPoint(((i + 0.5) * 360) / 7, 165)}
              className="clock-ring-label"
            >
              {label}
            </text>
          ))}
          {Array.from(
            { length: dayCount },
            (_, i) =>
              (i === 0 || (i + 1) % 5 === 0) && (
                <text
                  key={i}
                  {...dialPoint(((i + 0.5) * 360) / dayCount, 190)}
                  className="clock-ring-label"
                >
                  {i + 1}
                </text>
              ),
          )}
        </g>
        <g data-evidence-id={snapshot.calendar.id}>
          {months.map((label, month) => {
            const start =
              yearFraction(
                new Date(Date.UTC(year, month, 1)).toISOString(),
                year,
              ) * 360;
            const end =
              yearFraction(
                new Date(Date.UTC(year, month + 1, 1)).toISOString(),
                year,
              ) * 360;
            return (
              <ClockTooltipTarget
                key={label}
                explanation={{
                  title: new Date(Date.UTC(year, month, 1)).toLocaleDateString(
                    "en-GB",
                    { month: "long", timeZone: "UTC" },
                  ),
                  value: `${year} · ${new Date(Date.UTC(year, month + 1, 0)).getUTCDate()} days`,
                  meaning:
                    "This segment represents a month of the displayed year. Its width reflects the actual number of days in that month.",
                  reading:
                    "January begins at the top and dates advance clockwise. The gold segment is the displayed month.",
                  evidenceId: snapshot.calendar.id,
                  source: "UTC civil calendar",
                }}
              >
                <path
                  d={arc(216, start + 0.4, end - 0.4)}
                  fill="none"
                  stroke={month === time.getUTCMonth() ? "#c9a75d" : "#5d6e80"}
                  strokeWidth="25"
                  strokeOpacity={month === time.getUTCMonth() ? 0.6 : 0.28}
                />
                <text
                  {...dialPoint((start + end) / 2, 216)}
                  className="clock-month-label"
                >
                  {label}
                </text>
              </ClockTooltipTarget>
            );
          })}
          {boundaries.slice(0, -1).map((start, i) => (
            <ClockTooltipTarget
              key={i}
              explanation={{
                title: "Seasonal interval",
                value: `Northern ${["winter", "spring", "summer", "autumn", "winter"][i]} · Southern ${["summer", "autumn", "winter", "spring", "summer"][i]}`,
                meaning:
                  "Astronomical seasons begin at equinoxes and solstices. Seasons are opposite in the northern and southern hemispheres.",
                reading:
                  "The coloured band runs between calculated seasonal boundaries. It describes the astronomical calendar, not local weather. Select a boundary dot for its exact time.",
                evidenceId: snapshot.calendar.id,
                source: `Astronomy Engine ${snapshot.method.engineVersion}`,
              }}
            >
              <path
                d={arc(240, start + 0.3, boundaries[i + 1] - 0.3)}
                stroke={seasonColors[i]}
                strokeWidth="9"
                fill="none"
                opacity="0.8"
              />
            </ClockTooltipTarget>
          ))}
          <circle
            cx="450"
            cy="450"
            r="262"
            stroke="#5c6a7b"
            fill="none"
            strokeWidth="1"
          />
          <line
            x1="450"
            y1="450"
            x2={yearPointer.x}
            y2={yearPointer.y}
            stroke="#e3c777"
            strokeOpacity="0.3"
          />
          <circle cx={yearPointer.x} cy={yearPointer.y} r="3" fill="#e3c777" />
        </g>
        {snapshot.calendar.events.map((event) => {
          const p = dialPoint(
            yearFraction(event.utc, year) * 360,
            event.kind === "season" ? 240 : 262,
          );
          return (
            <ClockTooltipTarget
              key={event.id}
              href="#clock-detail"
              explanation={explainEvent(
                event,
                time,
                snapshot.method.engineVersion,
              )}
              onActivate={() => onSelect(event.id)}
              className="clock-mark"
            >
              <circle cx={p.x} cy={p.y} r="10" fill="transparent" />
              <circle
                cx={p.x}
                cy={p.y}
                r={
                  event.kind === "season"
                    ? 5
                    : event.quarter === 0 || event.quarter === 2
                      ? 4
                      : 2.8
                }
                fill={event.utc <= time.toISOString() ? "#e3d6b7" : "#081421"}
                stroke={selected === event.id ? "#ffffff" : "#bdb7cf"}
                strokeWidth={selected === event.id ? 3 : 1.3}
              />
            </ClockTooltipTarget>
          );
        })}
        <g data-evidence-id={snapshot.id}>
          {zodiac.map((label, i) => (
            <ClockTooltipTarget
              key={label}
              explanation={{
                title: [
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
                ][i],
                value: `${i * 30}°–${(i + 1) * 30}° longitude`,
                meaning:
                  "One of twelve equal 30° divisions of the tropical zodiac. These are coordinate divisions, not the unequal boundaries of astronomical constellations.",
                reading:
                  "Read a planet’s angle against this band. Aries begins at the top; longitude increases clockwise. This ring is a position scale, not a calendar.",
                evidenceId: snapshot.id,
                source: "Tropical zodiac convention",
              }}
            >
              <path
                d={arc(291, i * 30 + 0.4, (i + 1) * 30 - 0.4)}
                stroke={i % 2 ? "#807958" : "#596d86"}
                strokeWidth="22"
                strokeOpacity="0.28"
                fill="none"
              />
              <text
                {...dialPoint(i * 30 + 15, 291)}
                className="clock-zodiac-label"
              >
                {`${label}\uFE0E`}
              </text>
              <line
                {...{
                  x1: dialPoint(i * 30, 305).x,
                  y1: dialPoint(i * 30, 305).y,
                  x2: dialPoint(i * 30, 407).x,
                  y2: dialPoint(i * 30, 407).y,
                }}
                stroke="#8c9baf"
                strokeOpacity="0.15"
              />
            </ClockTooltipTarget>
          ))}
        </g>
        {snapshot.planets.map((planet, i) => {
          const radius = 315 + i * 10;
          const p = dialPoint(planet.longitude, radius);
          return (
            <g
              key={planet.name}
              data-evidence-id={planet.id}
              className="clock-orbit"
            >
              <circle
                className="clock-orbit-track"
                cx="450"
                cy="450"
                r={radius}
                stroke={colors[i]}
                strokeOpacity={selected === planet.id ? 0.5 : 0.12}
                fill="none"
              />
              <ClockTooltipTarget
                href="#clock-detail"
                explanation={explainPlanet(planet, snapshot)}
                onActivate={() => onSelect(planet.id)}
                className="clock-mark"
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="12"
                  fill="#0b1928"
                  stroke={colors[i]}
                  strokeWidth={selected === planet.id ? 2.5 : 1}
                  strokeDasharray={planet.retrograde ? "2 2" : undefined}
                />
                <text
                  x={p.x}
                  y={p.y + 1}
                  fill={colors[i]}
                  className="clock-planet-glyph"
                >
                  {glyphs[i]}
                </text>
              </ClockTooltipTarget>
            </g>
          );
        })}
        {weather?.feeds.map((feed, index) => (
          <g key={feed.kind}>
            <circle
              cx="450"
              cy="450"
              r={426 + index * 14}
              fill="none"
              stroke="#7ca8ad"
              strokeOpacity="0.25"
              strokeDasharray={feed.status === "ready" ? undefined : "2 5"}
            />
            {feed.observations
              .filter(
                (o) =>
                  +new Date(o.utc) <= +time &&
                  +new Date(o.utc) >= +time - 7 * 86_400_000,
              )
              .map((o) => {
                const angle =
                  ((+new Date(o.utc) - (+time - 7 * 86_400_000)) /
                    (7 * 86_400_000)) *
                  360;
                const p = dialPoint(angle, 426 + index * 14);
                return (
                  <ClockTooltipTarget
                    key={o.id}
                    href="#clock-detail"
                    explanation={explainObservation(o, feed)}
                    onActivate={() => onSelect(o.id)}
                    className="clock-mark"
                  >
                    <circle cx={p.x} cy={p.y} r="5" fill="transparent" />
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="2.6"
                      fill={index === 0 ? "#94d6bf" : "#a7c9f1"}
                    />
                  </ClockTooltipTarget>
                );
              })}
          </g>
        ))}
        <circle
          cx="450"
          cy="450"
          r="88"
          fill="#081421"
          stroke="#526071"
          strokeOpacity="0.5"
        />
        <g data-evidence-id={civilId}>
          <text x="450" y="433" className="clock-center-time">
            {time.toISOString().slice(11, 16)}
          </text>
          <text x="450" y="461" className="clock-center-date">
            {time.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              timeZone: "UTC",
            })}
          </text>
          <text x="450" y="484" className="clock-center-zone">
            UTC · {year}
          </text>
        </g>
        <text x="450" y="173" className="clock-scale-caption">
          Year begins ↑
        </text>
        <text x="450" y="24" className="clock-scale-caption">
          0° Aries ↑
        </text>
      </svg>
    </ClockTooltipProvider>
  );
}
