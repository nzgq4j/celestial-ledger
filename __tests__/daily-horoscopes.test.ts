import { describe, expect, it } from "vitest";
import { dailySkyFor, horoscopeForSlug } from "@/lib/horoscopes/daily";
import {
  horoscopeUtcDateKey,
  millisecondsUntilNextUtcMidnight,
} from "@/lib/horoscopes/rollover";

describe("daily horoscopes", () => {
  const sky = dailySkyFor(new Date("2026-08-03T09:00:00.000Z"));

  it("creates a reproducible reading for all twelve signs", () => {
    expect(sky.date).toBe("2026-08-03");
    expect(sky.horoscopes).toHaveLength(12);
    expect(new Set(sky.horoscopes.map((item) => item.sign)).size).toBe(12);
  });

  it("provides substantive sections, a day arc, and calculated evidence", () => {
    const virgo = horoscopeForSlug(
      "virgo",
      new Date("2026-08-03T09:00:00.000Z"),
    );
    expect(virgo?.overview.length).toBeGreaterThan(150);
    expect(virgo?.bottomLine.length).toBeGreaterThan(450);
    expect(virgo?.relationships.length).toBeGreaterThan(250);
    expect(virgo?.business.length).toBeGreaterThan(250);
    expect(virgo?.money.length).toBeGreaterThan(250);
    expect(virgo?.work).toBe(virgo?.business);
    expect(virgo?.wellbeing).toBeTruthy();
    expect(virgo?.dayParts.map((part) => part.period)).toEqual([
      "morning",
      "afternoon",
      "evening",
    ]);
    expect(virgo?.dayParts.every((part) => part.guidance.length > 40)).toBe(
      true,
    );
    expect(virgo?.evidence).toHaveLength(4);
    expect(virgo?.evidence[0]).toMatch(/Moon at \d+°/);
  });

  it("gives the signs distinct voices without changing on refresh", () => {
    const repeated = dailySkyFor(new Date("2026-08-03T20:00:00.000Z"));
    expect(repeated.horoscopes.map((item) => item.bottomLine)).toEqual(
      sky.horoscopes.map((item) => item.bottomLine),
    );
    expect(new Set(sky.horoscopes.map((item) => item.overview)).size).toBe(12);
    expect(
      new Set(
        sky.horoscopes.map((item) => item.bottomLine.split(/[.!?]/, 1)[0]),
      ).size,
    ).toBe(12);
    expect(new Set(sky.horoscopes.map((item) => item.opportunity)).size).toBe(
      12,
    );
    expect(new Set(sky.horoscopes.map((item) => item.question)).size).toBe(12);
    expect(
      new Set(
        sky.horoscopes.map((item) =>
          item.opportunity.split(/\s+/).slice(0, 2).join(" "),
        ),
      ).size,
    ).toBeGreaterThanOrEqual(4);
    expect(
      new Set(
        sky.horoscopes.map((item) =>
          item.question.split(/\s+/).slice(0, 2).join(" "),
        ),
      ).size,
    ).toBeGreaterThanOrEqual(4);
  });

  it("rolls every horoscope to new wording at midnight UTC", () => {
    const before = dailySkyFor(new Date("2026-08-05T23:59:59.999Z"));
    const after = dailySkyFor(new Date("2026-08-06T00:00:00.000Z"));

    expect(before.date).toBe("2026-08-05");
    expect(after.date).toBe("2026-08-06");
    for (const [index, reading] of before.horoscopes.entries()) {
      const nextReading = after.horoscopes[index];
      expect(nextReading.slug).toBe(reading.slug);
      expect(nextReading.overview).not.toBe(reading.overview);
      expect(nextReading.bottomLine).not.toBe(reading.bottomLine);
      expect(nextReading.relationships).not.toBe(reading.relationships);
      expect(nextReading.business).not.toBe(reading.business);
      expect(nextReading.money).not.toBe(reading.money);
      expect(nextReading.opportunity).not.toBe(reading.opportunity);
      expect(nextReading.question).not.toBe(reading.question);
      expect(nextReading.dayParts).not.toEqual(reading.dayParts);
    }
  });

  it("uses the GMT calendar boundary for rollover timing", () => {
    expect(horoscopeUtcDateKey(new Date("2026-08-05T23:59:59.999Z"))).toBe(
      "2026-08-05",
    );
    expect(horoscopeUtcDateKey(new Date("2026-08-06T00:00:00.000Z"))).toBe(
      "2026-08-06",
    );
    expect(
      millisecondsUntilNextUtcMidnight(Date.parse("2026-08-05T23:59:59.999Z")),
    ).toBe(1);
    expect(
      millisecondsUntilNextUtcMidnight(Date.parse("2026-08-05T12:00:00.000Z")),
    ).toBe(43_200_000);
  });

  it("keeps every editorial section below 500 words", () => {
    for (const reading of sky.horoscopes) {
      for (const section of [
        reading.bottomLine,
        reading.relationships,
        reading.business,
        reading.money,
      ]) {
        expect(section.trim().split(/\s+/).length).toBeLessThanOrEqual(500);
      }
    }
  });

  it("rejects unsupported sign slugs", () => {
    expect(
      horoscopeForSlug("ophiuchus", new Date("2026-08-03T09:00:00.000Z")),
    ).toBeUndefined();
  });

  it("localizes every reader-facing horoscope field", () => {
    const spanish = dailySkyFor(new Date("2026-08-03T09:00:00.000Z"), "es-ES");
    const aries = spanish.horoscopes[0];
    expect(aries.sign).toBe("Aries");
    expect(aries.bottomLine).not.toBe(sky.horoscopes[0].bottomLine);
    expect(aries.relationships).toMatch(/relacional|Luna|vínculos|conexión/iu);
    expect(aries.business).toMatch(/profesional|negocios|Lidera|trabajo/);
    expect(aries.money).toMatch(/dinero|financiera|cifras|pagarl/iu);
    expect(aries.dayParts[0].guidance).toMatch(
      /temperatura|espacio|necesidad|Observa/,
    );
    expect(aries.opportunity).toMatch(/^(Avanza|Se abre|Di que sí|Convierte)/);
    expect(aries.caution).toMatch(/^No conviertas/);
    expect(aries.question).toMatch(/^¿/);
    expect(aries.evidence.every((line) => !line.startsWith("Moon at"))).toBe(
      true,
    );
  });
});
