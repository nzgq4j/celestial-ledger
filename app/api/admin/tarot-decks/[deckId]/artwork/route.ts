import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminIdentity } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normaliseTarotArtwork,
  TAROT_ARTWORK_MAX_BYTES,
  TarotArtworkError,
  tarotArtworkPath,
} from "@/lib/tarot/artwork";
import { TAROT_DECK_BUCKET } from "@/lib/tarot/decks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAROT_BUCKET_OPTIONS: {
  public: boolean;
  fileSizeLimit: string;
  allowedMimeTypes: string[];
} = {
  public: false,
  fileSizeLimit: "5242880",
  allowedMimeTypes: ["image/webp"],
};

const paramsSchema = z.object({
  deckId: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
});

const kindSchema = z.enum(["cover", "card-back"]);

const ERROR_STATUS: Record<TarotArtworkError["code"], number> = {
  empty: 400,
  too_large: 413,
  unsupported_type: 415,
  unreadable: 400,
  too_small: 422,
  wrong_aspect: 422,
};

async function ensureTarotDeckBucket(
  admin: ReturnType<typeof createAdminClient>,
) {
  const { data: bucket, error: getBucketError } =
    await admin.storage.getBucket(TAROT_DECK_BUCKET);
  if (bucket) return null;
  if (
    getBucketError &&
    !["NoSuchBucket", "not_found"].includes(getBucketError.name)
  ) {
    return getBucketError;
  }

  const { error: createBucketError } = await admin.storage.createBucket(
    TAROT_DECK_BUCKET,
    TAROT_BUCKET_OPTIONS,
  );
  return createBucketError;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ deckId: string }> },
) {
  const identity = await getAdminIdentity();
  if (!identity) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
  if (!["site_admin", "content_admin"].includes(identity.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "INVALID_DECK" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "INVALID_FORM" }, { status: 400 });
  }
  const kindResult = kindSchema.safeParse(formData.get("kind"));
  const file = formData.get("file");
  if (!kindResult.success || !(file instanceof File)) {
    return NextResponse.json({ error: "INVALID_FORM" }, { status: 400 });
  }
  if (file.size > TAROT_ARTWORK_MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "CONFIGURATION_FAILED" }, { status: 500 });
  }
  const { data: deck, error: deckError } = await admin
    .from("tarot_decks")
    .select("id,cover_image_path,card_back_image_path")
    .eq("id", parsedParams.data.deckId)
    .maybeSingle();
  if (deckError) {
    return NextResponse.json({ error: "CATALOGUE_FAILED" }, { status: 500 });
  }
  if (!deck) {
    return NextResponse.json({ error: "DECK_NOT_FOUND" }, { status: 404 });
  }

  let output: Buffer;
  try {
    output = await normaliseTarotArtwork({
      bytes: new Uint8Array(await file.arrayBuffer()),
      contentType: file.type,
      kind: kindResult.data,
    });
  } catch (error) {
    if (error instanceof TarotArtworkError) {
      return NextResponse.json(
        { error: error.code },
        { status: ERROR_STATUS[error.code] },
      );
    }
    return NextResponse.json({ error: "PROCESSING_FAILED" }, { status: 500 });
  }

  const path = tarotArtworkPath(deck.id, kindResult.data);
  const bucketError = await ensureTarotDeckBucket(admin);
  if (bucketError) {
    return NextResponse.json(
      { error: "BUCKET_FAILED", detail: bucketError.message },
      { status: 500 },
    );
  }
  const previousPath =
    kindResult.data === "cover"
      ? deck.cover_image_path
      : deck.card_back_image_path;
  const { error: uploadError } = await admin.storage
    .from(TAROT_DECK_BUCKET)
    .upload(path, new Blob([new Uint8Array(output)], { type: "image/webp" }), {
      contentType: "image/webp",
      cacheControl: "3600",
      upsert: true,
    });
  if (uploadError) {
    return NextResponse.json(
      { error: "UPLOAD_FAILED", detail: uploadError.message },
      { status: 500 },
    );
  }

  const imageColumn =
    kindResult.data === "cover"
      ? { cover_image_path: path }
      : { card_back_image_path: path };
  const { error: updateError } = await admin
    .from("tarot_decks")
    .update({ ...imageColumn, updated_by: identity.id })
    .eq("id", deck.id);
  if (updateError) {
    if (!previousPath) {
      await admin.storage.from(TAROT_DECK_BUCKET).remove([path]);
    }
    return NextResponse.json(
      { error: "CATALOGUE_FAILED", detail: updateError.message },
      { status: 500 },
    );
  }

  await admin.from("admin_audit_log").insert({
    actor_id: identity.id,
    action: "tarot.deck.artwork.updated",
    setting_key: `tarot.deck.${deck.id}`,
    metadata: { deckId: deck.id, kind: kindResult.data },
  });

  return NextResponse.json({ ok: true, path });
}
