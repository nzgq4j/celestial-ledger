/**
 * Astrological glyphs for member screens. Every glyph carries U+FE0E so that
 * platforms render the text presentation rather than a colour emoji.
 */
const VS15 = "︎";

const bodyGlyphs: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
  "North Node": "☊",
};

const signGlyphs: Record<string, string> = {
  Aries: "♈",
  Taurus: "♉",
  Gemini: "♊",
  Cancer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Scorpio: "♏",
  Sagittarius: "♐",
  Capricorn: "♑",
  Aquarius: "♒",
  Pisces: "♓",
};

const aspectGlyphs: Record<string, string> = {
  Conjunction: "☌",
  Opposition: "☍",
  Trine: "△",
  Square: "□",
  Sextile: "⚹",
};

export function bodyGlyph(name: string): string | undefined {
  const glyph = bodyGlyphs[name];
  return glyph ? `${glyph}${VS15}` : undefined;
}

export function signGlyph(sign: string): string | undefined {
  const glyph = signGlyphs[sign];
  return glyph ? `${glyph}${VS15}` : undefined;
}

export function aspectGlyph(aspect: string): string | undefined {
  const glyph = aspectGlyphs[aspect];
  return glyph ? `${glyph}${VS15}` : undefined;
}

/** Formats degrees and minutes within a sign, e.g. `22°14′`. */
export function degreeMinute(degree: number, minute: number) {
  return `${degree}°${String(minute).padStart(2, "0")}′`;
}
