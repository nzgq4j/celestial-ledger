"use client";

import { useEffect, useRef, useState } from "react";
import {
  clockSnapshotSchema,
  spaceWeatherSchema,
  utcMinute,
  yearFraction,
  type ClockSnapshot,
  type SpaceWeather,
} from "@/lib/clock/domain";
import { ClockDial } from "./ClockDial";
import {
  explainEvent,
  explainObservation,
  explainPlanet,
} from "@/lib/clock/explanations";

const formatDate = (utc: string) =>
  new Date(utc).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";

export function CelestialClock({ initial }: { initial: ClockSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [live, setLive] = useState(true);
  const [tick, setTick] = useState(new Date(initial.utc));
  const [target, setTarget] = useState(initial.utc);
  const [draft, setDraft] = useState(initial.utc.slice(0, 16));
  const [selected, setSelected] = useState("moon");
  const [hemisphere, setHemisphere] = useState("north");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showWeather, setShowWeather] = useState(false);
  const [weather, setWeather] = useState<SpaceWeather | null>(null);
  const [weatherError, setWeatherError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [retry, setRetry] = useState(0);
  const [playing, setPlaying] = useState(false);
  const explorerDialog = useRef<HTMLDialogElement>(null);
  const explorerButton = useRef<HTMLButtonElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (!playing || loading || error || target !== snapshot.utc) return;
    const timer = window.setTimeout(() => {
      const next = new Date(snapshot.utc);
      next.setUTCDate(next.getUTCDate() + 1);
      if (next.getUTCFullYear() !== snapshot.year) {
        setPlaying(false);
        return;
      }
      setTarget(next.toISOString());
      setDraft(next.toISOString().slice(0, 16));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [playing, loading, error, target, snapshot.utc, snapshot.year]);

  useEffect(() => {
    const update = () => {
      if (document.hidden) return;
      const now = new Date();
      setTick(now);
      if (live) setTarget(utcMinute(now));
    };
    update();
    const interval = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
    };
  }, [live]);

  useEffect(() => {
    if (first.current && target === initial.utc) {
      first.current = false;
      return;
    }
    first.current = false;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/clock?at=${encodeURIComponent(target)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Calculation unavailable");
        const data = clockSnapshotSchema.parse(await response.json());
        if (!controller.signal.aborted) {
          setSnapshot(data);
          setDraft(data.utc.slice(0, 16));
        }
      } catch {
        if (!controller.signal.aborted)
          setError(
            "The sky could not be updated. The last calculated view is still shown.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [target, retry, initial.utc]);

  useEffect(() => {
    if (!showWeather) return;
    const controller = new AbortController();
    const update = async () => {
      if (document.hidden) return;
      try {
        const response = await fetch("/api/clock/space-weather", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Feed unavailable");
        const data = spaceWeatherSchema.parse(await response.json());
        if (!controller.signal.aborted) {
          setWeather(data);
          setWeatherError("");
        }
      } catch {
        if (!controller.signal.aborted)
          setWeatherError(
            "Space weather could not be refreshed. Any retained observations are older data.",
          );
      }
    };
    void update();
    const timer = window.setInterval(() => void update(), 900_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [showWeather, retry]);

  const time =
    live && tick.getUTCFullYear() === snapshot.year
      ? tick
      : new Date(snapshot.utc);
  const viewing = snapshot.utc;
  const travel = (utc: string) => {
    setPlaying(false);
    setLive(false);
    setTarget(utcMinute(new Date(utc)));
    setDraft(utc.slice(0, 16));
  };
  const planet = snapshot.planets.find(
    (p) => p.name === selected || p.id === selected,
  );
  const selectMark = (id: string) => {
    setSelected(snapshot.planets.find((p) => p.id === id)?.name ?? id);
    document.getElementById("clock-detail")?.focus();
  };
  const event = snapshot.calendar.events.find((e) => e.id === selected);
  const observationFeed = weather?.feeds.find((f) =>
    f.observations.some((o) => o.id === selected),
  );
  const observation = observationFeed?.observations.find(
    (o) => o.id === selected,
  );
  const explanation = planet
    ? explainPlanet(planet, snapshot)
    : event
      ? explainEvent(event, time, snapshot.method.engineVersion)
      : observation && observationFeed
        ? explainObservation(observation, observationFeed)
        : null;
  const detail = planet
    ? {
        title: planet.name,
        text: `${planet.degree.toFixed(2)}° ${planet.sign}. ${planet.retrograde ? "Retrograde: apparent motion is backwards through the zodiac." : "Direct: apparent motion is forwards through the zodiac."} Longitude ${planet.longitude.toFixed(4)}°; motion ${planet.speed.toFixed(4)}° per day.`,
        id: planet.id,
        utc: viewing,
      }
    : event
      ? {
          title: event.title,
          text:
            event.kind === "moon"
              ? "Calculated quarter phase of the Moon. The calendar ring places this event within the UTC year."
              : "Calculated seasonal boundary. Seasons are opposite in the northern and southern hemispheres.",
          id: event.id,
          utc: event.utc,
        }
      : observation && observationFeed
        ? {
            title:
              observationFeed.kind === "kp"
                ? "Geomagnetic activity"
                : "Solar wind",
            text: `${observation.value} ${observationFeed.unit}, reported by ${observation.source}. This is an observation, not a forecast.`,
            id: observation.id,
            utc: observation.utc,
          }
        : {
            title: snapshot.moon.label,
            text: `${(snapshot.moon.illuminated * 100).toFixed(1)}% of the Moon’s apparent disc is illuminated. Phase angle ${snapshot.moon.phase.toFixed(2)}°.`,
            id: snapshot.moon.id,
            utc: viewing,
          };
  const seasons = snapshot.calendar.events.filter((e) => e.kind === "season");
  const seasonIndex = seasons.filter((e) => e.utc <= viewing).length % 4;
  const season = (
    hemisphere === "north"
      ? ["Winter", "Spring", "Summer", "Autumn"]
      : ["Summer", "Autumn", "Winter", "Spring"]
  )[seasonIndex];
  const future = snapshot.nextEvents;
  const daysInYear =
    (Date.UTC(snapshot.year + 1, 0, 1) - Date.UTC(snapshot.year, 0, 1)) /
    86_400_000;

  return (
    <div className="celestial-clock">
      <div className="clock-workspace">
        <div className="clock-instrument">
          <div className="clock-instrument-heading">
            <span>{live ? "Live clock" : "Exploring time"}</span>
            <span>Earth-centred view</span>
            <button
              ref={explorerButton}
              type="button"
              aria-haspopup="dialog"
              aria-controls="clock-time-dialog"
              onClick={() => explorerDialog.current?.showModal()}
            >
              Explore time
            </button>
          </div>
          <div
            className="clock-dial-window"
            tabIndex={zoom > 1 ? 0 : undefined}
            aria-label={
              zoom > 1 ? "Zoomed clock. Scroll to explore." : undefined
            }
          >
            <div style={{ width: `${zoom * 100}%` }}>
              <ClockDial
                snapshot={snapshot}
                time={time}
                weather={showWeather ? weather : null}
                selected={planet?.id ?? selected}
                onSelect={selectMark}
              />
            </div>
          </div>
          <div className="clock-dial-tools">
            <span>Solid: past · outlined: upcoming</span>
            <div>
              <button
                type="button"
                aria-label="Zoom out"
                disabled={zoom <= 1}
                onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                aria-label="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                aria-label="Zoom in"
                disabled={zoom >= 2}
                onClick={() => setZoom((z) => Math.min(2, z + 0.5))}
              >
                +
              </button>
            </div>
          </div>
          <p className="clock-scales">
            Calendar: January at the top, clockwise through the year. Planets:
            0° Aries at the top, clockwise through 360°. Track spacing separates
            the planets; it does not represent distance.
          </p>
          <details className="clock-ring-guide">
            <summary>How to read the rings</summary>
            <ol>
              <li>
                Violet hours, blue minutes and gold seconds form the inner
                clock. The brightest segment marks the current value.
              </li>
              <li>
                Weekday, day and month follow. The narrow seasonal band changes
                at the calculated equinoxes and solstices.
              </li>
              <li>
                The small event dots show lunar quarters across the year. Select
                a dot for its date and source.
              </li>
              <li>
                The zodiac band and ten outer planetary tracks show longitude.
                Dashed planet outlines indicate retrograde motion.
              </li>
            </ol>
            <p>
              Use zoom to inspect fine marks, or use the planetary register and
              event lists below.
            </p>
          </details>
        </div>
        <aside className="clock-inspector" aria-label="Clock details">
          <div className="clock-now">
            <p>
              {new Date(viewing).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
            </p>
            <h2>{snapshot.moon.label}</h2>
            <p data-evidence-id={snapshot.moon.id}>
              {(snapshot.moon.illuminated * 100).toFixed(1)}% illuminated
            </p>
            <div
              className="clock-illumination"
              aria-hidden="true"
              data-evidence-id={snapshot.moon.id}
            >
              <span style={{ width: `${snapshot.moon.illuminated * 100}%` }} />
            </div>
          </div>
          <div className="clock-season" data-evidence-id={snapshot.calendar.id}>
            <strong>{season}</strong>
            <label>
              <span className="sr-only">Season hemisphere</span>
              <select
                value={hemisphere}
                onChange={(e) => setHemisphere(e.target.value)}
              >
                <option value="north">Northern hemisphere</option>
                <option value="south">Southern hemisphere</option>
              </select>
            </label>
          </div>
          <section
            className="clock-detail"
            id="clock-detail"
            tabIndex={-1}
            aria-live="polite"
            aria-atomic="true"
          >
            <h3>{detail.title}</h3>
            {explanation ? (
              <>
                <p>{explanation.value}</p>
                <p>{explanation.meaning}</p>
                <p>{explanation.reading}</p>
              </>
            ) : (
              <p>{detail.text}</p>
            )}
            <time dateTime={detail.utc}>{formatDate(detail.utc)}</time>
            {event && (
              <button type="button" onClick={() => travel(event.utc)}>
                View this moment
              </button>
            )}
            <details>
              <summary>Source and calculation</summary>
              <p>
                {observation ? (
                  <a href={observationFeed!.sourceUrl}>NOAA source data</a>
                ) : (
                  "Astronomy Engine " + snapshot.method.engineVersion
                )}
              </p>
              <code>{detail.id}</code>
            </details>
          </section>
          <section className="clock-upcoming">
            <h3>Next in the sky</h3>
            {future.length ? (
              <ol>
                {future.map((e) => (
                  <li key={e.id} data-evidence-id={e.id}>
                    <button type="button" onClick={() => travel(e.utc)}>
                      <span>{e.title}</span>
                      <time dateTime={e.utc}>{formatDate(e.utc)}</time>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No more events within the supported date range.</p>
            )}
          </section>
        </aside>
      </div>

      <dialog
        ref={explorerDialog}
        id="clock-time-dialog"
        className="clock-time-dialog"
        aria-labelledby="clock-explorer-title"
        onClose={() => {
          setPlaying(false);
          explorerButton.current?.focus({ preventScroll: true });
        }}
        onClick={(e) => {
          if (e.target !== e.currentTarget) return;
          const box = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < box.left ||
            e.clientX > box.right ||
            e.clientY < box.top ||
            e.clientY > box.bottom
          )
            e.currentTarget.close();
        }}
      >
        <section className="clock-explorer">
          <button
            type="button"
            className="clock-time-close"
            aria-label="Close time explorer"
            onClick={() => explorerDialog.current?.close()}
          >
            ×
          </button>
          <div>
            <h2 id="clock-explorer-title">Move through time</h2>
            <p>
              Explore a moment between 2000 and 2050. All dates and times use
              UTC.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const date = new Date(draft + ":00.000Z");
              if (
                Number.isFinite(+date) &&
                date.getUTCFullYear() >= 2000 &&
                date.getUTCFullYear() <= 2050
              )
                travel(date.toISOString());
            }}
          >
            <label htmlFor="clock-date">Date and time (UTC)</label>
            <div className="clock-date-actions">
              <input
                id="clock-date"
                type="datetime-local"
                required
                min="2000-01-01T00:00"
                max="2050-12-31T23:59"
                value={draft}
                onInput={(e) => setDraft(e.currentTarget.value)}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="submit">Explore</button>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setLive(true);
                  setTarget(utcMinute(new Date()));
                }}
              >
                Back to now
              </button>
            </div>
          </form>
          <div className="clock-year-slider">
            <div className="clock-playback">
              <button
                type="button"
                aria-label={
                  playing ? "Pause playback" : "Play through the year"
                }
                aria-pressed={playing}
                disabled={loading || Boolean(error)}
                onClick={() => {
                  setLive(false);
                  setTarget(snapshot.utc);
                  setPlaying((value) => !value);
                }}
              >
                {playing ? "Ⅱ" : "▶"}
              </button>
              <span>
                {live
                  ? "Live mode"
                  : playing
                    ? "Playing · one day per step"
                    : "Exploring time"}
              </span>
              <time dateTime={viewing}>{formatDate(viewing)}</time>
            </div>
            <label htmlFor="clock-year">Explore {snapshot.year}</label>
            <input
              id="clock-year"
              type="range"
              min="0"
              max={daysInYear - 1}
              step="1"
              value={Math.min(
                daysInYear - 1,
                Math.floor(yearFraction(target, snapshot.year) * daysInYear),
              )}
              aria-valuetext={new Date(target).toLocaleDateString("en-GB", {
                timeZone: "UTC",
              })}
              onChange={(e) => {
                const date = new Date(
                  Date.UTC(snapshot.year, 0, 1 + Number(e.target.value), 12),
                );
                travel(date.toISOString());
              }}
            />
            <div>
              <span>January</span>
              <span>December</span>
            </div>
          </div>
          <p role="status">
            {loading
              ? "Calculating selected moment…"
              : error ||
                `Sky positions calculated for ${formatDate(viewing)}. ${live ? "Positions refresh each minute." : playing ? "Playing one day per step." : "Date explorer paused at this moment."}`}
          </p>

          {error && (
            <button type="button" onClick={() => setRetry((n) => n + 1)}>
              Try again
            </button>
          )}
        </section>
      </dialog>

      <section className="clock-register" aria-labelledby="clock-planets-title">
        <header>
          <h2 id="clock-planets-title">The planetary register</h2>
          <p>Tropical zodiac · geocentric longitude</p>
        </header>
        <div className="clock-planets">
          {snapshot.planets.map((p) => (
            <button
              type="button"
              key={p.name}
              data-evidence-id={p.id}
              aria-pressed={planet?.id === p.id}
              onClick={() => selectMark(p.id)}
            >
              <strong>{p.name}</strong>
              <span>
                {p.degree.toFixed(2)}° {p.sign}
              </span>
              <small>{p.retrograde ? "Retrograde" : "Direct"}</small>
            </button>
          ))}
        </div>
        <p>
          Retrograde describes apparent motion as seen from Earth. Zodiac signs
          here are equal 30° divisions, not astronomical constellation
          boundaries.
        </p>
      </section>

      <section className="clock-weather" aria-labelledby="clock-weather-title">
        <header>
          <div>
            <h2 id="clock-weather-title">Space weather</h2>
            <p>
              Optional observations from NOAA. Geomagnetic activity is not a
              report of local aurora visibility.
            </p>
          </div>
          <label className="clock-weather-toggle">
            <input
              type="checkbox"
              checked={showWeather}
              onChange={(e) => setShowWeather(e.target.checked)}
            />
            Show observation rings
          </label>
        </header>
        {showWeather && (
          <div aria-live="polite">
            {weatherError && (
              <p role="alert">
                {weatherError}{" "}
                <button type="button" onClick={() => setRetry((n) => n + 1)}>
                  Retry
                </button>
              </p>
            )}
            {!weather && !weatherError && <p>Checking NOAA observations…</p>}
            {weather?.feeds.map((feed) => {
              const points = feed.observations.filter(
                (o) =>
                  o.utc <= viewing &&
                  +new Date(o.utc) >= +new Date(viewing) - 7 * 86_400_000,
              );
              const latest = points.at(-1);
              return (
                <article key={feed.kind}>
                  <h3>
                    {feed.kind === "kp"
                      ? "Geomagnetic activity"
                      : "Solar wind speed"}
                  </h3>
                  <p>
                    {latest ? (
                      <>
                        <strong>
                          {latest.value} {feed.unit}
                        </strong>{" "}
                        observed {formatDate(latest.utc)}
                      </>
                    ) : (
                      "No observations available for this selected period."
                    )}
                  </p>
                  <p>
                    {weatherError
                      ? "Refresh failed"
                      : feed.status === "ready"
                        ? "Feed available"
                        : feed.status === "stale"
                          ? "Older data — feed is stale"
                          : "Feed unavailable"}{" "}
                    · checked {formatDate(feed.checkedAt)}
                  </p>
                  <a href={feed.sourceUrl}>NOAA source</a>
                  {points.length > 0 && (
                    <details>
                      <summary>Inspect {points.length} observations</summary>
                      <ul className="clock-observations">
                        {points.map((o) => (
                          <li key={o.id}>
                            <button
                              type="button"
                              data-evidence-id={o.id}
                              onClick={() => selectMark(o.id)}
                            >
                              {formatDate(o.utc)}: {o.value} {feed.unit}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </article>
              );
            })}
            <p>
              The two outer observation rings run clockwise through the seven
              days before the selected moment. They only show the available feed
              window; an empty period does not mean zero activity. Wind is
              sampled hourly.
            </p>
          </div>
        )}
      </section>

      <details className="clock-year-events">
        <summary>All lunar and seasonal events in {snapshot.year}</summary>
        <ul>
          {snapshot.calendar.events.map((e) => (
            <li key={e.id} data-evidence-id={e.id}>
              <button type="button" onClick={() => travel(e.utc)}>
                {e.title}
                <time dateTime={e.utc}>{formatDate(e.utc)}</time>
              </button>
            </li>
          ))}
        </ul>
      </details>
      <footer className="clock-method">
        <h2>About this clock</h2>
        <p>
          A view of astronomical cycles and civil time. Astrology is symbolic
          reflection, not scientifically validated prediction. The clock does
          not use birth details or infer your location.
        </p>
        <details>
          <summary>Calculation record</summary>
          <dl>
            {Object.entries(snapshot.method).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value ?? "Not applicable (global sky)"}</dd>
              </div>
            ))}
          </dl>
          <p>
            Snapshot: <code>{snapshot.id}</code>
          </p>
          <p>
            Calendar: <code>{snapshot.calendar.id}</code>
          </p>
          <p>
            Time-ring evidence uses the displayed UTC timestamp. Astronomical
            marks use the recorded snapshot; no language model calculates their
            positions.
          </p>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `celestial-clock-${viewing.slice(0, 10)}.json`;
              link.click();
              window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            Download calculation record
          </button>
        </details>
      </footer>
    </div>
  );
}
