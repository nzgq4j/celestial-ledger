import { describe, expect, it } from "vitest";
import { dailySkyFor, horoscopeForSlug } from "@/lib/horoscopes/daily";

describe("daily horoscopes", () => {
  const sky = dailySkyFor(new Date("2026-08-03T09:00:00.000Z"));

  it("creates a reproducible reading for all twelve signs", () => {
    expect(sky.date).toBe("2026-08-03");
    expect(sky.horoscopes).toHaveLength(12);
    expect(new Set(sky.horoscopes.map((item) => item.sign)).size).toBe(12);
  });

  it("provides substantive sections and calculated evidence", () => {
    const virgo = horoscopeForSlug(
      "virgo",
      new Date("2026-08-03T09:00:00.000Z"),
    );
    expect(virgo?.overview.length).toBeGreaterThan(150);
    expect(virgo?.relationships).toBeTruthy();
    expect(virgo?.work).toBeTruthy();
    expect(virgo?.wellbeing).toBeTruthy();
    expect(virgo?.evidence).toHaveLength(4);
    expect(virgo?.evidence[0]).toMatch(/Moon at \d+°/);
  });

  it("rejects unsupported sign slugs", () => {
    expect(
      horoscopeForSlug("ophiuchus", new Date("2026-08-03T09:00:00.000Z")),
    ).toBeUndefined();
  });
});
