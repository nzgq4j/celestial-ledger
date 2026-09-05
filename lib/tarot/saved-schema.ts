import { z } from "zod";

export const savedTarotSchema = z
  .object({
    deck: z.object({
      id: z.string(),
      name: z.string(),
      cardBackImageUrl: z.string().nullable(),
    }),
    reading: z.object({ id: z.string(), name: z.string() }),
    cards: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          arcana: z.enum(["major", "minor"]),
          suit: z.enum(["wands", "cups", "swords", "pentacles"]).nullable(),
          number: z.number().nullable(),
          faceImageUrl: z.string().nullable(),
          position: z.string(),
          orientation: z.enum(["upright", "reversed"]),
          meaning: z.string(),
        }),
      )
      .min(1)
      .max(14),
    narrative: z.string(),
    labels: z.object({ upright: z.string(), reversed: z.string() }),
  })
  .strict();
export type SavedTarotPayload = z.infer<typeof savedTarotSchema>;

// Artwork URLs expire independently. Never persist temporary signed URLs.
export function tarotSnapshot(payload: SavedTarotPayload) {
  return {
    ...payload,
    deck: { ...payload.deck, cardBackImageUrl: null },
    cards: payload.cards.map((card) => ({ ...card, faceImageUrl: null })),
  };
}
