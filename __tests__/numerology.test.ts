import { describe, expect, it } from "vitest";
import {
  birthdayNumber,
  lifePath,
  personalCycles,
  reduceNumber,
} from "@/lib/numerology";

describe("numerology", () => {
  it("matches the app engine for Life Path", () => {
    expect(lifePath("1991-07-28")).toBe(1);
    expect(lifePath("1987-12-25")).toBe(8);
    expect(lifePath("2000-01-08")).toBe(11);
    expect(lifePath("1985-11-06")).toBe(22);
    expect(lifePath("2009-11-11")).toBe(33);
  });

  it("keeps master numbers only when asked", () => {
    expect(reduceNumber(29)).toBe(11);
    expect(reduceNumber(29, false)).toBe(2);
    expect(reduceNumber(1993)).toBe(22);
  });

  it("keeps master Birthday numbers", () => {
    expect(birthdayNumber("1990-05-29")).toBe(11);
    expect(birthdayNumber("1990-05-22")).toBe(22);
  });

  it("matches the app engine for personal cycles", () => {
    // 7 + (2+8 -> 1) + (2026 -> 10 -> 1) = 9; 9 + 11 = 20 -> 2; 2 + 24 = 26 -> 8.
    // Same as the app engine's numbersCore for this date.
    expect(personalCycles("1991-07-28", "2026-11-24")).toEqual({
      personalYear: 9,
      personalMonth: 2,
      personalDay: 8,
    });
    for (const c of Object.values(personalCycles("1984-02-29", "2026-12-31"))) {
      expect(c).toBeGreaterThanOrEqual(1);
      expect(c).toBeLessThanOrEqual(9);
    }
  });

  it("rejects malformed dates", () => {
    expect(() => lifePath("28/07/1991")).toThrow(RangeError);
  });
});
