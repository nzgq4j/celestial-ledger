"use client";

import { useState } from "react";

type ShareIconName = "facebook" | "x" | "pinterest" | "email" | "link";

function ShareIcon({ name }: { name: ShareIconName }) {
  if (name === "facebook") {
    return (
      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.414c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.974h-1.513c-1.49 0-1.956.931-1.956 1.887v2.26h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z" />
      </svg>
    );
  }
  if (name === "x") {
    return (
      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.847h-7.406l-5.8-7.584-6.638 7.584H.474l8.598-9.83L0 1.154h7.594l5.243 6.932 6.064-6.933Zm-1.292 19.492h2.039L6.486 3.24H4.298l13.311 17.405Z" />
      </svg>
    );
  }
  if (name === "pinterest") {
    return (
      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
        <path d="M12 0C5.372 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.407.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.669.968-2.916 2.172-2.916 1.024 0 1.518.769 1.518 1.69 0 1.03-.655 2.569-.994 3.996-.283 1.195.599 2.169 1.777 2.169 2.132 0 3.772-2.249 3.772-5.495 0-2.872-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.208 0 1.031.397 2.137.893 2.739.098.119.112.223.083.344-.091.378-.293 1.195-.333 1.362-.053.22-.174.267-.402.161-1.499-.698-2.436-2.888-2.436-4.649 0-3.785 2.75-7.26 7.929-7.26 4.162 0 7.398 2.966 7.398 6.928 0 4.137-2.608 7.465-6.227 7.465-1.216 0-2.359-.632-2.75-1.378l-.748 2.848c-.271 1.043-1.002 2.35-1.492 3.147A12.029 12.029 0 0 0 12 24c6.628 0 12-5.372 12-12S18.628 0 12 0Z" />
      </svg>
    );
  }
  if (name === "email") {
    return (
      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
        <path d="M3 5.25h18A1.75 1.75 0 0 1 22.75 7v10A1.75 1.75 0 0 1 21 18.75H3A1.75 1.75 0 0 1 1.25 17V7A1.75 1.75 0 0 1 3 5.25Zm0 1.5a.25.25 0 0 0-.25.25v.3L12 13.45l9.25-6.15V7a.25.25 0 0 0-.25-.25H3Zm18.25 2.35-8.835 5.875a.75.75 0 0 1-.83 0L2.75 9.1V17c0 .138.112.25.25.25h18a.25.25 0 0 0 .25-.25V9.1Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path d="M9.65 14.35a.75.75 0 0 1 0-1.06l3.64-3.64a.75.75 0 1 1 1.06 1.06l-3.64 3.64a.75.75 0 0 1-1.06 0Zm-3.7 4.76a4.25 4.25 0 0 1 0-6.01l2.12-2.12a4.25 4.25 0 0 1 5.64-.33.75.75 0 0 1-.92 1.18 2.75 2.75 0 0 0-3.66.21l-2.12 2.12a2.75 2.75 0 1 0 3.89 3.89l2.12-2.12a2.75 2.75 0 0 0 .21-3.66.75.75 0 0 1 1.18-.92 4.25 4.25 0 0 1-.33 5.64l-2.12 2.12a4.25 4.25 0 0 1-6.01 0Zm4.34-5.76a4.25 4.25 0 0 1 .33-5.64l2.12-2.12a4.25 4.25 0 1 1 6.01 6.01l-2.12 2.12a4.25 4.25 0 0 1-5.64.33.75.75 0 1 1 .92-1.18 2.75 2.75 0 0 0 3.66-.21l2.12-2.12a2.75 2.75 0 1 0-3.89-3.89l-2.12 2.12a2.75 2.75 0 0 0-.21 3.66.75.75 0 0 1-1.18.92Z" />
    </svg>
  );
}

type SocialShareLinksProps = {
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  heading: string;
  copyLabel: string;
  copiedLabel: string;
};

export function SocialShareLinks({
  url,
  title,
  description,
  imageUrl,
  heading,
  copyLabel,
  copiedLabel,
}: SocialShareLinksProps) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedImage = encodeURIComponent(imageUrl);
  const links = [
    {
      label: "Facebook",
      icon: "facebook" as const,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "X",
      icon: "x" as const,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: "Pinterest",
      icon: "pinterest" as const,
      href: `https://www.pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedDescription}`,
    },
    {
      label: "Email",
      icon: "email" as const,
      href: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
    },
  ];

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <aside className="social-share" aria-labelledby="share-reading-heading">
      <p id="share-reading-heading" className="section-kicker">
        {heading}
      </p>
      <div className="social-share__links">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`button-quiet social-share__link social-share__link--${link.icon}`}
          >
            <span className="social-share__icon">
              <ShareIcon name={link.icon} />
            </span>
            <span>{link.label}</span>
          </a>
        ))}
        <button
          type="button"
          className="button-quiet social-share__link social-share__link--link"
          onClick={copyLink}
        >
          <span className="social-share__icon">
            <ShareIcon name="link" />
          </span>
          <span>{copied ? copiedLabel : copyLabel}</span>
        </button>
      </div>
    </aside>
  );
}
