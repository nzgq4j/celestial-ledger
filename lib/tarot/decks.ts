import "server-only";

import type { PlanKey } from "@/lib/entitlements/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { planMeetsTarotMinimum } from "@/lib/tarot/entitlement";
import type {
  TarotDeck,
  TarotDeckAccent,
  TarotLocale,
} from "@/lib/tarot/types";

export const TAROT_DECK_BUCKET = "tarot-decks";
export const TAROT_SIGNED_URL_SECONDS = 15 * 60;

type TarotDeckRow = Database["public"]["Tables"]["tarot_decks"]["Row"];

const PLAN_KEYS = new Set<PlanKey>(["free", "personal", "premium"]);
const ACCENT_TOKENS = new Set<TarotDeckAccent>([
  "gold",
  "copper",
  "map-cyan",
  "map-red",
  "map-chalk",
]);

function planKey(value: string): PlanKey {
  if (!PLAN_KEYS.has(value as PlanKey)) {
    throw new Error(`Unsupported tarot deck plan: ${value}.`);
  }
  return value as PlanKey;
}

function accentToken(value: string): TarotDeckAccent {
  if (!ACCENT_TOKENS.has(value as TarotDeckAccent)) {
    throw new Error(`Unsupported tarot deck accent: ${value}.`);
  }
  return value as TarotDeckAccent;
}

async function signedUrl(path: string | null) {
  if (!path) return null;
  const { data, error } = await createAdminClient()
    .storage.from(TAROT_DECK_BUCKET)
    .createSignedUrl(path, TAROT_SIGNED_URL_SECONDS);
  if (error) throw new Error("Tarot deck artwork could not be signed.");
  return data.signedUrl;
}

async function deckFromRow(
  row: TarotDeckRow,
  options: { includeCardBack: boolean; locale: TarotLocale },
): Promise<TarotDeck> {
  const [coverImageUrl, cardBackImageUrl] = await Promise.all([
    signedUrl(row.cover_image_path),
    options.includeCardBack ? signedUrl(row.card_back_image_path) : null,
  ]);
  const localizedCopy = (() => {
    if (options.locale === "en-GB") {
      return { name: row.name, tagline: row.tagline };
    }
    const translations = row.translations as Record<
      string,
      { name?: unknown; tagline?: unknown } | undefined
    >;
    const translation = translations[options.locale];
    if (
      !translation ||
      typeof translation.name !== "string" ||
      typeof translation.tagline !== "string"
    ) {
      throw new Error(
        `Tarot deck ${row.id} is missing ${options.locale} metadata.`,
      );
    }
    return { name: translation.name, tagline: translation.tagline };
  })();
  return {
    id: row.id,
    name: localizedCopy.name,
    tagline: localizedCopy.tagline,
    accentToken: accentToken(row.accent_token),
    coverImageUrl,
    cardBackImageUrl,
    minimumPlan: planKey(row.minimum_plan),
    active: row.active,
  };
}

/**
 * Cover thumbnails are visible for locked decks because the product explicitly
 * shows them with an upgrade action. Card backs remain unavailable until the
 * viewer meets the deck entitlement.
 */
export async function listActiveTarotDecksForPlan(
  currentPlan: PlanKey,
  locale: TarotLocale,
) {
  const { data, error } = await createAdminClient()
    .from("tarot_decks")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error("Tarot deck catalogue could not be loaded.");

  return Promise.all(
    data.map((row) =>
      deckFromRow(row, {
        includeCardBack: planMeetsTarotMinimum(
          currentPlan,
          planKey(row.minimum_plan),
        ),
        locale,
      }),
    ),
  );
}

export async function findActiveTarotDeckForPlan(
  deckId: string,
  currentPlan: PlanKey,
  locale: TarotLocale,
) {
  const { data, error } = await createAdminClient()
    .from("tarot_decks")
    .select("*")
    .eq("id", deckId)
    .eq("active", true)
    .maybeSingle();
  if (error) throw new Error("Tarot deck could not be loaded.");
  if (!data) return null;

  const minimumPlan = planKey(data.minimum_plan);
  if (!planMeetsTarotMinimum(currentPlan, minimumPlan)) return null;
  return deckFromRow(data, { includeCardBack: true, locale });
}

export async function activeTarotDeckMinimumPlan(deckId: string) {
  const { data, error } = await createAdminClient()
    .from("tarot_decks")
    .select("minimum_plan")
    .eq("id", deckId)
    .eq("active", true)
    .maybeSingle();
  if (error) throw new Error("Tarot deck could not be loaded.");
  return data ? planKey(data.minimum_plan) : null;
}

export async function listTarotDeckRowsForAdmin() {
  const { data, error } = await createAdminClient()
    .from("tarot_decks")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error("Tarot deck catalogue could not be loaded.");
  return data;
}

export async function signTarotDeckArtworkForAdmin(row: TarotDeckRow) {
  const [coverImageUrl, cardBackImageUrl] = await Promise.all([
    signedUrl(row.cover_image_path).catch(() => null),
    signedUrl(row.card_back_image_path).catch(() => null),
  ]);
  return { coverImageUrl, cardBackImageUrl };
}
