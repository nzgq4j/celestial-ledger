"use client";

import { useState } from "react";

type ShareIconName =
  | "facebook"
  | "x"
  | "bluesky"
  | "pinterest"
  | "instagram"
  | "whatsapp"
  | "slack"
  | "email"
  | "link";

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
  if (name === "bluesky") {
    return (
      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
        <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.91 0 3.08 0 3.77c0 .69.378 5.65.624 6.48.815 2.735 3.713 3.659 6.383 3.363-4.67.69-8.82 2.383-3.377 8.44 5.989 6.2 8.2-1.33 9.108-3.516.165-.397.242-.584.242-.425 0 .425.077.187.165.584.91 2.187 3.095 9.714 9.108 3.516 5.443-6.057 1.293-7.75-3.377-8.44 2.67.296 5.568-.628 6.383-3.363.246-.83.624-5.79.624-6.48 0-.69-.139-1.86-.902-2.205-.659-.299-1.664-.621-4.3 1.24C16.046 4.747 13.087 8.686 12 10.8Z" />
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
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
        <path d="M12 2.162c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849s-.012 3.584-.069 4.849c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849s.013-3.583.07-4.849C2.312 3.93 3.826 2.38 7.081 2.232 8.347 2.175 8.725 2.162 12 2.162ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947C23.755 2.695 21.335.273 16.952.073 15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-10.405a1.44 1.44 0 1 1-2.881 0 1.44 1.44 0 0 1 2.881 0Z" />
      </svg>
    );
  }
  if (name === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.693.625.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 7.021 2.91 9.82 9.82 0 0 1 2.9 7.024c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z" />
      </svg>
    );
  }
  if (name === "slack") {
    return (
      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
        <path
          fill="#36c5f0"
          d="M5.042 15.165a2.528 2.528 0 1 1-2.52-2.523h2.52v2.523Zm1.27 0a2.527 2.527 0 0 1 5.055 0v6.313a2.527 2.527 0 0 1-5.055 0v-6.313Z"
        />
        <path
          fill="#2eb67d"
          d="M8.835 5.042a2.528 2.528 0 1 1 2.523-2.52v2.52H8.835Zm0 1.27a2.527 2.527 0 0 1 0 5.055H2.522a2.527 2.527 0 0 1 0-5.055h6.313Z"
        />
        <path
          fill="#e01e5a"
          d="M18.958 8.835a2.528 2.528 0 1 1 2.52 2.523h-2.52V8.835Zm-1.27 0a2.527 2.527 0 0 1-5.055 0V2.522a2.527 2.527 0 0 1 5.055 0v6.313Z"
        />
        <path
          fill="#ecb22e"
          d="M15.165 18.958a2.528 2.528 0 1 1-2.523 2.52v-2.52h2.523Zm0-1.27a2.527 2.527 0 0 1 0-5.055h6.313a2.527 2.527 0 0 1 0 5.055h-6.313Z"
        />
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
  sign: string;
  title: string;
  description: string;
  landscapeImageUrl: string;
  portraitImageUrl: string;
  heading: string;
  copyLabel: string;
  copiedLabel: string;
};

export function SocialShareLinks({
  url,
  sign,
  title,
  description,
  landscapeImageUrl,
  portraitImageUrl,
  heading,
  copyLabel,
  copiedLabel,
}: SocialShareLinksProps) {
  const [copied, setCopied] = useState(false);
  const signTag = sign.replace(/[^\p{L}\p{N}]/gu, "");
  const conciseDescription =
    description.length > 96
      ? `${description.slice(0, 93).trimEnd()}…`
      : description;
  const hashtags = `#${signTag} #horoscope #astrology #dailyhoroscope #CelestialAtlas`;
  const postCaption = `${title}\n\n${conciseDescription}\n\n${hashtags}`;
  const completePost = `${postCaption}\n\n${url}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedPostCaption = encodeURIComponent(postCaption);
  const encodedCompletePost = encodeURIComponent(completePost);
  const encodedLandscapeImage = encodeURIComponent(landscapeImageUrl);
  const encodedPortraitImage = encodeURIComponent(portraitImageUrl);
  const links: Array<{
    label: string;
    icon: ShareIconName;
    href: string;
    ariaLabel?: string;
  }> = [
    {
      label: "Facebook",
      icon: "facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&hashtag=%23horoscope`,
      ariaLabel: "Share on Facebook and copy caption",
    },
    {
      label: "X",
      icon: "x",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedPostCaption}`,
      ariaLabel: "Share on X",
    },
    {
      label: "Bluesky",
      icon: "bluesky",
      href: `https://bsky.app/intent/compose?text=${encodedCompletePost}`,
      ariaLabel: "Share on Bluesky",
    },
    {
      label: "Pinterest",
      icon: "pinterest",
      href: `https://www.pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedPortraitImage}&description=${encodedPostCaption}`,
      ariaLabel: "Share on Pinterest",
    },
    {
      label: "Instagram",
      icon: "instagram",
      href: portraitImageUrl,
      ariaLabel: "Open portrait image and copy caption for Instagram",
    },
    {
      label: "WhatsApp",
      icon: "whatsapp",
      href: `https://wa.me/?text=${encodedCompletePost}`,
      ariaLabel: "Share on WhatsApp",
    },
    {
      label: "Slack",
      icon: "slack",
      href: "https://app.slack.com/client",
      ariaLabel: "Open Slack and copy post text",
    },
    {
      label: "Email",
      icon: "email",
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedCompletePost}%0A%0A${encodedLandscapeImage}`,
    },
  ];

  function copyPostForPlatform(platform: ShareIconName) {
    if (
      platform !== "facebook" &&
      platform !== "instagram" &&
      platform !== "slack"
    ) {
      return;
    }
    void navigator.clipboard.writeText(completePost).catch(() => undefined);
  }

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
            aria-label={link.ariaLabel ?? link.label}
            title={link.ariaLabel ?? link.label}
            className={`button-quiet social-share__link social-share__link--${link.icon}`}
            onClick={() => copyPostForPlatform(link.icon)}
          >
            <span className="social-share__icon">
              <ShareIcon name={link.icon} />
            </span>
          </a>
        ))}
        <button
          type="button"
          className="button-quiet social-share__link social-share__link--link"
          onClick={copyLink}
          aria-label={copied ? copiedLabel : copyLabel}
          title={copied ? copiedLabel : copyLabel}
        >
          <span className="social-share__icon">
            <ShareIcon name="link" />
          </span>
        </button>
      </div>
    </aside>
  );
}
