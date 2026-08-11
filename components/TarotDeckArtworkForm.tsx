"use client";

import { useRef, useState } from "react";
import type { TarotArtworkKind } from "@/lib/tarot/artwork";
import { formatTarotMessage } from "@/lib/tarot/ui-locales";

export function TarotDeckArtworkForm({
  deckId,
  kind,
  hasArtwork,
  disabled,
  copy,
  cards = [],
  faceCount,
  totalFaces,
}: {
  deckId: string;
  kind: TarotArtworkKind;
  hasArtwork: boolean;
  disabled: boolean;
  copy: Record<string, string>;
  cards?: readonly { id: string; name: string }[];
  faceCount?: number;
  totalFaces?: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const title =
    kind === "cover"
      ? copy.adminCover
      : kind === "card-back"
        ? copy.adminCardBack
        : copy.adminCardFace;
  const help =
    kind === "cover"
      ? copy.adminCoverHelp
      : kind === "card-back"
        ? copy.adminCardBackHelp
        : copy.adminCardFaceHelp;
  const errorCopy: Record<string, string> = {
    empty: copy.adminChooseImage,
    too_large: copy.adminTooLarge,
    unsupported_type: copy.adminUnsupportedType,
    unreadable: copy.adminUnreadable,
    too_small: copy.adminTooSmall,
    wrong_aspect: copy.adminWrongAspect,
    INVALID_CARD: copy.adminInvalidCard,
    UNAUTHENTICATED: copy.adminSessionExpired,
    FORBIDDEN: copy.adminForbidden,
    BUCKET_FAILED: copy.adminUploadFailed,
    CONFIGURATION_FAILED: copy.adminUploadFailed,
    CATALOGUE_FAILED: copy.adminUploadFailed,
    UPLOAD_FAILED: copy.adminUploadFailed,
  };

  return (
    <form
      ref={formRef}
      className="admin-artwork-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setStatus(copy.adminChecking);
        try {
          const response = await fetch(
            `/api/admin/tarot-decks/${encodeURIComponent(deckId)}/artwork`,
            { method: "POST", body: new FormData(event.currentTarget) },
          );
          const body = (await response.json()) as {
            error?: string;
            detail?: string;
          };
          if (!response.ok) {
            const message =
              errorCopy[body.error ?? ""] ?? copy.adminUploadFailed;
            setStatus(
              body.error && body.detail
                ? `${message} (${body.error}: ${body.detail})`
                : body.error
                  ? `${message} (${body.error})`
                  : message,
            );
            return;
          }
          setStatus(
            formatTarotMessage(copy.adminArtworkSaved, { kind: title }),
          );
          formRef.current?.reset();
          window.location.hash = "tarot-decks";
          window.location.reload();
        } catch {
          setStatus(copy.adminUploadFailed);
        } finally {
          setPending(false);
        }
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      {kind === "card-face" && (
        <label>
          {copy.adminCardFaceSelect}
          <small>
            {typeof faceCount === "number" && typeof totalFaces === "number"
              ? formatTarotMessage(copy.adminCardFacesSummary, {
                  count: faceCount,
                  total: totalFaces,
                })
              : copy.adminCardFaceSelectHelp}
          </small>
          <select name="cardId" required disabled={disabled || pending}>
            <option value="">{copy.adminChooseCardFace}</option>
            {cards.map((card) => (
              <option value={card.id} key={card.id}>
                {card.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        {title}
        <small>{help}</small>
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          required
          disabled={disabled || pending}
        />
      </label>
      <button
        className="button-quiet"
        disabled={disabled || pending}
        type="submit"
      >
        {pending
          ? copy.adminUploading
          : hasArtwork && kind !== "card-face"
            ? copy.adminReplace
            : copy.adminUpload}
      </button>
      <span className="admin-upload-status" role="status" aria-live="polite">
        {status}
      </span>
    </form>
  );
}
