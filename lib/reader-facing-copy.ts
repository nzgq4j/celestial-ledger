export const READER_FACING_TECHNICAL_LEAK_PATTERN =
  /\b(?:Evidence:|technical evidence|evidence id|evidence register|evidence bundle|evidence mechanics|calculated fact register|server-calculated|server evidence|server output|server-provided|immutable evidence|supplied evidence|supplied chart evidence|present-signal list|transit record|transit labels|scored high|score of|orb value|longitude|provenance|calculation metadata|(?:placement|angle|house|aspect|transit|signal|lunar)_[a-z0-9]+|(?:placement|angle|house|aspect):[a-z0-9-]+|\d+(?:\.\d+)?\s*(?:deg|Â°)\s+orb)\b/i;

export function hasReaderFacingTechnicalLeak(value: string) {
  return READER_FACING_TECHNICAL_LEAK_PATTERN.test(value);
}

export function readerFacingInterpretiveText(value: string) {
  return value
    .replace(/Active now\s*\(per immutable evidence\):\s*/gi, "")
    .replace(/Bottom line up front\s*\(server-calculated evidence\):\s*/gi, "")
    .replace(/Practical orientation\s*\(evidence-linked\):\s*/gi, "")
    .replace(/Read symbolically from the supplied evidence:\s*/gi, "")
    .replace(/Tone and limits:\s*/gi, "")
    .replace(/Evidence:\s*[^.]+(?:\([^)]*\))?\.\s*/gi, "")
    .replace(/Technical evidence:\s*[^.]+(?:\([^)]*\))?\.\s*/gi, "")
    .replace(/Calculated fact register:\s*[^.]+(?:\([^)]*\))?\.\s*/gi, "")
    .replace(/server-calculated\s+/gi, "")
    .replace(/\bserver-provided\s+/gi, "")
    .replace(/\bimmutable evidence\b/gi, "the chart basis")
    .replace(/\bsupplied evidence\b/gi, "the chart basis")
    .replace(/\bsupplied chart evidence\b/gi, "the chart basis")
    .replace(/\bevidence-linked\s+/gi, "")
    .replace(/\baccording to the transit labels in the data\b/gi, "")
    .replace(/[^.?!]*\btransiting\s+[^.?!]*\bnatal\s+[^.?!]*[.?!]\s*/gi, "")
    .replace(
      /[^.?!]*\b(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|North Node)\s+(?:conjunction|conjunct|opposition|opposite|trine|square|sextile)\s+(?:natal\s+)?(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|North Node|Ascendant|Midheaven)[^.?!]*[.?!]\s*/gi,
      "",
    )
    .replace(/[^.?!]*\btransit record\b[^.?!]*[.?!]\s*/gi, "")
    .replace(/[^.?!]*\btransit labels\b[^.?!]*[.?!]\s*/gi, "")
    .replace(/[^.?!]*\bserver output\b[^.?!]*[.?!]\s*/gi, "")
    .replace(/[^.?!]*\borb\b[^.?!]*[.?!]\s*/gi, "")
    .replace(/\b(?:placement|angle|house|aspect):[a-z0-9-]+\b/gi, "")
    .replace(/\b(?:transit|signal|lunar)_[a-z0-9]+\b/gi, "")
    .replace(
      /\([^)]*\b(?:placement|angle|house|aspect|transit|signal|lunar)[:_][^)]*\)/gi,
      "",
    )
    .replace(/\b\d+(?:\.\d+)?\s*deg\s+orb\b/gi, "")
    .replace(/\b\d+(?:\.\d+)?Â°\s+orb\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function readerFacingTextOrFallback(value: string, fallback: string) {
  return readerFacingInterpretiveText(value) || fallback;
}
