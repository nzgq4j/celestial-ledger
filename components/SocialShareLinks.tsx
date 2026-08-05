"use client";

import { useState } from "react";

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
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: "Pinterest",
      href: `https://www.pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedDescription}`,
    },
    {
      label: "Email",
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
            className="button-quiet"
          >
            {link.label}
          </a>
        ))}
        <button type="button" className="button-quiet" onClick={copyLink}>
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
    </aside>
  );
}
