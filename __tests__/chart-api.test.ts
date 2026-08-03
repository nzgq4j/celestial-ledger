import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/chart/route";

const birthInput = {
  date: "1990-05-01",
  time: "12:00",
  timeUnknown: false,
  place: {
    id: "london",
    city: "London",
    country: "United Kingdom",
    displayName: "London, United Kingdom",
    latitude: 51.5074,
    longitude: -0.1278,
    timeZone: "Europe/London",
  },
};

function request(body: unknown, headers: HeadersInit = {}): Request {
  return new Request("https://celestial.example/api/chart", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/chart", () => {
  it("returns a server-authoritative chart and provenance", async () => {
    const response = await POST(request({ birthInput }));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
    expect(payload.chart.placements).toHaveLength(11);
    expect(payload.chart.calculation.houseSystem).toBe("Equal (Ascendant)");
    expect(payload.provenance).toMatchObject({
      engine: "astronomy-engine",
      engineVersion: "2.1.19",
      calculationVersion: "celestial-atlas-astronomy-v1",
    });
  });

  it("rejects unknown fields", async () => {
    const response = await POST(
      request({ birthInput: { ...birthInput, suppliedPlacements: [] } }),
    );
    expect(response.status).toBe(422);
  });

  it("rejects cross-origin requests", async () => {
    const response = await POST(
      request(
        { birthInput },
        { origin: "https://attacker.example", host: "celestial.example" },
      ),
    );
    expect(response.status).toBe(403);
  });

  it("returns a structured ambiguity error", async () => {
    const response = await POST(
      request({
        birthInput: {
          ...birthInput,
          date: "2024-10-27",
          time: "01:30",
        },
      }),
    );
    const payload = await response.json();
    expect(response.status).toBe(422);
    expect(payload.code).toBe("AMBIGUOUS");
  });

  it("omits time-dependent evidence for unknown birth times", async () => {
    const response = await POST(
      request({
        birthInput: {
          ...birthInput,
          date: "2024-01-16",
          time: undefined,
          timeUnknown: true,
        },
      }),
    );
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.chart.ascendant).toBeUndefined();
    expect(payload.chart.midheaven).toBeUndefined();
    expect(payload.chart.houses).toEqual([]);
    expect(payload.chart.moonMayChangeSign).toBe(true);
    expect(
      payload.chart.placements.find(
        (item: { name: string }) => item.name === "Moon",
      ).uncertain,
    ).toBe(true);
  });

  it("rejects exact-pole angles for a known time", async () => {
    const response = await POST(
      request({
        birthInput: {
          ...birthInput,
          place: { ...birthInput.place, latitude: 90 },
        },
      }),
    );
    expect(response.status).toBe(422);
  });

  it("rejects dates outside the validated production range", async () => {
    const response = await POST(
      request({ birthInput: { ...birthInput, date: "1799-12-31" } }),
    );
    expect(response.status).toBe(422);
  });
});
