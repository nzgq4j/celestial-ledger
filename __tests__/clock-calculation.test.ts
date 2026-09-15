import { describe, expect, it } from "vitest";
import { calculateCalendar, calculateClock } from "@/lib/clock/calculation";
import { clockDateSchema, yearFraction } from "@/lib/clock/domain";
import { GET } from "@/app/api/clock/route";

describe("Celestial Clock production-engine fixtures", () => {
  // USNO API 4.0.1, retrieved 2026-09-15. Times rounded to a minute by USNO.
  // https://aa.usno.navy.mil/api/seasons?year=2026
  // https://aa.usno.navy.mil/api/moon/phases/year?year=2026
  const references = [
    ["March equinox", "2026-03-20T14:46:00Z"],
    ["June solstice", "2026-06-21T08:24:00Z"],
    ["September equinox", "2026-09-23T00:05:00Z"],
    ["December solstice", "2026-12-21T20:50:00Z"],
    ["New Moon", "2026-09-11T03:27:00Z"],
    ["First quarter", "2026-09-18T20:44:00Z"],
    ["Full Moon", "2026-09-26T16:49:00Z"],
  ];
  for (const [title, utc] of references)
    it(`matches independent USNO reference: ${title} ${utc}`, () => {
      const event = calculateCalendar(2026).events.find(
        (e) => e.title === title && e.utc.slice(0, 10) === utc.slice(0, 10),
      );
      expect(event).toBeDefined();
      expect(Math.abs(+new Date(event!.utc) - +new Date(utc))).toBeLessThan(
        120_000,
      );
    });
  // Golden regression values from the pinned production engine 2.1.19.
  // These complement, rather than replace, the independent references above.
  for (const [utc, phase, illuminated] of [
    ["2000-01-01T12:00:00.000Z", 302.9493632166696, 0.23012656648323943],
    ["2024-02-29T12:00:00.000Z", 234.03891729446553, 0.7943793390950246],
    ["2026-09-15T12:00:00.000Z", 52.66517461084018, 0.1987901100450552],
  ] as const)
    it(`preserves lunar calculation fixture at ${utc}`, () => {
      const actual = calculateClock(utc);
      expect(actual.moon.phase).toBeCloseTo(phase, 6);
      expect(actual.moon.illuminated).toBeCloseTo(illuminated, 6);
      expect(actual.planets).toHaveLength(10);
    });

  it("preserves reproducible evidence and changes evidence when the time changes", () => {
    const a = calculateClock("2026-09-15T12:00:00.000Z");
    expect(calculateClock(a.utc)).toEqual(a);
    const b = calculateClock("2026-09-15T12:01:00.000Z");
    expect(b.id).not.toBe(a.id);
    expect(b.moon.id).not.toBe(a.moon.id);
    expect(b.calendar.id).toBe(a.calendar.id);
    expect(a.method.coordinates).toBeNull();
    expect(a.method.houseSystem).toBeNull();
    expect(a.planets.every((p) => p.id && p.retrograde === p.speed < 0)).toBe(
      true,
    );
  });
  it("supports leap days, year rollover and the upper date boundary", () => {
    expect(yearFraction("2024-03-01T00:00:00Z", 2024)).toBeCloseTo(60 / 366);
    const last = calculateClock("2026-12-31T23:59:00.000Z");
    expect(last.nextEvents[0].utc.startsWith("2027")).toBe(true);
    expect(last.calendar.events.every((e) => e.utc.startsWith("2026"))).toBe(
      true,
    );
    expect(calculateClock("2050-12-31T23:59:00.000Z").nextEvents).toEqual([]);
  });
  it("rejects invalid calendar dates and unsupported years", () => {
    for (const input of [
      "2026-02-30T12:00:00.000Z",
      "1999-12-31T00:00:00.000Z",
      "2051-01-01T00:00:00.000Z",
      "no",
      "2026-01-01T00:00:00+01:00",
    ])
      expect(clockDateSchema.safeParse(input).success).toBe(false);
  });
});

describe("public clock API", () => {
  it("returns calculation provenance and normalized minute precision", async () => {
    const response = await GET(
      new Request(
        "https://example.com/api/clock?at=2026-09-15T12%3A00%3A20.000Z",
      ),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.utc).toBe("2026-09-15T12:00:00.000Z");
    expect(body.method.timezone).toBe("UTC");
    expect(response.headers.get("Cache-Control")).toContain("public");
  });
  it("rejects unknown and duplicate parameters", async () => {
    for (const query of [
      "birthDate=2000-01-01",
      "at=no",
      "at=2026-09-15T12%3A00%3A00.000Z&at=2026-09-15T12%3A00%3A00.000Z",
    ]) {
      expect(
        (await GET(new Request(`https://example.com/api/clock?${query}`)))
          .status,
      ).toBe(400);
    }
  });
});
