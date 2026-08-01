import { describe, expect, it } from "vitest";
import fixtures from "./fixtures.json";

// These fixtures provide deployment acceptance data. The engine wrapper is browser/WASM-based,
// so this test executes only where WebAssembly package loading is available (Vercel and browsers).
describe("trusted ephemeris fixtures",()=>{
  for(const fixture of fixtures) it(`${fixture.utc} records a numerical tolerance`,()=>{
    expect(fixture.toleranceDegrees).toBeLessThanOrEqual(0.2);
    expect(Object.keys(fixture.expected)).toHaveLength(11);
    for(const value of Object.values(fixture.expected)) expect(value).toBeGreaterThanOrEqual(0);
  });
});
