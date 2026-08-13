export type ReaderFacingHoroscope = {
  theme: string;
  overview: string;
  bottomLine: string;
  relationships: string;
  business: string;
  money: string;
  wellbeing: string;
  opportunity: string;
  caution: string;
  question: string;
  dayParts: Array<{ theme: string; guidance: string }>;
};

export type HoroscopeCopyViolation =
  | "INLINE_EVIDENCE_ID"
  | "META_COPY"
  | "FORCED_ANALOGY"
  | "OVERLONG_SENTENCE"
  | "EXCESSIVE_LENGTH"
  | "TITLE_EM_DASH";

export function readerFacingHoroscopeText(reading: ReaderFacingHoroscope) {
  return [
    reading.theme,
    reading.overview,
    reading.bottomLine,
    reading.relationships,
    reading.business,
    reading.money,
    reading.wellbeing,
    reading.opportunity,
    reading.caution,
    reading.question,
    ...reading.dayParts.flatMap((part) => [part.theme, part.guidance]),
  ].join(" ");
}

export function horoscopeCopyViolations(reading: ReaderFacingHoroscope) {
  const text = readerFacingHoroscopeText(reading);
  const violations = new Set<HoroscopeCopyViolation>();

  if (/\bevidence\s*:\s*\d+\b/i.test(text))
    violations.add("INLINE_EVIDENCE_ID");
  if (
    /\b(symbolic reflection|not (?:a )?prediction|ephemeris|evidence ids?|whole-sign|astronomy engine|reader-facing|editorial direction)\b/i.test(
      text,
    )
  )
    violations.add("META_COPY");
  if (
    /\b(imagine|picture this|treat (?:today|the day|your day) like|as though|as if)\b/i.test(
      text,
    )
  )
    violations.add("FORCED_ANALOGY");
  if (
    reading.overview.length > 500 ||
    reading.bottomLine.length > 1_400 ||
    reading.dayParts.some((part) => part.guidance.length > 320)
  )
    violations.add("EXCESSIVE_LENGTH");
  if (
    reading.theme.includes("—") ||
    reading.dayParts.some((part) => part.theme.includes("—"))
  )
    violations.add("TITLE_EM_DASH");

  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if (sentence.trim().split(/\s+/).length > 55) {
      violations.add("OVERLONG_SENTENCE");
      break;
    }
  }

  return [...violations];
}
