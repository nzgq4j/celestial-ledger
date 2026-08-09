"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PlanKey } from "@/lib/entitlements/domain";
import { planMeetsTarotMinimum } from "@/lib/tarot/entitlement";
import type {
  TarotDeck,
  TarotLocale,
  TarotOrientation,
} from "@/lib/tarot/types";

type DailyDrawResponse = {
  cards: Array<{
    id: string;
    name: string;
    arcana: "major" | "minor";
    suit: string | null;
    position: string;
    orientation: TarotOrientation;
    meaning: string;
  }>;
  labels: { upright: string; reversed: string };
};

const GLYPHS: Record<string, string> = {
  wands: "✦",
  cups: "◡",
  swords: "†",
  pentacles: "⬡",
};

export function AccountTarotDailyDraw({
  decks,
  currentPlan,
  locale,
  copy,
}: {
  decks: TarotDeck[];
  currentPlan: PlanKey;
  locale: TarotLocale;
  copy: Record<string, string>;
}) {
  const availableDecks = useMemo(
    () =>
      decks.filter((deck) =>
        planMeetsTarotMinimum(currentPlan, deck.minimumPlan),
      ),
    [currentPlan, decks],
  );
  const [deckId, setDeckId] = useState(availableDecks[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DailyDrawResponse | null>(null);
  const card = result?.cards[0];

  async function draw() {
    if (!deckId) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/tarot/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId, readingId: "daily", locale }),
      });
      const body = (await response.json()) as DailyDrawResponse & {
        error?: string;
      };
      if (!response.ok) throw new Error(body.error ?? "DRAW_FAILED");
      setResult(body);
    } catch {
      setError(copy.error);
    } finally {
      setPending(false);
    }
  }

  if (!availableDecks.length) {
    return <p className="dashboard-empty">{copy.unavailable}</p>;
  }

  return (
    <div className="account-tarot-draw">
      {!card ? (
        <>
          <p className="dashboard-panel__introduction">{copy.shuffleCopy}</p>
          <label>
            {copy.chooseDeck}
            <select
              value={deckId}
              onChange={(event) => setDeckId(event.target.value)}
            >
              {availableDecks.map((deck) => (
                <option value={deck.id} key={deck.id}>
                  {deck.name}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p className="tarot-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            className="button-primary"
            disabled={pending || !deckId}
            onClick={draw}
          >
            {pending ? copy.shuffling : copy.spreadDailyName}
          </button>
        </>
      ) : (
        <article className="account-tarot-result">
          <div className="account-tarot-result__plate" aria-hidden="true">
            <span>
              {card.arcana === "major" ? "✦" : (GLYPHS[card.suit ?? ""] ?? "◇")}
            </span>
            <strong>{card.name}</strong>
          </div>
          <div>
            <p className="section-kicker">{card.position}</p>
            <h4>{card.name}</h4>
            <small>
              {card.orientation === "upright"
                ? result.labels.upright
                : result.labels.reversed}
            </small>
            <p>{card.meaning}</p>
            <div className="account-tarot-result__actions">
              <button
                type="button"
                className="button-quiet"
                onClick={() => setResult(null)}
              >
                {copy.newReading}
              </button>
              <Link className="button-secondary" href="/tarot">
                {copy.chooseSpread}
              </Link>
            </div>
          </div>
        </article>
      )}
      <p className="account-tarot-disclaimer">{copy.disclaimer}</p>
    </div>
  );
}
