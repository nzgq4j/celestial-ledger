import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildNatalChartPdf } from "@/lib/natal-chart-pdf";
import type { NatalChart } from "@/lib/types";

const chart: NatalChart = {
  input: {
    date: "1990-01-01",
    time: "12:00",
    timeUnknown: false,
    place: {
      id: "fixture",
      city: "London",
      country: "United Kingdom",
      displayName: "London, United Kingdom",
      latitude: 51.5,
      longitude: -0.12,
      timeZone: "Europe/London",
    },
  },
  utc: "1990-01-01T12:00:00.000Z",
  julianDay: 2447893,
  timeKnown: true,
  placements: [
    {
      name: "Sun",
      longitude: 280,
      sign: "Capricorn",
      degree: 10,
      minute: 15,
      house: 10,
      retrograde: false,
    },
  ],
  houses: [{ house: 1, longitude: 10, sign: "Aries", degree: 10, minute: 0 }],
  aspects: [],
  moonMayChangeSign: false,
  calculation: {
    zodiac: "Tropical",
    houseSystem: "Equal (Ascendant)",
    ephemeris: "Fixture ephemeris",
    engineVersion: "1.0",
    calculationVersion: "1.0",
    aspectOrbs: {
      Conjunction: 8,
      Opposition: 8,
      Trine: 6,
      Square: 6,
      Sextile: 4,
    },
  },
};

describe("natal chart PDF", () => {
  it("creates a native PDF containing the chart and saved interpretation", async () => {
    const bytes = await buildNatalChartPdf({
      title: "My birth chart",
      displayName: "London, United Kingdom",
      chart,
      interpretation:
        "1. Core identity\nA complete saved interpretation paragraph.",
      generatedAt: "7 August 2026",
    });

    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBeGreaterThanOrEqual(2);
    expect(document.getTitle()).toBe("My birth chart");
  });
});
