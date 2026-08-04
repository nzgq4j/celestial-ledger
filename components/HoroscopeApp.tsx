"use client";

import { useEffect, useState } from "react";
import { formatDegree } from "@/lib/zodiac";
import type { NatalChart, ResolvedPlace } from "@/lib/types";
import { NatalChartWheel } from "./NatalChartWheel";
import Link from "next/link";
import Image from "next/image";

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
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\s+(?=(?:#{1,3}\s*)?\d{1,2}\.\s+[A-Z])/g, "\n")
    .trim();
  const sections = normalized
    .split(/\n(?=(?:#{1,3}\s*)?\d{1,2}\.\s+)/)
    .filter(Boolean);

  return sections.map((section, i) => {
    const lines = section.trim().split("\n");
    const first = lines.shift() ?? "Chart interpretation";
    const heading = first
      .replace(/^#{1,3}\s*/, "")
      .replace(/^\d{1,2}\.\s*/, "");
    const body = lines.join("\n").trim();
    const paragraphs = (body || (sections.length === 1 ? normalized : ""))
      .split(/\n\s*\n+/)
      .map((paragraph) => paragraph.replace(/^#{1,3}\s*/, "").trim())
      .filter(Boolean);
    return (
      <section key={`${heading}-${i}`} className="interpretation-section">
        <p className="interpretation-section__index">
          {String(i + 1).padStart(2, "0")}
        </p>
        <div>
          <h2>{heading}</h2>
          {paragraphs.map((paragraph, j) => (
            <p key={j}>{paragraph}</p>
          ))}
        </div>
      </section>
    );
  });
}

function MeaningNote({ children }: { children: React.ReactNode }) {
  return (
    <aside className="meaning-note">
      <h3>What does this mean for me?</h3>
      <p>{children}</p>
    </aside>
  );
}

export default function HoroscopeApp() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
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
    if (marketingConsent && (!firstName.trim() || !email.trim()))
      return setError("Add your name and email to join Celestial Atlas notes.");
    setBusy(true);
    try {
      if (marketingConsent) {
        setSubscriptionStatus("Saving your email preference…");
        try {
          const subscriptionResponse = await fetch("/api/marketing/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName,
              email,
              consent: true,
              consentVersion: "marketing-v1-2026-08-03",
              website: "",
            }),
          });
          if (!subscriptionResponse.ok) throw new Error();
          sessionStorage.setItem(
            "celestial-atlas-marketing-email",
            email.trim(),
          );
          sessionStorage.setItem(
            "celestial-atlas-marketing-name",
            firstName.trim(),
          );
          setSubscriptionStatus("You’re subscribed to Celestial Atlas notes.");
        } catch {
          setSubscriptionStatus(
            "Your chart can continue, but the email subscription could not be saved.",
          );
        }
      }
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
    setFirstName("");
    setEmail("");
    setMarketingConsent(false);
    setSubscriptionStatus("");
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
      <header className="atlas-hero">
        <div className="atlas-hero__inner">
          <div className="atlas-hero__content">
            <p className="eyebrow">Astrology for thoughtful reflection</p>
            <h1>
              Navigate
              <br />
              <em>your cosmos.</em>
            </h1>
            <p className="atlas-hero__copy">
              Timeless symbolism. Modern guidance. Explore the sky at your first
              moment through a private, evidence-linked atlas made for
              reflection, not prediction.
            </p>
            <div className="atlas-hero__actions">
              <a className="button-primary atlas-hero__cta" href="#chart">
                Explore your chart
              </a>
              <Link className="atlas-hero__text-link" href="/samples">
                Read a sample <span aria-hidden="true">&#8599;</span>
              </Link>
            </div>
            <p className="atlas-hero__privacy">
              Private by design · Birth data never appears in URLs
            </p>
          </div>
          <div className="atlas-hero__instrument" aria-hidden="true">
            <span className="atlas-hero__orbit atlas-hero__orbit--outer" />
            <span className="atlas-hero__orbit atlas-hero__orbit--inner" />
            <Image
              src="/celestial-compass.png"
              alt=""
              width={720}
              height={720}
              priority
            />
          </div>
        </div>
        <div
          className="atlas-hero__features"
          aria-label="Celestial Atlas principles"
        >
          <article>
            <span aria-hidden="true">&#10022;</span>
            <div>
              <h2>Personalised charts</h2>
              <p>Calculated for your time and place.</p>
            </div>
          </article>
          <article>
            <span aria-hidden="true">&#9788;</span>
            <div>
              <h2>In-depth astrology</h2>
              <p>Placements, aspects, and houses explained.</p>
            </div>
          </article>
          <article>
            <span aria-hidden="true">&#9671;</span>
            <div>
              <h2>Transparent method</h2>
              <p>Every claim connects to chart evidence.</p>
            </div>
          </article>
        </div>
      </header>
      <div
        id="chart"
        className="max-w-6xl mx-auto px-5 py-12 space-y-8 scroll-mt-24"
      >
        <section
          className="chart-introduction"
          aria-labelledby="free-chart-heading"
        >
          <div>
            <p className="section-kicker">Free birth chart calculator</p>
            <h2 id="free-chart-heading">
              A map of the sky at your first moment
            </h2>
            <p>
              Your natal chart preserves the celestial signature of the moment
              you were born. For centuries, astrologers have read these
              planetary patterns as a guide to character, connection, challenge,
              purpose, and possibility.
            </p>
          </div>
          <dl>
            <div>
              <dt>Planets</dt>
              <dd>The drives and functions astrologers interpret.</dd>
            </div>
            <div>
              <dt>Signs</dt>
              <dd>The style through which each placement is expressed.</dd>
            </div>
            <div>
              <dt>Houses</dt>
              <dd>Areas of life, available only when birth time is known.</dd>
            </div>
          </dl>
        </section>
        <section className="panel p-5 md:p-7" aria-labelledby="birth-heading">
          <p className="section-kicker">Free astrology chart</p>
          <h2 id="birth-heading" className="text-xl gold font-semibold">
            Enter your information
          </h2>
          <div className="grid md:grid-cols-2 gap-5 mt-5">
            <div>
              <label className="label" htmlFor="first-name">
                Name
              </label>
              <input
                id="first-name"
                className="input"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                autoComplete="given-name"
                maxLength={80}
                placeholder="Your first name"
              />
            </div>
            <div>
              <label className="label" htmlFor="marketing-email">
                Email
              </label>
              <input
                id="marketing-email"
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                maxLength={254}
                placeholder="you@example.com"
              />
            </div>
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
              <div className="place-search-row">
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
          <label className="marketing-consent">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(event) => setMarketingConsent(event.target.checked)}
            />
            <span>
              Email me occasional Celestial Atlas notes and product updates. I
              can unsubscribe at any time. This is separate from creating an
              account. See the <Link href="/terms">Terms</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </span>
          </label>
          {subscriptionStatus && (
            <p className="marketing-status" role="status">
              {subscriptionStatus}
            </p>
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
              {busy ? "Calculating…" : "Get my free birth chart"}
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
            <section className="big-three-section" aria-label="Big Three">
              <div className="grid md:grid-cols-3 gap-4">
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
              </div>
              <MeaningNote>
                Your Sun describes the self you are growing into, your Moon
                reflects emotional instinct and inner needs, and your
                Ascendant—when birth time is known—describes how you meet the
                world and begin new experiences.
              </MeaningNote>
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
              <MeaningNote>
                This is the earthly anchor of your chart. Date, time, and place
                locate the sky you were born beneath and determine which
                celestial patterns belong to your natal map.
              </MeaningNote>
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
            <aside className="chart-account-cta">
              <div>
                <p className="section-kicker">Keep your atlas</p>
                <h2>Save this chart to a private account</h2>
                <p>
                  Create a verified account to keep your natal chart, manage
                  private reports, and return without entering your birth data
                  again.
                </p>
              </div>
              <Link href="/auth/login" className="button-primary">
                Create my account
              </Link>
            </aside>
            <section className="panel p-5">
              <h2 className="text-xl gold mb-3">Planetary placements</h2>
              <MeaningNote>
                Each planet represents a different drive or faculty. Its sign
                shows how that energy tends to express itself; its house shows
                where in life that pattern is most likely to become noticeable.
              </MeaningNote>
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
                <MeaningNote>
                  The houses divide your chart into twelve fields of lived
                  experience—from identity and relationships to work, home,
                  creativity, community, and inner life.
                </MeaningNote>
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
              <MeaningNote>
                Aspects describe how planetary drives cooperate, amplify, or
                challenge one another. They often reveal recurring strengths,
                tensions, and ways you integrate different parts of yourself.
              </MeaningNote>
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
                <MeaningNote>
                  These settings define the astrological tradition used to
                  construct your chart, ensuring that every placement and
                  relationship is read within one consistent framework.
                </MeaningNote>
                <p className="mt-2 text-sm leading-6">
                  {chart.calculation.zodiac} zodiac;{" "}
                  {chart.calculation.houseSystem} houses;{" "}
                  {chart.calculation.ephemeris}. Default aspect orbs:
                  conjunction/opposition 8°, trine/square 7°, sextile 5°.
                </p>
              </article>
              <article className="panel p-5">
                <h2 className="text-xl gold">Chart precision</h2>
                <MeaningNote>
                  Precision tells you which details can be read confidently.
                  When the birth time is unknown, planetary signs remain useful,
                  while houses, angles, and time-sensitive conclusions are left
                  open.
                </MeaningNote>
                <p className="mt-2 text-sm leading-6">
                  Coordinates and the IANA historical time zone are resolved
                  from the selected place. Unknown times omit houses and angles.
                  Celestial Atlas follows the Western tropical tradition,
                  combining ancient astrological language with transparent,
                  reproducible chart calculation.
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
              <MeaningNote>
                This reading brings the separate chart factors together into
                larger themes, showing how individual placements may combine in
                your temperament, relationships, motivations, and direction.
              </MeaningNote>
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
        <section className="chart-method-notes">
          <article>
            <p className="section-kicker">The moment you arrived</p>
            <h2>Your first sky belongs to you alone</h2>
            <p>
              Date, time, and birthplace reveal the rising sign, houses, and
              planetary pattern held at your first breath—the celestial
              signature from which your atlas unfolds.
            </p>
          </article>
          <article>
            <p className="section-kicker">Ancient language, personal meaning</p>
            <h2>Every placement joins the greater story</h2>
            <p>
              Planets reveal the forces at work, signs reveal how they move, and
              houses reveal where their influence enters daily life. Together
              they form a reading no single placement can tell alone.
            </p>
          </article>
          <article>
            <p className="section-kicker">A living atlas</p>
            <h2>Return whenever the path changes</h2>
            <p>
              Begin with your free natal chart, then explore vocation, renewal,
              and the changing celestial weather through readings shaped around
              your own sky.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
