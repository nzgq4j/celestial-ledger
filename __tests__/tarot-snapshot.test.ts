import { describe, expect, it } from "vitest";
import { savedTarotSchema, tarotSnapshot } from "@/lib/tarot/saved-schema";
describe("immutable tarot snapshot", () => {
  it("retains reviewed meaning and orientation but excludes expiring signed artwork", () => {
    const source = savedTarotSchema.parse({
      deck: {
        id: "deck",
        name: "Deck",
        cardBackImageUrl: "https://example.com/signed",
      },
      reading: { id: "daily", name: "Daily" },
      cards: [
        {
          id: "major-0",
          name: "Fool",
          arcana: "major",
          suit: null,
          number: 0,
          faceImageUrl: "https://example.com/signed",
          position: "Today",
          orientation: "reversed",
          meaning: "Reviewed reflection",
        },
      ],
      narrative: "Reviewed narrative",
      labels: { upright: "Upright", reversed: "Reversed" },
    });
    const snapshot = tarotSnapshot(source);
    expect(snapshot.deck.cardBackImageUrl).toBeNull();
    expect(snapshot.cards[0].faceImageUrl).toBeNull();
    expect(snapshot.cards[0].orientation).toBe("reversed");
    expect(snapshot.cards[0].meaning).toBe(source.cards[0].meaning);
    expect(source.cards[0].faceImageUrl).not.toBeNull();
  });
  it("rejects empty or malformed saved readings", () => {
    expect(savedTarotSchema.safeParse({ cards: [] }).success).toBe(false);
  });
});
