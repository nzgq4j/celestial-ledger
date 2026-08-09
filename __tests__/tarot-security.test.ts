import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  normaliseTarotArtwork,
  TAROT_ARTWORK_MAX_BYTES,
  tarotArtworkPath,
} from "@/lib/tarot/artwork";

const uploadRoute = readFileSync(
  "app/api/admin/tarot-decks/[deckId]/artwork/route.ts",
  "utf8",
);
const drawRoute = readFileSync("app/api/tarot/draw/route.ts", "utf8");
const experience = readFileSync(
  "components/TarotReadingExperience.tsx",
  "utf8",
);
const migration = readFileSync(
  "supabase/migrations/20260809110121_add_tarot_decks.sql",
  "utf8",
);

describe("tarot artwork and access security", () => {
  it("normalises a valid cover to a stable WebP object", async () => {
    const input = await sharp({
      create: {
        width: 750,
        height: 1000,
        channels: 3,
        background: "#c9a75d",
      },
    })
      .png()
      .toBuffer();
    const output = await normaliseTarotArtwork({
      bytes: input,
      contentType: "image/png",
      kind: "cover",
    });
    const metadata = await sharp(output).metadata();

    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(900);
    expect(metadata.height).toBe(1200);
    expect(tarotArtworkPath("traditional", "cover")).toBe(
      "traditional/cover.webp",
    );
  });

  it("rejects excessive size, unsafe types, small images, and wrong aspect", async () => {
    await expect(
      normaliseTarotArtwork({
        bytes: new Uint8Array(TAROT_ARTWORK_MAX_BYTES + 1),
        contentType: "image/png",
        kind: "cover",
      }),
    ).rejects.toMatchObject({ code: "too_large" });
    await expect(
      normaliseTarotArtwork({
        bytes: new TextEncoder().encode("<svg />"),
        contentType: "image/svg+xml",
        kind: "cover",
      }),
    ).rejects.toMatchObject({
      code: "unsupported_type",
    });

    const small = await sharp({
      create: {
        width: 300,
        height: 400,
        channels: 3,
        background: "#000000",
      },
    })
      .png()
      .toBuffer();
    await expect(
      normaliseTarotArtwork({
        bytes: small,
        contentType: "image/png",
        kind: "cover",
      }),
    ).rejects.toMatchObject({ code: "too_small" });

    const landscape = await sharp({
      create: {
        width: 1400,
        height: 1000,
        channels: 3,
        background: "#000000",
      },
    })
      .png()
      .toBuffer();
    await expect(
      normaliseTarotArtwork({
        bytes: landscape,
        contentType: "image/png",
        kind: "cover",
      }),
    ).rejects.toMatchObject({ code: "wrong_aspect" });
  });

  it("requires a content administrator and overwrites stable paths without orphans", () => {
    expect(uploadRoute).toContain("getAdminIdentity");
    expect(uploadRoute).toContain('"site_admin", "content_admin"');
    expect(uploadRoute).toContain("ensureTarotDeckBucket");
    expect(uploadRoute).toContain(".storage.createBucket");
    expect(uploadRoute).toContain("allowedMimeTypes: [\"image/webp\"]");
    expect(uploadRoute).not.toContain(".storage.updateBucket");
    expect(uploadRoute).toContain("new Blob([new Uint8Array(output)]");
    expect(uploadRoute).toContain("upsert: true");
    expect(uploadRoute).toContain("tarotArtworkPath");
    expect(uploadRoute).toContain("remove([path])");
  });

  it("keeps the catalogue and image bucket private", () => {
    expect(migration).toContain(
      "alter table public.tarot_decks enable row level security",
    );
    expect(migration).toContain(
      "revoke all on public.tarot_decks from public, anon, authenticated",
    );
    expect(migration).toMatch(/'tarot-decks',[\s\S]*?false,/);
    expect(migration).toContain("array['image/webp']::text[]");
    for (const deckId of [
      "traditional",
      "cat",
      "comic",
      "techno",
      "provencal",
    ]) {
      expect(migration).toContain(`'${deckId}'`);
    }
    expect(migration).toContain("'traditional',\n    'Traditional'");
    expect(migration).toContain("'free',\n    false");
  });

  it("keeps authoritative card selection and entitlement checks on the server", () => {
    expect(drawRoute).toContain("decideTarotAccess");
    expect(drawRoute).toContain("drawTarotCards");
    expect(drawRoute).toContain("tarotCardsForLocale");
    expect(drawRoute).toContain('"Cache-Control": "private, no-store');
    expect(experience).not.toContain("Math.random");
    expect(drawRoute).not.toContain("!deck?.cardBackImageUrl");
  });
});
