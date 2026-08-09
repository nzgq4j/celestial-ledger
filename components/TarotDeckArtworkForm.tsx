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
}: {
  deckId: string;
  kind: TarotArtworkKind;
  hasArtwork: boolean;
  disabled: boolean;
  copy: Record<string, string>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const title = kind === "cover" ? copy.adminCover : copy.adminCardBack;
  const errorCopy: Record<string, string> = {
    empty: copy.adminChooseImage,
    too_large: copy.adminTooLarge,
    unsupported_type: copy.adminUnsupportedType,
    unreadable: copy.adminUnreadable,
    too_small: copy.adminTooSmall,
    wrong_aspect: copy.adminWrongAspect,
    UNAUTHENTICATED: copy.adminSessionExpired,
    FORBIDDEN: copy.adminForbidden,
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
          const body = (await response.json()) as { error?: string };
          if (!response.ok) {
            setStatus(errorCopy[body.error ?? ""] ?? copy.adminUploadFailed);
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
      <label>
        {title}
        <small>
          {kind === "cover" ? copy.adminCoverHelp : copy.adminCardBackHelp}
        </small>
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
          : hasArtwork
            ? copy.adminReplace
            : copy.adminUpload}
      </button>
      <span className="admin-upload-status" role="status" aria-live="polite">
        {status}
      </span>
    </form>
  );
}
