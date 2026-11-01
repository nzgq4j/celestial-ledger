"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
import {
  TarotSymbolicCardFace,
  tarotCardIndex,
} from "@/components/TarotSymbolicCardFace";
import "@/app/styles/atlas-public.css";

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

export type DrawResponse = {
  savedReadingId?: string | null;
  saveStatus?: "saved" | "failed" | "guest";
  deck: { id: string; name: string; cardBackImageUrl: string | null };
  reading: { id: string; name: string };
  cards: ReadingCard[];
  narrative: string;
  labels: { upright: string; reversed: string };
};

function cardCountLabel(copy: Record<string, string>, count: number) {
  return count === 1
    ? copy.oneCard
    : formatTarotMessage(copy.cardsCount, { count });
}

export function TarotReadingExperience({
  decks,
  readings,
  currentPlan,
  locale,
  copy,
  initialDeckId = "",
  initialResult = null,
}: {
  decks: TarotDeck[];
  readings: TarotReading[];
  currentPlan: PlanKey;
  locale: TarotLocale;
  copy: Record<string, string>;
  initialDeckId?: string;
  initialResult?: DrawResponse | null;
}) {
  const visibleDecks = decks.filter((deck) => deck.active);
  const unlockedDecks = visibleDecks.filter((deck) =>
    planMeetsTarotMinimum(currentPlan, deck.minimumPlan),
  );
  const initialDeck =
    unlockedDecks.find((deck) => deck.id === initialDeckId) ?? unlockedDecks[0];
  const unlockedReadings = readings.filter((reading) =>
    planMeetsTarotMinimum(currentPlan, reading.minimumPlan),
  );
  const [deckId, setDeckId] = useState(initialDeck?.id ?? "");
  const [readingId, setReadingId] = useState<string>(
    unlockedReadings[0]?.id ?? "",
  );
  const [shuffling, setShuffling] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DrawResponse | null>(initialResult);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [traditionalView, setTraditionalView] = useState(false);
  const [revealedCards, setRevealedCards] = useState<number[]>([]);
  const cardDialog = useRef<HTMLDialogElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const shuffleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawn = useRef(false);

  useEffect(() => {
    const dialog = cardDialog.current;
    if (activeCard !== null && dialog && !dialog.open) dialog.showModal();
  }, [activeCard]);
  useEffect(
    () => () => {
      if (shuffleTimer.current) clearTimeout(shuffleTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (!result || !drawn.current) return;
    drawn.current = false;
    resultHeading.current?.focus({ preventScroll: true });
    resultHeading.current?.scrollIntoView({
      block: "nearest",
      behavior: "instant",
    });
  }, [result]);

  const selectedDeck = visibleDecks.find((deck) => deck.id === deckId) ?? null;
  const selectedReading =
    readings.find((reading) => reading.id === readingId) ?? null;
  const someLocked = readings.some(
    (reading) => !planMeetsTarotMinimum(currentPlan, reading.minimumPlan),
  );
  const busy = shuffling || pending;

  function reset() {
    if (initialResult) {
      window.location.assign("/tarot");
      return;
    }
    setShuffling(false);
    setPending(false);
    setError("");
    setResult(null);
    setActiveCard(null);
    setRevealedCards([]);
    setTraditionalView(false);
  }

  function chooseDeck(nextDeckId: string) {
    if (busy) return;
    setDeckId(nextDeckId);
    setError("");
    setResult(null);
  }

  function chooseReading(nextReadingId: string) {
    if (busy) return;
    setReadingId(nextReadingId);
    setError("");
    setResult(null);
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
      drawn.current = true;
      setResult(body);
      setActiveCard(null);
      setRevealedCards([]);
    } catch {
      setError(copy.error);
    } finally {
      setPending(false);
    }
  }

  function beginShuffleAndReveal() {
    if (busy || result || !selectedDeck || !selectedReading) return;
    setShuffling(true);
    setError("");
    shuffleTimer.current = setTimeout(
      () => {
        setShuffling(false);
        void reveal();
      },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1200,
    );
  }

  if (!visibleDecks.length && !result) {
    return (
      <section className="tarot-table tarot-table--empty" aria-live="polite">
        <span aria-hidden="true">✦</span>
        <p>{copy.unavailable}</p>
      </section>
    );
  }

  const orientationLabel = (card: ReadingCard) =>
    card.orientation === "upright"
      ? (result?.labels.upright ?? copy.upright)
      : (result?.labels.reversed ?? copy.reversed);
  const single = result && result.cards.length === 1 ? result.cards[0] : null;
  const saveNotice =
    result?.saveStatus === "saved"
      ? copy.savedNotice
      : result?.saveStatus === "failed"
        ? copy.unsavedNotice
        : copy.guestNotice;
  const resultActions = result && (
    <div className="tarot-panel__actions">
      {result.saveStatus === "saved" &&
        result.savedReadingId &&
        !initialResult && (
          <Link
            className="atlas-button"
            href={`/account/tarot/${result.savedReadingId}`}
          >
            {copy.openJournal}
          </Link>
        )}
      {result.saveStatus === "guest" && (
        <Link className="atlas-button" href="/auth/login">
          {copy.signInToSave}
        </Link>
      )}
      <button className="atlas-button-ghost" type="button" onClick={reset}>
        {initialResult ? copy.newReading : copy.reset}
      </button>
    </div>
  );

  return (
    <section className="tarot-table" aria-busy={busy}>
      {!initialResult && (
        <div className="tarot-table__choices">
          <div
            className="tarot-table__chips"
            role="group"
            aria-label={copy.spreadsLabel}
          >
            {readings.map((reading) => {
              const unlocked = planMeetsTarotMinimum(
                currentPlan,
                reading.minimumPlan,
              );
              const selected = reading.id === readingId;
              const meta = (
                <span className="tarot-chip__meta">
                  {unlocked
                    ? cardCountLabel(copy, reading.cardCount)
                    : copy.lockedAtlas}
                </span>
              );
              return unlocked ? (
                <button
                  key={reading.id}
                  type="button"
                  className="atlas-chip tarot-chip"
                  aria-pressed={selected}
                  disabled={busy}
                  onClick={() => chooseReading(reading.id)}
                >
                  {reading.name}
                  {meta}
                </button>
              ) : (
                <Link
                  key={reading.id}
                  href="/membership"
                  className="atlas-chip tarot-chip tarot-chip--locked"
                  aria-label={formatTarotMessage(copy.lockedSpreadLabel, {
                    name: reading.name,
                  })}
                >
                  {reading.name}
                  {meta}
                </Link>
              );
            })}
          </div>
          {visibleDecks.length > 1 && (
            <div
              className="tarot-table__chips tarot-table__chips--decks"
              role="group"
              aria-label={copy.decksLabel}
            >
              <span className="tarot-table__label" aria-hidden="true">
                {copy.decksLabel}
              </span>
              {visibleDecks.map((deck) => {
                const unlocked = planMeetsTarotMinimum(
                  currentPlan,
                  deck.minimumPlan,
                );
                const selected = deck.id === deckId;
                return unlocked ? (
                  <button
                    key={deck.id}
                    type="button"
                    className="atlas-chip tarot-chip"
                    aria-pressed={selected}
                    disabled={busy}
                    onClick={() => chooseDeck(deck.id)}
                  >
                    {deck.name}
                  </button>
                ) : (
                  <Link
                    key={deck.id}
                    href="/membership"
                    className="atlas-chip tarot-chip tarot-chip--locked"
                    aria-label={formatTarotMessage(copy.lockedSpreadLabel, {
                      name: deck.name,
                    })}
                  >
                    {deck.name}
                    <span className="tarot-chip__meta">{copy.lockedAtlas}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {(!result || single) && (
        <div className="tarot-table__stage">
          {single ? (
            <div className="tarot-big-card tarot-big-card--face">
              <TarotSymbolicCardFace
                arcana={single.arcana}
                suit={single.suit}
                number={single.number}
                name={single.name}
                imageUrl={single.faceImageUrl}
                orientation={single.orientation}
                className="tarot-big-card__face"
              />
            </div>
          ) : (
            <button
              type="button"
              className={`tarot-big-card${shuffling ? " is-shuffling" : ""}`}
              disabled={busy || !selectedDeck || !selectedReading}
              aria-label={formatTarotMessage(copy.turnCard, {
                name: selectedReading?.name ?? "",
              })}
              aria-describedby="tarot-draw-hint"
              onClick={beginShuffleAndReveal}
            >
              <span className="tarot-big-card__frame" aria-hidden="true" />
              {selectedDeck?.cardBackImageUrl && (
                <span
                  className="tarot-big-card__art"
                  aria-hidden="true"
                  style={{
                    backgroundImage: `url("${selectedDeck.cardBackImageUrl}")`,
                  }}
                />
              )}
              <span className="tarot-big-card__back" aria-hidden="true">
                <span className="tarot-big-card__glyph">✦</span>
                <span className="tarot-big-card__brand">{copy.cardBrand}</span>
                <span className="tarot-big-card__cue">
                  {pending
                    ? copy.preparing
                    : shuffling
                      ? copy.shuffling
                      : copy.tapToTurn}
                </span>
              </span>
            </button>
          )}

          <div className="tarot-panel">
            {single && result ? (
              <>
                <p className="atlas-kicker">
                  {single.arcana === "major"
                    ? copy.majorArcana
                    : copy.minorArcana}{" "}
                  · {tarotCardIndex(single.arcana, single.number)} ·{" "}
                  {orientationLabel(single)}
                </p>
                <h2
                  id="tarot-reading-heading"
                  className="tarot-panel__title"
                  ref={resultHeading}
                  tabIndex={-1}
                >
                  {single.name}
                </h2>
                <p className="tarot-panel__position">
                  {result.reading.name} · {single.position}
                </p>
                <p className="tarot-panel__meaning">{single.meaning}</p>
                <p className="tarot-panel__notice" role="status">
                  {saveNotice}
                </p>
                {resultActions}
              </>
            ) : (
              <>
                <h2 id="tarot-draw-heading" className="tarot-panel__heading">
                  {selectedReading?.name ?? copy.chooseSpread}
                </h2>
                {selectedReading && (
                  <p className="tarot-panel__copy">{selectedReading.blurb}</p>
                )}
                <p id="tarot-draw-hint" className="tarot-panel__copy">
                  {copy.drawHint}
                </p>
                {selectedDeck && selectedReading && (
                  <p className="tarot-panel__selection">
                    {selectedDeck.name} · {selectedReading.name}
                  </p>
                )}
                {error && (
                  <>
                    <p className="atlas-public-alert" role="alert">
                      {error}
                    </p>
                    <div className="tarot-panel__actions">
                      <button
                        className="atlas-button"
                        type="button"
                        disabled={busy}
                        onClick={beginShuffleAndReveal}
                      >
                        {copy.retry}
                      </button>
                    </div>
                  </>
                )}
                {someLocked && (
                  <p className="tarot-panel__note">{copy.atlasIncluded}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {result && !single && (
        <div className="tarot-results" aria-labelledby="tarot-reading-heading">
          <header className="tarot-results__header">
            <div>
              <p className="atlas-kicker">
                {result.deck.name} · {result.reading.name}
              </p>
              <h2
                id="tarot-reading-heading"
                className="tarot-panel__heading"
                ref={resultHeading}
                tabIndex={-1}
              >
                {copy.yourReading}
              </h2>
              <p className="tarot-panel__notice" role="status">
                {saveNotice}
              </p>
            </div>
            {resultActions}
          </header>

          <div className="tarot-view-controls">
            <p>{copy.revealHint}</p>
            <button
              type="button"
              className="atlas-button-ghost atlas-button--sm"
              aria-pressed={traditionalView}
              aria-describedby="tarot-traditional-note"
              onClick={() => setTraditionalView((value) => !value)}
            >
              {traditionalView ? copy.gridView : copy.traditionalView}
            </button>
            <p id="tarot-traditional-note" className="sr-only">
              {copy.traditionalNote}
            </p>
          </div>
          <div
            className="tarot-draw-layout"
            data-spread={traditionalView ? result.reading.id : "grid"}
          >
            <div
              className="tarot-spread-scroll"
              tabIndex={0}
              role="region"
              aria-label={result.reading.name}
            >
              <div
                className="tarot-draw-grid"
                role="group"
                aria-label={copy.position}
              >
                {result.cards.map((card, index) => (
                  <button
                    className="tarot-draw-card"
                    key={index}
                    type="button"
                    aria-pressed={activeCard === index}
                    aria-controls="tarot-card-reflection"
                    aria-label={
                      index +
                      1 +
                      ". " +
                      card.position +
                      (revealedCards.includes(index) ? ": " + card.name : "")
                    }
                    onClick={() => {
                      setActiveCard(index);
                      setRevealedCards((previous) =>
                        previous.includes(index)
                          ? previous
                          : [...previous, index],
                      );
                    }}
                  >
                    <span className="tarot-draw-card__position">
                      {index + 1}. {card.position}
                    </span>
                    {revealedCards.includes(index) ? (
                      <TarotSymbolicCardFace
                        arcana={card.arcana}
                        suit={card.suit}
                        number={card.number}
                        name={card.name}
                        imageUrl={card.faceImageUrl}
                        orientation={card.orientation}
                        className="tarot-card-plate"
                      />
                    ) : (
                      <TarotSymbolicCardBack
                        imageUrl={result.deck.cardBackImageUrl}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <dialog
              ref={cardDialog}
              onClose={() => setActiveCard(null)}
              aria-labelledby="tarot-card-dialog-title"
              id="tarot-card-reflection"
              className="tarot-card-dialog"
            >
              {activeCard === null ? (
                <p>{copy.revealHint}</p>
              ) : (
                <>
                  <button
                    type="button"
                    className="atlas-button-ghost atlas-button--sm tarot-card-dialog__close"
                    onClick={() => cardDialog.current?.close()}
                  >
                    {copy.closeCard}
                  </button>
                  <p className="atlas-kicker">
                    {result.cards[activeCard].name} ·{" "}
                    {orientationLabel(result.cards[activeCard])}
                  </p>
                  <h3 id="tarot-card-dialog-title">
                    {result.cards[activeCard].position}
                  </h3>
                  <p>{result.cards[activeCard].meaning}</p>
                  <TarotSymbolicCardFace
                    arcana={result.cards[activeCard].arcana}
                    suit={result.cards[activeCard].suit}
                    number={result.cards[activeCard].number}
                    name={result.cards[activeCard].name}
                    imageUrl={result.cards[activeCard].faceImageUrl}
                    orientation={result.cards[activeCard].orientation}
                    className="tarot-card-plate tarot-card-detail"
                  />
                </>
              )}
            </dialog>
          </div>
          <details className="tarot-narrative" open>
            <summary>{copy.readingSummary}</summary>
            <div className="tarot-narrative__sections">
              {result.narrative.split(/\n\s*\n/).map((paragraph, index) => {
                const card = result.cards[index];
                return (
                  <section key={`${card?.id ?? "reading"}-${index}`}>
                    {card && (
                      <header>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <div>
                          <h3>{card.position}</h3>
                          <p>
                            {card.name} · {orientationLabel(card)}
                          </p>
                        </div>
                      </header>
                    )}
                    <p>{paragraph}</p>
                  </section>
                );
              })}
            </div>
          </details>
        </div>
      )}
      <p className="tarot-table__disclaimer">{copy.disclaimer}</p>
    </section>
  );
}
