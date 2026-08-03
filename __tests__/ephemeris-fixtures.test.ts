import { describe, expect, it } from "vitest";
import {
  geocentricLongitude,
  longitudeSpeed,
  meanNorthNodeLongitude,
} from "@/lib/astronomy";
import type { PlanetName } from "@/lib/types";
import fixtures from "./fixtures.json";

describe("trusted ephemeris fixtures", () => {
  for (const fixture of fixtures)
    it(`${fixture.utc} matches the reference longitudes`, () => {
      const date = new Date(fixture.utc);
      for (const [name, expected] of Object.entries(fixture.expected)) {
        const actual = geocentricLongitude(name as PlanetName, date);
        const delta = Math.abs(((actual - expected + 540) % 360) - 180);
        expect(delta, name).toBeLessThanOrEqual(fixture.toleranceDegrees);
      }
    });

  it("calculates the mean north node independently", () =>
    expect(meanNorthNodeLongitude(new Date(fixtures[0].utc))).toBeCloseTo(
      fixtures[0].expected["North Node"],
      1,
    ));

  it("detects Mercury retrograde in the reference fixture", () =>
    expect(longitudeSpeed("Mercury", new Date(fixtures[0].utc))).toBeLessThan(
      0,
    ));

  it("detects motion reversal around the 2024 Mercury stations", () => {
    expect(
      longitudeSpeed("Mercury", new Date("2024-03-31T00:00:00Z")),
    ).toBeGreaterThan(0);
    expect(
      longitudeSpeed("Mercury", new Date("2024-04-03T00:00:00Z")),
    ).toBeLessThan(0);
    expect(
      longitudeSpeed("Mercury", new Date("2024-04-24T00:00:00Z")),
    ).toBeLessThan(0);
    expect(
      longitudeSpeed("Mercury", new Date("2024-04-27T00:00:00Z")),
    ).toBeGreaterThan(0);
  });
});
