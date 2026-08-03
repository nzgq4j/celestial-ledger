import { describe, expect, it } from "vitest";

import { calculateChartAngles } from "@/lib/astronomy";
import { equalHouseCusps, houseForLongitude } from "@/lib/houses";
import angleFixtures from "./angle-fixtures.json";

function angularDelta(actual: number, expected: number): number {
  return Math.abs(((actual - expected + 540) % 360) - 180);
}

describe("owned astrology layer", () => {
  it("calculates finite chart angles", () => {
    const angles = calculateChartAngles(
      new Date("1990-05-01T00:00:00Z"),
      51.5074,
      -0.1278,
    );
    expect(angles.ascendant).toBeGreaterThanOrEqual(0);
    expect(angles.ascendant).toBeLessThan(360);
    expect(angles.midheaven).toBeGreaterThanOrEqual(0);
    expect(angles.midheaven).toBeLessThan(360);
  });

  it("builds twelve equal cusps and assigns wraparound houses", () => {
    const cusps = equalHouseCusps(350);
    expect(cusps).toHaveLength(12);
    expect(cusps[0]).toBe(350);
    expect(cusps[6]).toBe(170);
    expect(houseForLongitude(359, cusps)).toBe(1);
    expect(houseForLongitude(19.999999, cusps)).toBe(1);
    expect(houseForLongitude(20, cusps)).toBe(2);
    expect(houseForLongitude(350, cusps)).toBe(1);
  });

  for (const fixture of angleFixtures) {
    it(`matches the independent ${fixture.label} angle fixture`, () => {
      const angles = calculateChartAngles(
        new Date(fixture.utc),
        fixture.latitude,
        fixture.longitude,
      );
      expect(
        angularDelta(
          angles.localSiderealTime,
          fixture.expectedLocalApparentSiderealTimeHours * 15,
        ),
      ).toBeLessThanOrEqual(fixture.toleranceDegrees);
      expect(
        angularDelta(angles.ascendant, fixture.expectedAscendant),
      ).toBeLessThanOrEqual(fixture.toleranceDegrees);
      expect(
        angularDelta(angles.midheaven, fixture.expectedMidheaven),
      ).toBeLessThanOrEqual(fixture.toleranceDegrees);
      const cusps = equalHouseCusps(angles.ascendant);
      expect(cusps).toHaveLength(12);
      expect(angularDelta(cusps[6], angles.ascendant + 180)).toBeLessThan(
        1e-10,
      );
    });
  }

  it("remains finite at extreme inhabited latitudes", () => {
    for (const latitude of [78.2232, -77.8419, 89.9, -89.9]) {
      const angles = calculateChartAngles(
        new Date("2024-01-01T00:00:00Z"),
        latitude,
        15.6469,
      );
      expect(Number.isFinite(angles.ascendant)).toBe(true);
      expect(equalHouseCusps(angles.ascendant)).toHaveLength(12);
    }
  });

  it("rejects exact geographic-pole angles", () =>
    expect(() =>
      calculateChartAngles(new Date("2024-01-01T00:00:00Z"), 90, 0),
    ).toThrow(/undefined at the geographic poles/));
});
