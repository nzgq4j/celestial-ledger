import "server-only";

import sharp from "sharp";

export const TAROT_ARTWORK_INPUT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const TAROT_ARTWORK_MAX_BYTES = 4 * 1024 * 1024;

export type TarotDeckArtworkKind = "cover" | "card-back";
export type TarotArtworkKind = TarotDeckArtworkKind | "card-face";

const REQUIREMENTS: Record<
  TarotArtworkKind,
  {
    minimumWidth: number;
    minimumHeight: number;
    minimumAspect: number;
    maximumAspect: number;
    outputWidth: number;
    outputHeight: number;
  }
> = {
  cover: {
    minimumWidth: 750,
    minimumHeight: 1000,
    minimumAspect: 0.68,
    maximumAspect: 0.82,
    outputWidth: 900,
    outputHeight: 1200,
  },
  "card-back": {
    minimumWidth: 750,
    minimumHeight: 1200,
    minimumAspect: 0.58,
    maximumAspect: 0.67,
    outputWidth: 800,
    outputHeight: 1280,
  },
  "card-face": {
    minimumWidth: 750,
    minimumHeight: 1200,
    minimumAspect: 0.58,
    maximumAspect: 0.67,
    outputWidth: 800,
    outputHeight: 1280,
  },
};

export class TarotArtworkError extends Error {
  constructor(
    public readonly code:
      | "empty"
      | "too_large"
      | "unsupported_type"
      | "unreadable"
      | "too_small"
      | "wrong_aspect",
  ) {
    super(code);
  }
}

export async function normaliseTarotArtwork(input: {
  bytes: Uint8Array;
  contentType: string;
  kind: TarotArtworkKind;
}) {
  if (!input.bytes.byteLength) throw new TarotArtworkError("empty");
  if (input.bytes.byteLength > TAROT_ARTWORK_MAX_BYTES) {
    throw new TarotArtworkError("too_large");
  }
  if (
    !TAROT_ARTWORK_INPUT_TYPES.includes(
      input.contentType as (typeof TAROT_ARTWORK_INPUT_TYPES)[number],
    )
  ) {
    throw new TarotArtworkError("unsupported_type");
  }

  const image = sharp(input.bytes, {
    failOn: "warning",
    limitInputPixels: 40_000_000,
  }).rotate();
  let metadata: Awaited<ReturnType<typeof image.metadata>>;
  try {
    metadata = await image.metadata();
  } catch {
    throw new TarotArtworkError("unreadable");
  }
  if (!metadata.width || !metadata.height) {
    throw new TarotArtworkError("unreadable");
  }
  if (!["jpeg", "png", "webp", "avif"].includes(metadata.format ?? "")) {
    throw new TarotArtworkError("unsupported_type");
  }

  const requirement = REQUIREMENTS[input.kind];
  const swapsAxes = [5, 6, 7, 8].includes(metadata.orientation ?? 1);
  const width = swapsAxes ? metadata.height : metadata.width;
  const height = swapsAxes ? metadata.width : metadata.height;
  if (width < requirement.minimumWidth || height < requirement.minimumHeight) {
    throw new TarotArtworkError("too_small");
  }
  const aspect = width / height;
  if (
    aspect < requirement.minimumAspect ||
    aspect > requirement.maximumAspect
  ) {
    throw new TarotArtworkError("wrong_aspect");
  }

  return image
    .resize(requirement.outputWidth, requirement.outputHeight, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: 88, effort: 5 })
    .toBuffer();
}

export function tarotArtworkPath(deckId: string, kind: TarotDeckArtworkKind) {
  return `${deckId}/${kind}.webp`;
}

export function tarotCardFaceArtworkPath(
  deckId: string,
  cardId: string,
  contentHash: string,
) {
  return `${deckId}/faces/${cardId}-${contentHash.slice(0, 12)}.webp`;
}
