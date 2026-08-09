"use client";

import Image from "next/image";

export function TarotSymbolicCardBack({
  imageUrl,
  className = "",
}: {
  imageUrl: string | null;
  className?: string;
}) {
  return (
    <span
      className={["tarot-card-back", className].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <span className="tarot-card-back__axis" />
      <span className="tarot-card-back__seal">
        <i />
      </span>
      {imageUrl && (
        <Image
          className="tarot-card-back__artwork"
          src={imageUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 62vw, 15rem"
          unoptimized
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      )}
    </span>
  );
}
