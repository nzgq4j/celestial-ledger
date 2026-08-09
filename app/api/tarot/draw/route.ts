import { NextResponse } from "next/server";
import { z } from "zod";
import { tarotReadingFlags } from "@/lib/commerce/flags";
import { effectivePlanKeyForUser } from "@/lib/entitlements/server";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { tarotCardsForLocale } from "@/lib/tarot/card-locales";
import {
  activeTarotDeckMinimumPlan,
  findActiveTarotDeckForPlan,
} from "@/lib/tarot/decks";
import { drawTarotCards } from "@/lib/tarot/draw";
import { decideTarotAccess } from "@/lib/tarot/entitlement";
import { buildNarrative, tarotNarrativeFormatter } from "@/lib/tarot/narrative";
import { TAROT_READINGS } from "@/lib/tarot/readings";
import { localizeTarotReadings } from "@/lib/tarot/reading-locales";
import { TAROT_LOCALES } from "@/lib/tarot/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  deckId: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
  readingId: z.enum(["daily", "ppf", "love5", "celtic", "grand"]),
  locale: z.enum(TAROT_LOCALES),
});

const noStoreHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export async function POST(request: Request) {
  if (!tarotReadingFlags().enabled) {
    return NextResponse.json(
      { error: "NOT_AVAILABLE" },
      { status: 404, headers: noStoreHeaders },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_REQUEST" },
      { status: 400, headers: noStoreHeaders },
    );
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_REQUEST" },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const currentPlan = auth.user
    ? await effectivePlanKeyForUser(auth.user.id)
    : "free";
  const reading = TAROT_READINGS.find(({ id }) => id === parsed.data.readingId);
  if (!reading) {
    return NextResponse.json(
      { error: "READING_NOT_FOUND" },
      { status: 404, headers: noStoreHeaders },
    );
  }
  const deckMinimumPlan = await activeTarotDeckMinimumPlan(parsed.data.deckId);
  if (!deckMinimumPlan) {
    return NextResponse.json(
      { error: "DECK_NOT_FOUND" },
      { status: 404, headers: noStoreHeaders },
    );
  }
  const access = decideTarotAccess({
    currentPlan,
    deckMinimumPlan,
    spreadMinimumPlan: reading.minimumPlan,
  });
  if (!access.allowed) {
    return NextResponse.json(
      {
        error:
          access.reason === "deck_locked" ? "DECK_LOCKED" : "SPREAD_LOCKED",
        minimumPlan: access.minimumPlan,
      },
      { status: 403, headers: noStoreHeaders },
    );
  }

  const [deck, pack] = await Promise.all([
    findActiveTarotDeckForPlan(
      parsed.data.deckId,
      currentPlan,
      parsed.data.locale,
    ),
    getServerTranslationPack(parsed.data.locale),
  ]);
  if (!deck?.cardBackImageUrl) {
    return NextResponse.json(
      { error: "DECK_NOT_READY" },
      { status: 409, headers: noStoreHeaders },
    );
  }
  const localizedReading = localizeTarotReadings(
    [reading],
    parsed.data.locale,
  )[0];
  const drawnCards = drawTarotCards(
    tarotCardsForLocale(parsed.data.locale),
    localizedReading,
  );

  return NextResponse.json(
    {
      deck: {
        id: deck.id,
        name: deck.name,
        cardBackImageUrl: deck.cardBackImageUrl,
      },
      reading: {
        id: localizedReading.id,
        name: localizedReading.name,
      },
      cards: drawnCards.map(({ card, position, orientation }) => ({
        id: card.id,
        name: card.name,
        arcana: card.arcana,
        suit: card.suit ?? null,
        number: card.number ?? null,
        position,
        orientation,
        meaning: card[orientation],
      })),
      narrative: buildNarrative(
        drawnCards,
        tarotNarrativeFormatter(parsed.data.locale),
      ),
      labels: {
        upright: pack.messages.tarot.upright,
        reversed: pack.messages.tarot.reversed,
      },
    },
    { headers: noStoreHeaders },
  );
}
