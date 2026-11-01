"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NatalChart, Placement, ResolvedPlace } from "@/lib/types";
import { useLocale } from "@/components/LocaleProvider";
import {
  LandingPathways,
  LandingPlanStrip,
} from "@/components/LandingPathways";
import { NatalInterpretation } from "@/components/NatalInterpretation";
import {
  aspectGlyphs,
  NatalChartWheel,
  planetGlyphs,
  signGlyph,
  TEXT_GLYPH,
} from "@/components/NatalChartWheel";
import { localizeAstroTerm } from "@/lib/reports/evidence-label";
import { ATLAS_PLAN_KEY, ATLAS_PRICES } from "@/lib/membership/plans";
import { resolveLocalDateTime } from "@/lib/time";
import "@/app/styles/atlas-public.css";

type ChartTab = "planets" | "houses" | "aspects";
const chartTabs: ChartTab[] = ["planets", "houses", "aspects"];

const signedNumber = (value: number) => value.toFixed(4).replace(/^-/, "−");

export default function HoroscopeApp({
  account,
}: {
  account?: { displayName: string };
}) {
  const { pack, locale } = useLocale();
  const copy = pack.messages.home;
  const form = pack.messages.chartForm;
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(true);
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
  const [savedProfileId, setSavedProfileId] = useState("");
  const [interpretationProvenance, setInterpretationProvenance] = useState<{
    modelVersion: string;
    promptVersion: string;
  }>();
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [tab, setTab] = useState<ChartTab>("planets");
  const resultHeading = useRef<HTMLHeadingElement>(null);

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

  useEffect(() => {
    if (!chart) return;
    resultHeading.current?.focus({ preventScroll: true });
    resultHeading.current?.scrollIntoView({ block: "start" });
  }, [chart]);

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

  function choosePlace(next: ResolvedPlace) {
    setPlace(next);
    setQuery(next.displayName);
    setPlaces([]);
  }

  async function calculate() {
    setError("");
    setInterpretation("");
    setInterpretationProvenance(undefined);
    setCheckoutError("");
    setInterpretationError("");
    setInterpretationLoading(false);
    if (!date) return setError("Birth date is required.");
    if (!unknown && !time)
      return setError(
        "Birth time is required unless you tick ‘I don’t know my birth time’.",
      );
    if (!place)
      return setError("Select a resolved birthplace from the search results.");
    if (!account && marketingConsent && (!firstName.trim() || !email.trim()))
      return setError("Add your name and email to join Celestial Atlas notes.");
    setBusy(true);
    try {
      if (!account && marketingConsent) {
        setSubscriptionStatus("Saving your email preference…");
        try {
          const recaptchaToken = await executeRecaptcha();
          const subscriptionResponse = await fetch("/api/marketing/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName,
              email,
              consent: true,
              consentVersion: "marketing-v1-2026-08-03",
              website: "",
              recaptchaToken,
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
      setTab("planets");
      setInterpretationLoading(true);
      try {
        const r = await fetch("/api/interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            birthInput,
            ...(account
              ? { saveToAccount: true, label: "My birth chart" }
              : {}),
          }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        if (typeof j.interpretation !== "string" || !j.interpretation.trim())
          throw new Error(
            "The interpretation service returned an empty response. The calculated chart remains available.",
          );
        setInterpretationProgress(100);
        setInterpretation(j.interpretation.trim());
        if (
          typeof j.provenance?.modelVersion === "string" &&
          typeof j.provenance?.promptVersion === "string"
        )
          setInterpretationProvenance(j.provenance);
        if (account && j.birthProfile?.id) {
          setSaveStatus(form.accountSaved);
          setSavedProfileId(String(j.birthProfile.id));
        }
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
    setSavedProfileId("");
    setInterpretationProvenance(undefined);
    setCheckoutBusy(false);
    setCheckoutError("");
  }

  async function continueWithAtlas() {
    if (!chart || !interpretation || !interpretationProvenance) return;
    const checkoutEmail = email.trim();
    if (!checkoutEmail) {
      setCheckoutError("Add your email before continuing to secure checkout.");
      return;
    }
    setCheckoutBusy(true);
    setCheckoutError("");
    try {
      const recaptchaToken = await executeRecaptcha(
        "anonymous_subscription_checkout",
      );
      const response = await fetch(
        "/api/stripe/anonymous-subscription-checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planKey: ATLAS_PLAN_KEY,
            displayName: firstName.trim() || undefined,
            email: checkoutEmail,
            birthInput: chart.input,
            chart,
            interpretation,
            interpretationModelVersion: interpretationProvenance.modelVersion,
            interpretationPromptVersion: interpretationProvenance.promptVersion,
            recaptchaToken,
          }),
        },
      );
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.url)
        throw new Error(
          result.error ?? pack.messages.chartReveal.checkoutError,
        );
      window.location.assign(result.url);
    } catch (caught) {
      setCheckoutError(
        caught instanceof Error
          ? caught.message
          : pack.messages.chartReveal.checkoutError,
      );
      setCheckoutBusy(false);
    }
  }

  const term = (value: string) => localizeAstroTerm(value, locale);
  const sentence = (value: string) =>
    value.charAt(0).toLocaleUpperCase(locale) + value.slice(1);
  const degreeLabel = (p: { degree: number; minute: number }) =>
    `${p.degree}°${String(p.minute).padStart(2, "0")}′`;
  const houseLabel = (house?: number) =>
    house ? copy.houseNumber.replace("{house}", String(house)) : "";

  function moveTab(event: React.KeyboardEvent<HTMLButtonElement>) {
    const index = chartTabs.indexOf(tab);
    const next =
      event.key === "ArrowRight"
        ? chartTabs[(index + 1) % chartTabs.length]
        : event.key === "ArrowLeft"
          ? chartTabs[(index + chartTabs.length - 1) % chartTabs.length]
          : event.key === "Home"
            ? chartTabs[0]
            : event.key === "End"
              ? chartTabs[chartTabs.length - 1]
              : null;
    if (!next) return;
    event.preventDefault();
    setTab(next);
    document.getElementById(`chart-tab-${next}`)?.focus();
  }

  const bigThree: Array<{
    key: string;
    glyph: string;
    label: string;
    placement?: Placement;
  }> = chart
    ? [
        {
          key: "sun",
          glyph: "☉" + TEXT_GLYPH,
          label: copy.sun,
          placement: chart.placements.find((p) => p.name === "Sun"),
        },
        {
          key: "moon",
          glyph: "☽" + TEXT_GLYPH,
          label: copy.moon,
          placement: chart.placements.find((p) => p.name === "Moon"),
        },
        {
          key: "rising",
          glyph: "AC",
          label: copy.rising,
          placement: chart.ascendant,
        },
      ]
    : [];

  const birthDateLabel = chart
    ? new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${chart.input.date}T12:00:00Z`))
    : "";

  // Only ask "earlier or later?" on the night the clocks went back, when the
  // entered local time really occurred twice in the birthplace's time zone.
  const repeatedLocalTime = (() => {
    if (unknown || !date || !time || !place) return false;
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    if (![year, month, day, hour, minute].every(Number.isFinite)) return false;
    try {
      return (
        resolveLocalDateTime({ year, month, day, hour, minute }, place.timeZone)
          .length > 1
      );
    } catch {
      return false;
    }
  })();

  return (
    <main className="home">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__inner">
          <div className="home-hero__copy">
            <p className="home-hero__kicker">{copy.heroKicker}</p>
            <h1 id="home-title" className="home-hero__title">
              {copy.titleFirst}
              <br />
              <em>{copy.titleSecond}</em>
            </h1>
            <p className="home-hero__intro">{copy.introduction}</p>
            <ul className="home-hero__points" aria-label={copy.featuresLabel}>
              <li>
                <span aria-hidden="true">{"☉" + TEXT_GLYPH}</span>
                {copy.featureBigThree}
              </li>
              <li>
                <span aria-hidden="true">⌂</span>
                {copy.featureHouses}
              </li>
              <li>
                <span aria-hidden="true">✦</span>
                {copy.featureInterpretation}
              </li>
            </ul>
            {account && (
              <Link className="atlas-button home-hero__today" href="/account">
                {copy.todayLink} <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>

          <section
            id="chart"
            className="home-form"
            aria-labelledby="birth-heading"
          >
            <div className="home-form__heading">
              <h2 id="birth-heading">{copy.formTitle}</h2>
              <span className="home-form__step">{copy.formStep}</span>
            </div>
            {account && (
              <p className="home-form__account">
                {form.accountCopy.replace("{name}", account.displayName)}
              </p>
            )}
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void calculate();
              }}
            >
              <div className="home-form__fields">
                <div className="atlas-field home-form__field">
                  <label htmlFor="birth-date">{form.birthDate}</label>
                  <input
                    id="birth-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="atlas-field home-form__field">
                  <label htmlFor="birth-time">{copy.formBirthTime}</label>
                  <input
                    id="birth-time"
                    type="time"
                    disabled={unknown}
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
              <label className="home-form__check">
                <input
                  type="checkbox"
                  checked={unknown}
                  onChange={(e) => setUnknown(e.target.checked)}
                />
                {copy.formUnknownTime}
              </label>

              <div className="atlas-field home-form__field home-form__place">
                <label htmlFor="place">{copy.formBirthplace}</label>
                <div className="home-form__search">
                  <span className="home-form__search-icon" aria-hidden="true">
                    ⌖
                  </span>
                  <input
                    id="place"
                    value={query}
                    data-resolved={place ? "true" : undefined}
                    autoComplete="off"
                    onChange={(e) => {
                      setQuery(e.target.value);
                      if (place && e.target.value !== place.displayName)
                        setPlace(undefined);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      void searchPlaces();
                    }}
                    placeholder={form.birthplacePlaceholder}
                  />
                  <button
                    type="button"
                    className="home-form__search-button"
                    onClick={searchPlaces}
                    disabled={searching || !query.trim()}
                  >
                    {searching ? form.searching : form.search}
                  </button>
                </div>
                {place && (
                  <p className="home-form__resolved" role="status">
                    <span className="sr-only">{copy.formSelectedPlace}: </span>
                    <span aria-hidden="true">✓ </span>
                    {signedNumber(place.latitude)},{" "}
                    {signedNumber(place.longitude)} · {place.timeZone}
                  </p>
                )}
              </div>

              {places.length > 0 && (
                <fieldset className="home-form__places">
                  <legend>{form.selectBirthplace}</legend>
                  {places.map((p) => (
                    <label key={p.id} className="home-form__place-option">
                      <input
                        type="radio"
                        name="place"
                        checked={place?.id === p.id}
                        onChange={() => choosePlace(p)}
                      />
                      <span>
                        <strong>
                          {p.city}
                          {p.region ? `, ${p.region}` : ""}, {p.country}
                        </strong>
                        <small>
                          {signedNumber(p.latitude)},{" "}
                          {signedNumber(p.longitude)} · {p.timeZone}
                        </small>
                      </span>
                    </label>
                  ))}
                </fieldset>
              )}

              {repeatedLocalTime && (
                <fieldset className="home-form__ambiguity">
                  <legend>{copy.formRepeatedClock}</legend>
                  <div className="home-form__ambiguity-options">
                    <label>
                      <input
                        type="radio"
                        name="amb"
                        checked={ambiguity === "earlier"}
                        onChange={() => setAmbiguity("earlier")}
                      />
                      {copy.formEarlier}
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="amb"
                        checked={ambiguity === "later"}
                        onChange={() => setAmbiguity("later")}
                      />
                      {copy.formLater}
                    </label>
                  </div>
                </fieldset>
              )}

              {!account && (
                <>
                  <div className="home-form__fields">
                    <div className="atlas-field home-form__field">
                      <label htmlFor="first-name">{form.name}</label>
                      <input
                        id="first-name"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        autoComplete="given-name"
                        maxLength={80}
                        placeholder={form.namePlaceholder}
                      />
                    </div>
                    <div className="atlas-field home-form__field">
                      <label htmlFor="marketing-email">{form.email}</label>
                      <input
                        id="marketing-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        maxLength={254}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <label className="home-form__check home-form__consent">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(event) =>
                        setMarketingConsent(event.target.checked)
                      }
                    />
                    <span>{copy.formMarketingConsent}</span>
                  </label>
                  {subscriptionStatus && (
                    <p className="home-form__status" role="status">
                      {subscriptionStatus}
                    </p>
                  )}
                </>
              )}

              {error && (
                <div role="alert" className="atlas-public-alert">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={busy}
                className="atlas-button atlas-button--hero home-form__submit"
              >
                {busy ? form.calculating : copy.formCalculate}
              </button>
              <div className="home-form__footer">
                <p>{account ? copy.formAccountPrivacy : copy.formPrivacy}</p>
                <button
                  type="button"
                  className="home-form__clear"
                  onClick={clearAll}
                >
                  {form.clear}
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>

      {chart && (
        <section
          className="natal-result atlas-shell"
          aria-labelledby="natal-result-title"
        >
          <header className="natal-result__header">
            <div>
              <p className="atlas-meta">
                {copy.resultStep} · {birthDateLabel} ·{" "}
                {chart.timeKnown ? chart.input.time : copy.timeUnknown} ·{" "}
                {chart.input.place.displayName}
                {chart.timeKnown && ` · UTC ${chart.utc.slice(11, 16)}`}
              </p>
              <h2
                id="natal-result-title"
                className="atlas-page-title natal-result__title"
                ref={resultHeading}
                tabIndex={-1}
              >
                {copy.resultTitle}
              </h2>
            </div>
            {saveStatus && (
              <p role="status" className="natal-result__saved">
                {saveStatus}
              </p>
            )}
          </header>

          <div className="natal-big-three" aria-label={copy.featureBigThree}>
            {bigThree.map((item) => (
              <article className="natal-big-three__card" key={item.key}>
                <span className="natal-big-three__glyph" aria-hidden="true">
                  {item.glyph}
                </span>
                <div>
                  <h3 className="natal-big-three__label">{item.label}</h3>
                  {item.placement ? (
                    <>
                      <p className="natal-big-three__sign">
                        {term(item.placement.sign)}
                      </p>
                      <p className="natal-big-three__note">
                        {[
                          degreeLabel(item.placement),
                          houseLabel(item.placement.house),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {item.placement.uncertain && (
                        <p className="natal-big-three__note natal-big-three__note--warn">
                          {copy.moonMayChange}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="natal-big-three__sign natal-big-three__sign--muted">
                        —
                      </p>
                      <p className="natal-big-three__note">
                        {copy.risingUnavailable}
                      </p>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="natal-result__grid">
            <div className="natal-result__wheel">
              <NatalChartWheel chart={chart} details={false} />
            </div>
            <div className="natal-tabs">
              <div
                className="natal-tabs__list"
                role="tablist"
                aria-label={copy.tabsLabel}
              >
                {chartTabs.map((key) => (
                  <button
                    key={key}
                    id={`chart-tab-${key}`}
                    type="button"
                    role="tab"
                    aria-selected={tab === key}
                    aria-controls={
                      tab === key ? `chart-panel-${key}` : undefined
                    }
                    tabIndex={tab === key ? 0 : -1}
                    onClick={() => setTab(key)}
                    onKeyDown={moveTab}
                  >
                    {key === "planets"
                      ? copy.tabPlanets
                      : key === "houses"
                        ? copy.tabHouses
                        : copy.tabAspects}
                  </button>
                ))}
              </div>
              <div
                id={`chart-panel-${tab}`}
                role="tabpanel"
                aria-labelledby={`chart-tab-${tab}`}
                tabIndex={0}
                className="natal-tabs__panel"
              >
                {tab === "planets" && (
                  <ul className="natal-rows">
                    {chart.placements.map((p) => (
                      <li key={p.name}>
                        <span className="natal-rows__glyph" aria-hidden="true">
                          {(planetGlyphs[p.name] ?? "·") + TEXT_GLYPH}
                        </span>
                        <span className="natal-rows__name">{term(p.name)}</span>
                        <span className="natal-rows__position">
                          {degreeLabel(p)}{" "}
                          <span aria-hidden="true">{signGlyph(p.sign)}</span>
                          <span className="sr-only">{term(p.sign)}</span>
                        </span>
                        <span className="natal-rows__meta">
                          {houseLabel(p.house)}
                          {p.retrograde && (
                            <>
                              {" "}
                              <span aria-hidden="true">℞</span>
                              <span className="sr-only">{copy.retrograde}</span>
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {tab === "houses" &&
                  (chart.houses.length ? (
                    <ul className="natal-rows">
                      {chart.houses.map((h) => (
                        <li key={h.house}>
                          <span className="natal-rows__glyph natal-rows__glyph--number">
                            {h.house}
                          </span>
                          <span className="natal-rows__name">
                            {term(h.sign)}
                          </span>
                          <span className="natal-rows__position">
                            {degreeLabel(h)}{" "}
                            <span aria-hidden="true">{signGlyph(h.sign)}</span>
                          </span>
                          <span className="natal-rows__meta" />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="natal-tabs__empty">
                      {copy.housesUnavailable}
                    </p>
                  ))}
                {tab === "aspects" &&
                  (chart.aspects.length ? (
                    <ul className="natal-rows">
                      {chart.aspects.map((a, i) => (
                        <li key={i}>
                          <span
                            className="natal-rows__glyph"
                            aria-hidden="true"
                          >
                            {aspectGlyphs[a.type]}
                          </span>
                          <span className="natal-rows__name">
                            {term(a.body1)} – {term(a.body2)}
                          </span>
                          <span className="natal-rows__position natal-rows__position--sans">
                            {sentence(term(a.type))}
                          </span>
                          <span className="natal-rows__meta">
                            {a.orb.toFixed(1)}°
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="natal-tabs__empty">{copy.aspectsEmpty}</p>
                  ))}
              </div>
            </div>
          </div>

          <article
            className="natal-interpretation"
            aria-labelledby="natal-interpretation-title"
            aria-live="polite"
          >
            <div className="natal-interpretation__aside">
              <p className="atlas-kicker">{copy.interpretationKicker}</p>
              <h2
                id="natal-interpretation-title"
                className="natal-interpretation__title"
              >
                {copy.interpretationTitle}
              </h2>
              {savedProfileId && (
                <div className="natal-interpretation__actions">
                  <Link
                    className="atlas-button"
                    href={`/account/birth-profiles/${savedProfileId}`}
                  >
                    {copy.openSavedChart}
                  </Link>
                </div>
              )}
            </div>
            <div className="natal-interpretation__body">
              {interpretationLoading ? (
                <div className="natal-interpretation__loading">
                  <div className="natal-interpretation__loading-row">
                    <p>{copy.interpretationLoading}</p>
                    <span>{interpretationProgress}%</span>
                  </div>
                  <div
                    className="atlas-progress"
                    role="progressbar"
                    aria-label={copy.interpretationProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={interpretationProgress}
                  >
                    <span style={{ width: `${interpretationProgress}%` }} />
                  </div>
                  <p className="natal-interpretation__hint">
                    {copy.interpretationWaiting}
                  </p>
                </div>
              ) : interpretation ? (
                <div className="natal-prose">
                  <NatalInterpretation text={interpretation} />
                </div>
              ) : interpretationError ? (
                <div role="alert" className="atlas-public-alert">
                  <p>{interpretationError}</p>
                </div>
              ) : (
                <p className="natal-interpretation__hint">
                  {copy.interpretationEmpty}
                </p>
              )}
            </div>
          </article>

          <details className="natal-method">
            <summary>{copy.methodTitle}</summary>
            <div className="natal-method__body">
              <p>
                {copy.methodCopy
                  .replace("{zodiac}", chart.calculation.zodiac)
                  .replace("{houses}", chart.calculation.houseSystem)
                  .replace("{ephemeris}", chart.calculation.ephemeris)}
              </p>
              <p className="natal-method__mono">
                {Object.entries(chart.calculation.aspectOrbs)
                  .map(
                    ([name, orb]) =>
                      `${aspectGlyphs[name as keyof typeof aspectGlyphs] ?? name} ${orb}°`,
                  )
                  .join(" · ")}
                {" · "}UTC {chart.utc} · {chart.input.place.timeZone}
              </p>
              <p>{copy.precisionCopy}</p>
            </div>
          </details>

          {!account && (
            <aside
              className="natal-reveal"
              aria-labelledby="natal-reveal-title"
            >
              <div>
                <p className="atlas-kicker">{copy.revealKicker}</p>
                <h2 id="natal-reveal-title" className="natal-reveal__title">
                  {copy.revealTitle}
                </h2>
                <p>{copy.revealCopy}</p>
                {interpretation && (
                  <blockquote>
                    <span>{pack.messages.chartReveal.hookLabel}</span>“
                    {interpretationHook(interpretation)}”
                  </blockquote>
                )}
              </div>
              <div className="natal-reveal__offer">
                <p className="natal-reveal__plan">
                  {copy.revealPlan.replace(
                    "{price}",
                    ATLAS_PRICES.month.display,
                  )}
                </p>
                <button
                  className="atlas-button"
                  type="button"
                  data-web-only
                  disabled={
                    checkoutBusy || !interpretation || !interpretationProvenance
                  }
                  onClick={continueWithAtlas}
                >
                  {checkoutBusy
                    ? pack.messages.chartReveal.openingCheckout
                    : copy.revealContinue}
                </button>
                {checkoutError && <p role="alert">{checkoutError}</p>}
                <div className="natal-reveal__links">
                  <Link href="/auth/create-account" className="atlas-link">
                    {pack.messages.chartReveal.freeAccount}
                  </Link>
                  <Link href="/auth/login" className="atlas-link">
                    {pack.messages.chartReveal.signIn}
                  </Link>
                  <Link href="/membership" className="atlas-link">
                    {pack.messages.chartReveal.compare}
                  </Link>
                </div>
              </div>
            </aside>
          )}
        </section>
      )}

      {!account && (
        <div className="atlas-shell home-marketing">
          <LandingPathways previewHref="/auth/create-account" />
          <LandingPlanStrip />
        </div>
      )}
    </main>
  );
}

async function executeRecaptcha(action = "marketing_subscribe") {
  const google = window as typeof window & {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string },
      ) => Promise<string>;
    };
  };
  const deadline = Date.now() + 5000;
  let siteKey: string | null = null;
  while (Date.now() < deadline) {
    const script = document.querySelector<HTMLScriptElement>(
      'script[src*="recaptcha/api.js"]',
    );
    siteKey = script ? new URL(script.src).searchParams.get("render") : null;
    if (siteKey && google.grecaptcha) break;
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  if (!siteKey || !google.grecaptcha) return undefined;
  await new Promise<void>((resolve) => google.grecaptcha!.ready(resolve));
  return google.grecaptcha.execute(siteKey, { action });
}

function interpretationHook(text: string) {
  const prose = text
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((line) => line.replace(/^#{1,3}\s*/, "").trim())
    .find((line) => line.length >= 60 && !/^\d{1,2}\.\s+[A-Z]/.test(line));
  const hook = prose ?? text.replace(/\s+/g, " ").trim();
  if (hook.length <= 260) return hook;
  return `${hook.slice(0, 260).replace(/\s+\S*$/, "")}…`;
}
