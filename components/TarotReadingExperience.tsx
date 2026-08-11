"use client";

import Link from "next/link";
import { useState } from "react";
import type { PlanKey } from "@/lib/entitlements/domain";
import { planMeetsTarotMinimum } from "@/lib/tarot/entitlement";
import type {
  TarotDeck,
  TarotLocale,
  TarotOrientation,
  TarotReading,
  TarotSuit,
} from "@/lib/tarot/types";
import { formatTarotMessage } from "@/lib/tarot/ui-locales";
import { TarotSymbolicCardBack } from "@/components/TarotSymbolicCardBack";
import { TarotSymbolicCardFace } from "@/components/TarotSymbolicCardFace";

type ReadingCard = {
  id: string;
  name: string;
  arcana: "major" | "minor";
  suit: TarotSuit | null;
  number: number | null;
  faceImageUrl: string | null;
  position: string;
  orientation: TarotOrientation;
  meaning: string;
};

type DrawResponse = {
  deck: { id: string; name: string; cardBackImageUrl: string | null };
  reading: { id: string; name: string };
  cards: ReadingCard[];
  narrative: string;
  labels: { upright: string; reversed: string };
};

function requirementLabel(copy: Record<string, string>, plan: PlanKey) {
  return plan === "premium" ? copy.requiresPremium : copy.requiresPersonal;
}

export function TarotReadingExperience({
  decks,
  readings,
  currentPlan,
  locale,
  copy,
}: {
  decks: TarotDeck[];
  readings: TarotReading[];
  currentPlan: PlanKey;
  locale: TarotLocale;
  copy: Record<string, string>;
}) {
  const visibleDecks = decks.filter((deck) => deck.active);
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);
  const [deckId, setDeckId] = useState("");
  const [readingId, setReadingId] = useState("");
  const [shuffling, setShuffling] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DrawResponse | null>(null);

  const selectedDeck = visibleDecks.find((deck) => deck.id === deckId) ?? null;
  const selectedReading =
    readings.find((reading) => reading.id === readingId) ?? null;
  const stepNames = [
    copy.deckStep,
    copy.spreadStep,
    copy.shuffleStep,
    copy.readingStep,
  ];

  function stepHref(step: 1 | 2 | 3 | 4) {
    if (step === 1) return "#tarot-deck-heading";
    if (step === 2) return "#tarot-spread-heading";
    if (step === 3) return "#tarot-shuffle-heading";
    return "#tarot-reading-heading";
  }

  function stepIsReachable(step: 1 | 2 | 3 | 4) {
    if (shuffling || pending) return step === stage;
    if (step === 1) return true;
    if (step === 2) return Boolean(deckId);
    if (step === 3) return Boolean(deckId && readingId);
    return Boolean(result);
  }

  function goToStep(step: 1 | 2 | 3 | 4) {
    if (!stepIsReachable(step)) return;
    setError("");
    setStage(step);
  }

  function reset() {
    setStage(1);
    setDeckId("");
    setReadingId("");
    setShuffling(false);
    setPending(false);
    setError("");
    setResult(null);
  }

  function chooseDeck(nextDeckId: string) {
    setDeckId(nextDeckId);
    setReadingId("");
    setError("");
    setResult(null);
    setStage(2);
  }

  function chooseReading(nextReadingId: string) {
    setReadingId(nextReadingId);
    setError("");
    setResult(null);
    setStage(3);
  }

  async function reveal() {
    if (!selectedDeck || !selectedReading) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/tarot/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId, readingId, locale }),
      });
      const body = (await response.json()) as DrawResponse & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "DRAW_FAILED");
      setResult(body);
      setStage(4);
    } catch {
      setError(copy.error);
    } finally {
      setPending(false);
    }
  }

  function beginShuffleAndReveal() {
    if (shuffling || pending || !selectedDeck || !selectedReading) return;
    setShuffling(true);
    setError("");
    window.setTimeout(
      () => {
        setShuffling(false);
        void reveal();
      },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1200,
    );
  }

  if (!visibleDecks.length) {
    return (
      <section className="tarot-empty" aria-live="polite">
        <span aria-hidden="true">✦</span>
        <p>{copy.unavailable}</p>
      </section>
    );
  }

  return (
    <section className="tarot-workspace">
      <nav
        className="tarot-progress"
        aria-label={formatTarotMessage(copy.stepProgress, {
          current: stage,
          total: 4,
        })}
      >
        {stepNames.map((name, index) => {
          const step = (index + 1) as 1 | 2 | 3 | 4;
          const reachable = stepIsReachable(step);
          return (
            <a
              key={name}
              href={stepHref(step)}
              className={stage === step ? "is-current" : ""}
              aria-current={stage === step ? "step" : undefined}
              aria-disabled={!reachable}
              tabIndex={reachable ? undefined : -1}
              onClick={(event) => {
                event.preventDefault();
                goToStep(step);
              }}
            >
              <span>{String(step).padStart(2, "0")}</span>
              {name}
            </a>
          );
        })}
      </nav>

      {stage === 1 && (
        <div className="tarot-stage" aria-labelledby="tarot-deck-heading">
          <header className="tarot-stage__heading">
            <p className="eyebrow">
              {formatTarotMessage(copy.stepProgress, {
                current: 1,
                total: 4,
              })}
            </p>
            <h2 id="tarot-deck-heading">{copy.chooseDeck}</h2>
            <p>{copy.chooseDeckCopy}</p>
          </header>
          <div className="tarot-deck-grid">
            {visibleDecks.map((deck) => {
              const unlocked = planMeetsTarotMinimum(
                currentPlan,
                deck.minimumPlan,
              );
              const selected = deck.id === deckId;
              return (
                <article
                  className={`tarot-deck tarot-accent--${deck.accentToken} ${
                    selected ? "is-selected" : ""
                  }`}
                  key={deck.id}
                  role={unlocked ? "button" : undefined}
                  tabIndex={unlocked ? 0 : undefined}
                  aria-pressed={unlocked ? selected : undefined}
                  onClick={() => unlocked && chooseDeck(deck.id)}
                  onKeyDown={(event) => {
                    if (!unlocked) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      chooseDeck(deck.id);
                    }
                  }}
                >
                  <div
                    className="tarot-deck__cover"
                    role="img"
                    aria-label={formatTarotMessage(copy.deckCoverLabel, {
                      name: deck.name,
                    })}
                    style={
                      deck.coverImageUrl
                        ? { backgroundImage: `url("${deck.coverImageUrl}")` }
                        : undefined
                    }
                  >
                    {!deck.coverImageUrl && <span aria-hidden="true">✦</span>}
                    {!unlocked && (
                      <span className="tarot-lock">{copy.locked}</span>
                    )}
                  </div>
                  <div className="tarot-deck__copy">
                    <p>{deck.name}</p>
                    <small>{deck.tagline}</small>
                  </div>
                  {!unlocked && (
                    <div className="tarot-deck__upgrade">
                      <span>{requirementLabel(copy, deck.minimumPlan)}</span>
                      <Link href="/membership">{copy.upgrade}</Link>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      {stage === 2 && (
        <div className="tarot-stage" aria-labelledby="tarot-spread-heading">
          <header className="tarot-stage__heading">
            <p className="eyebrow">
              {formatTarotMessage(copy.stepProgress, {
                current: 2,
                total: 4,
              })}
            </p>
            <h2 id="tarot-spread-heading">{copy.chooseSpread}</h2>
            <p>{copy.chooseSpreadCopy}</p>
          </header>
          <div className="tarot-spread-list">
            {readings.map((reading) => {
              const unlocked = planMeetsTarotMinimum(
                currentPlan,
                reading.minimumPlan,
              );
              const selected = reading.id === readingId;
              return (
                <article
                  className={`tarot-spread ${selected ? "is-selected" : ""}`}
                  key={reading.id}
                  onClick={() => unlocked && chooseReading(reading.id)}
                >
                  <div
                    className="tarot-spread__count"
                    aria-label={formatTarotMessage(
                      reading.cardCount === 1 ? copy.oneCard : copy.cardsCount,
                      { count: reading.cardCount },
                    )}
                  >
                    {Array.from({ length: Math.min(reading.cardCount, 5) }).map(
                      (_, index) => (
                        <i
                          key={index}
                          aria-hidden="true"
                          className={
                            selectedDeck?.cardBackImageUrl
                              ? "has-selected-back"
                              : undefined
                          }
                          style={
                            selectedDeck?.cardBackImageUrl
                              ? {
                                  backgroundImage: `url("${selectedDeck.cardBackImageUrl}")`,
                                }
                              : undefined
                          }
                        />
                      ),
                    )}
                    {reading.cardCount > 5 && (
                      <span aria-hidden="true">+{reading.cardCount - 5}</span>
                    )}
                  </div>
                  <div>
                    <p>{reading.name}</p>
                    <small>{reading.blurb}</small>
                    <span className="tarot-spread__meta">
                      {reading.cardCount === 1
                        ? copy.oneCard
                        : formatTarotMessage(copy.cardsCount, {
                            count: reading.cardCount,
                          })}
                      {" · "}
                      {reading.durationLabel}
                    </span>
                  </div>
                  {unlocked ? (
                    <button
                      className="tarot-spread__select"
                      type="button"
                      aria-pressed={selected}
                      onClick={(event) => {
                        event.stopPropagation();
                        chooseReading(reading.id);
                      }}
                    >
                      {selected
                        ? copy.selected
                        : formatTarotMessage(copy.selectSpread, {
                            name: reading.name,
                          })}
                    </button>
                  ) : (
                    <div className="tarot-spread__upgrade">
                      <span>{requirementLabel(copy, reading.minimumPlan)}</span>
                      <Link href="/membership">{copy.upgrade}</Link>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          <div className="tarot-stage__actions">
            <button className="button-quiet" onClick={() => setStage(1)}>
              {copy.back}
            </button>
          </div>
        </div>
      )}

      {stage === 3 && selectedDeck && selectedReading && (
        <div
          className="tarot-stage tarot-shuffle-stage"
          aria-labelledby="tarot-shuffle-heading"
        >
          <header className="tarot-stage__heading">
            <p className="eyebrow">
              {formatTarotMessage(copy.stepProgress, {
                current: 3,
                total: 4,
              })}
            </p>
            <h2 id="tarot-shuffle-heading">{copy.beginShuffle}</h2>
            <p>{copy.shuffleCopy}</p>
          </header>
          <div
            className={`tarot-shuffle ${shuffling ? "is-shuffling" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={copy.beginShuffle}
            aria-disabled={shuffling || pending}
            onClick={beginShuffleAndReveal}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                beginShuffleAndReveal();
              }
            }}
          >
            {["a", "b", "c"].map((layer) => (
              <TarotSymbolicCardBack
                key={layer}
                imageUrl={selectedDeck.cardBackImageUrl}
                className={`tarot-shuffle__card tarot-shuffle__card--${layer}`}
              />
            ))}
            <span className="tarot-shuffle__axis" />
          </div>
          <p className="tarot-shuffle__selection">
            {selectedDeck.name} · {selectedReading.name}
          </p>
          {error && (
            <p className="tarot-error" role="alert">
              {error}
            </p>
          )}
          <div className="tarot-stage__actions">
            <button
              className="button-quiet"
              type="button"
              disabled={shuffling || pending}
              onClick={() => setStage(2)}
            >
              {copy.back}
            </button>
          </div>
        </div>
      )}

      {stage === 4 && result && (
        <div
          className="tarot-stage tarot-results"
          aria-labelledby="tarot-reading-heading"
        >
          <header className="tarot-stage__heading">
            <p className="eyebrow">
              {result.deck.name} · {result.reading.name}
            </p>
            <h2 id="tarot-reading-heading">{copy.yourReading}</h2>
          </header>
          <div className="tarot-results__table">
            {result.cards.map((item, index) => (
              <article
                className="tarot-result-card"
                key={`${item.id}-${index}`}
              >
                <TarotSymbolicCardFace
                  arcana={item.arcana}
                  suit={item.suit}
                  number={item.number}
                  name={item.name}
                  imageUrl={item.faceImageUrl}
                  orientation={item.orientation}
                  className="tarot-card-plate"
                />
                <div className="tarot-result-card__copy">
                  <p>{item.position}</p>
                  <small>
                    {item.orientation === "upright"
                      ? result.labels.upright
                      : result.labels.reversed}
                  </small>
                  <p>{item.meaning}</p>
                </div>
              </article>
            ))}
          </div>
          <aside className="tarot-narrative">
            <p className="eyebrow">{copy.readingSummary}</p>
            <p>{result.narrative}</p>
          </aside>
          <p className="tarot-disclaimer">{copy.disclaimer}</p>
          <div className="tarot-stage__actions">
            <button className="button-primary" type="button" onClick={reset}>
              {copy.newReading}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
