"use client";

import { useEffect, useState } from "react";
import { formatDegree } from "@/lib/zodiac";
import type { NatalChart, ResolvedPlace } from "@/lib/types";
import { NatalChartWheel } from "./NatalChartWheel";

const ZODIAC_SYMBOLS = [
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
] as const;

function interpretationMarkup(text: string) {
  return text.split(/\n(?=\d+\.\s)/).map((section, i) => {
    const [first, ...rest] = section.trim().split("\n");
    return (
      <section key={i}>
        <h2>{first.replace(/^\d+\.\s*/, "")}</h2>
        {rest
          .join("\n")
          .split(/\n\n+/)
          .filter(Boolean)
          .map((p, j) => (
            <p key={j}>{p}</p>
          ))}
      </section>
    );
  });
}

export default function HoroscopeApp() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [unknown, setUnknown] = useState(false);
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<ResolvedPlace[]>([]);
  const [place, setPlace] = useState<ResolvedPlace>();
  const [chart, setChart] = useState<NatalChart>();
  const [interpretation, setInterpretation] = useState("");
  const [interpretationLoading, setInterpretationLoading] = useState(false);
  const [interpretationProgress, setInterpretationProgress] = useState(0);
  const [interpretationError, setInterpretationError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [ambiguity, setAmbiguity] = useState<"earlier" | "later" | undefined>();
  const [saveStatus, setSaveStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!interpretationLoading) {
      setInterpretationProgress(0);
      return;
    }
    setInterpretationProgress(8);
    const timer = window.setInterval(
      () =>
        setInterpretationProgress((value) =>
          value >= 92
            ? value
            : Math.min(
                92,
                value + Math.max(1, Math.round((92 - value) * 0.08)),
              ),
        ),
      450,
    );
    return () => window.clearInterval(timer);
  }, [interpretationLoading]);

  async function searchPlaces() {
    setError("");
    setSearching(true);
    setPlace(undefined);
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setPlaces(j.places);
      if (!j.places.length)
        setError("No resolved birthplace matched that search.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Geocoding failed.");
    } finally {
      setSearching(false);
    }
  }

  async function calculate() {
    setError("");
    setInterpretation("");
    setInterpretationError("");
    setInterpretationLoading(false);
    if (!date) return setError("Birth date is required.");
    if (!unknown && !time)
      return setError(
        "Birth time is required unless ‘Birth time unknown’ is selected.",
      );
    if (!place)
      return setError("Select a resolved birthplace from the search results.");
    setBusy(true);
    try {
      const birthInput = {
        date,
        time: unknown ? undefined : time,
        timeUnknown: unknown,
        disambiguation: ambiguity,
        place,
      };
      const chartResponse = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthInput }),
      });
      const chartPayload = await chartResponse.json();
      if (!chartResponse.ok) throw new Error(chartPayload.error);
      const result = chartPayload.chart as NatalChart;
      setChart(result);
      setInterpretationLoading(true);
      try {
        const r = await fetch("/api/interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ birthInput }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        if (typeof j.interpretation !== "string" || !j.interpretation.trim())
          throw new Error(
            "The interpretation service returned an empty response. The calculated chart remains available.",
          );
        setInterpretationProgress(100);
        setInterpretation(j.interpretation.trim());
      } catch (e) {
        setInterpretationError(
          e instanceof Error
            ? e.message
            : "The interpretation request failed. The calculated chart remains available.",
        );
      } finally {
        setInterpretationLoading(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chart calculation failed.");
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    setDate("");
    setTime("");
    setUnknown(false);
    setQuery("");
    setPlaces([]);
    setPlace(undefined);
    setChart(undefined);
    setInterpretation("");
    setInterpretationLoading(false);
    setInterpretationError("");
    setError("");
    setAmbiguity(undefined);
    setSaveStatus("");
  }

  async function saveChart() {
    if (!chart) return;
    setSaving(true);
    setSaveStatus("");
    try {
      const response = await fetch("/api/birth-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: "My birth chart",
          birthInput: chart.input,
        }),
      });
      const payload = await response.json();
      if (response.status === 401) {
        setSaveStatus("Sign in to save this chart privately.");
        return;
      }
      if (!response.ok) throw new Error(payload.error);
      setSaveStatus("Saved privately. You can manage it from your account.");
    } catch (caught) {
      setSaveStatus(
        caught instanceof Error
          ? caught.message
          : "The chart could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-[#2b3a4e]">
        <div className="max-w-6xl mx-auto px-5 py-8">
          <p className="gold uppercase tracking-[.22em] text-xs">
            Celestial Atlas
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold mt-2">
            Your natal chart, calculated before it is interpreted.
          </h1>
          <p className="text-[#b9b2a3] mt-3 max-w-3xl">
            Astronomical positions are calculated deterministically. The
            language model explains validated chart data and does not calculate
            or modify placements.
          </p>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-5 py-8 space-y-8">
        <section className="panel p-5 md:p-7" aria-labelledby="birth-heading">
          <h2 id="birth-heading" className="text-xl gold font-semibold">
            Birth information
          </h2>
          <div className="grid md:grid-cols-2 gap-5 mt-5">
            <div>
              <label className="label" htmlFor="birth-date">
                Birth date
              </label>
              <input
                id="birth-date"
                className="input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="birth-time">
                Exact birth time
              </label>
              <input
                id="birth-time"
                className="input"
                type="time"
                disabled={unknown}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
              <label className="flex gap-2 mt-3 text-sm text-[#ddd6c8]">
                <input
                  type="checkbox"
                  checked={unknown}
                  onChange={(e) => setUnknown(e.target.checked)}
                />{" "}
                Birth time unknown
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="label" htmlFor="place">
                Birthplace search
              </label>
              <div className="flex gap-2">
                <input
                  id="place"
                  className="input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchPlaces()}
                  placeholder="City, region, country"
                />
                <button
                  type="button"
                  onClick={searchPlaces}
                  disabled={searching}
                  className="px-5 rounded-lg bg-[#c9a75d] text-[#07111f] font-semibold"
                >
                  {searching ? "Searching…" : "Search"}
                </button>
              </div>
            </div>
          </div>
          {places.length > 0 && (
            <fieldset className="mt-4">
              <legend className="label">Select the verified birthplace</legend>
              <div className="grid gap-2">
                {places.map((p) => (
                  <label
                    key={p.id}
                    className="p-3 border border-[#34455c] rounded-lg flex gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="place"
                      checked={place?.id === p.id}
                      onChange={() => setPlace(p)}
                    />
                    <span>
                      <strong>
                        {p.city}
                        {p.region ? `, ${p.region}` : ""}, {p.country}
                      </strong>
                      <br />
                      <small className="text-[#b9b2a3]">
                        {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)} ·{" "}
                        {p.timeZone}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {place && (
            <div className="mt-4 p-4 bg-[#081524] rounded-lg">
              <strong>Selected place:</strong> {place.city}
              {place.region ? `, ${place.region}` : ""}, {place.country}
              <br />
              <span className="text-sm text-[#b9b2a3]">
                Latitude {place.latitude.toFixed(5)} · Longitude{" "}
                {place.longitude.toFixed(5)} · Historical time zone{" "}
                {place.timeZone}
              </span>
            </div>
          )}
          {!unknown && (
            <div className="mt-4">
              <span className="label">
                Repeated-clock interpretation, only when requested
              </span>
              <label className="mr-4 text-sm">
                <input
                  type="radio"
                  name="amb"
                  checked={ambiguity === "earlier"}
                  onChange={() => setAmbiguity("earlier")}
                />{" "}
                Earlier occurrence
              </label>
              <label className="text-sm">
                <input
                  type="radio"
                  name="amb"
                  checked={ambiguity === "later"}
                  onChange={() => setAmbiguity("later")}
                />{" "}
                Later occurrence
              </label>
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="mt-4 p-3 rounded-lg border border-[#8b5b53] bg-[#2b1718]"
            >
              {error}
            </div>
          )}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={calculate}
              disabled={busy}
              className="px-6 py-3 rounded-lg bg-[#c9a75d] text-[#07111f] font-semibold"
            >
              {busy ? "Calculating…" : "Calculate My Chart"}
            </button>
            <button
              onClick={clearAll}
              className="px-6 py-3 rounded-lg border border-[#536177]"
            >
              Clear My Data
            </button>
          </div>
        </section>

        {chart && (
          <>
            <section
              className="grid md:grid-cols-3 gap-4"
              aria-label="Big Three"
            >
              {[
                chart.placements.find((p) => p.name === "Sun"),
                chart.placements.find((p) => p.name === "Moon"),
                chart.ascendant,
              ].map((p, i) => (
                <article key={i} className="panel p-5">
                  <p className="label">
                    {i === 0 ? "Sun" : i === 1 ? "Moon" : "Ascendant"}
                  </p>
                  {p ? (
                    <>
                      <h2 className="text-2xl gold">{p.sign}</h2>
                      <p>{formatDegree(p.longitude)}</p>
                      {p.uncertain && (
                        <p className="text-sm text-[#d7bd7b] mt-2">
                          The Moon may change signs during this date.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl text-[#b9b2a3]">Unavailable</h2>
                      <p className="text-sm">
                        An exact birth time is required.
                      </p>
                    </>
                  )}
                </article>
              ))}
            </section>
            <NatalChartWheel chart={chart} />
            <section className="panel p-5">
              <h2 className="text-xl gold">Birth-data summary</h2>
              <p className="mt-2">
                {chart.input.date}{" "}
                {chart.timeKnown ? chart.input.time : "time unknown"} ·{" "}
                {chart.input.place.displayName}
              </p>
              <p className="text-sm text-[#b9b2a3]">
                Normalized UTC: {chart.utc} · Zone: {chart.input.place.timeZone}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={saveChart}
                  disabled={saving}
                  className="rounded-lg border border-[#536177] px-4 py-2"
                >
                  {saving ? "Saving…" : "Save privately"}
                </button>
                {saveStatus && (
                  <p role="status" className="text-sm text-[#d7bd7b]">
                    {saveStatus}
                  </p>
                )}
              </div>
            </section>
            <section className="panel p-5">
              <h2 className="text-xl gold mb-3">Planetary placements</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Body</th>
                      <th>Position</th>
                      <th>House</th>
                      <th>Motion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chart.placements.map((p) => (
                      <tr key={p.name}>
                        <td>{p.name}</td>
                        <td>{formatDegree(p.longitude)}</td>
                        <td>{p.house ?? "—"}</td>
                        <td>{p.retrograde ? "Retrograde" : "Direct"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            {chart.houses.length > 0 && (
              <section className="panel p-5">
                <h2 className="text-xl gold mb-3">House cusps</h2>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>House</th>
                        <th>Cusp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chart.houses.map((h) => (
                        <tr key={h.house}>
                          <td>{h.house}</td>
                          <td>{formatDegree(h.longitude)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            <section className="panel p-5">
              <h2 className="text-xl gold mb-3">Major aspects</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Bodies</th>
                      <th>Aspect</th>
                      <th>Angle</th>
                      <th>Orb</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chart.aspects.map((a, i) => (
                      <tr key={i}>
                        <td>
                          {a.body1}–{a.body2}
                        </td>
                        <td>{a.type}</td>
                        <td>{a.angle.toFixed(2)}°</td>
                        <td>{a.orb.toFixed(2)}°</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="grid md:grid-cols-2 gap-4">
              <article className="panel p-5">
                <h2 className="text-xl gold">Calculation method</h2>
                <p className="mt-2 text-sm leading-6">
                  {chart.calculation.zodiac} zodiac;{" "}
                  {chart.calculation.houseSystem} houses;{" "}
                  {chart.calculation.ephemeris}. Default aspect orbs:
                  conjunction/opposition 8°, trine/square 7°, sextile 5°.
                </p>
              </article>
              <article className="panel p-5">
                <h2 className="text-xl gold">Accuracy and limitations</h2>
                <p className="mt-2 text-sm leading-6">
                  Coordinates and the IANA historical time zone are resolved
                  from the selected place. Unknown times omit houses and angles.
                  Astrology is presented as a symbolic tradition rather than
                  scientifically validated prediction.
                </p>
              </article>
            </section>
            <section className="panel p-5 md:p-7" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl gold">Interpretation</h2>
                <div
                  className="flex flex-wrap gap-2 text-xl text-[#c9a75d]"
                  aria-label="Zodiac constellation symbols"
                >
                  {ZODIAC_SYMBOLS.map((symbol) => (
                    <span key={symbol} aria-hidden="true">
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
              {interpretationLoading ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[#ddd6c8]">
                      Generating your interpretation…
                    </p>
                    <span className="text-sm gold tabular-nums">
                      {interpretationProgress}%
                    </span>
                  </div>
                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-[#142338]"
                    role="progressbar"
                    aria-label="Interpretation generation progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={interpretationProgress}
                  >
                    <div
                      className="h-full rounded-full bg-[#c9a75d] transition-[width] duration-500 ease-out"
                      style={{ width: `${interpretationProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-[#b9b2a3] mt-2">
                    The calculated chart remains available while the written
                    analysis is prepared.
                  </p>
                </div>
              ) : interpretation ? (
                <div className="prose mt-4">
                  {interpretationMarkup(interpretation)}
                </div>
              ) : interpretationError ? (
                <div
                  role="alert"
                  className="mt-3 p-3 rounded-lg border border-[#8b5b53] bg-[#2b1718]"
                >
                  <p>{interpretationError}</p>
                </div>
              ) : (
                <p className="mt-3 text-[#b9b2a3]">
                  Submit valid birth information to generate a written
                  interpretation.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
