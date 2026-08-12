const JOURNAL_FEATURED_IMAGES: Readonly<Record<string, string>> = {
  "astrology-in-daily-life": "/images/journal/astrology-in-daily-life.png",
};

export function journalFeaturedImage(slug: string) {
  return JOURNAL_FEATURED_IMAGES[slug] ?? `/journal/${slug}/opengraph-image`;
}
