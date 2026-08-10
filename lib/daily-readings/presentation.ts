import {
  readerFacingInterpretiveText,
  readerFacingTextOrFallback,
} from "@/lib/reader-facing-copy";

export function dailyUserFacingText(value: string) {
  return readerFacingInterpretiveText(value);
}

export function dailyFallbackText(value: string, fallback: string) {
  return readerFacingTextOrFallback(value, fallback);
}
