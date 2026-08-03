const fixture = { utc: "1990-05-01T00:00:00Z", sun: 40.3667, tolerance: 0.2 };

try {
  const astronomy = await import("astronomy-engine");
  const date = new Date(fixture.utc);
  const longitude = astronomy.Ecliptic(
    astronomy.GeoVector(astronomy.Body.Sun, date, true),
  ).elon;
  const delta = Math.abs(longitude - fixture.sun);
  if (delta > fixture.tolerance)
    throw new Error(`fixture differs by ${delta} degrees`);
  console.log(`Server ephemeris gate passed on ${process.version}.`);
} catch (error) {
  console.error("SERVER_ASTRONOMY_GATE_BLOCKED");
  console.error(error instanceof Error ? error.message : error);
  console.error(
    "Do not release paid reports until the deterministic astronomy gate passes.",
  );
  process.exitCode = 1;
}
