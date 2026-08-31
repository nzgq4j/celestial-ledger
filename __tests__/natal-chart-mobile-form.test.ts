import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const form = readFileSync("components/HoroscopeApp.tsx", "utf8");
const styles = readFileSync("app/globals.css", "utf8");

describe("natal chart mobile form", () => {
  it("marks form columns as shrinkable layout fields", () => {
    expect(form).toContain(
      'className="chart-fields grid md:grid-cols-2 gap-5 mt-5"',
    );
    expect(form).toContain('className="chart-field md:col-span-2"');
    expect(styles).toMatch(
      /\.chart-fields,\s*\.chart-field\s*{\s*min-width:\s*0/,
    );
  });

  it("constrains native date and time controls to the panel width", () => {
    expect(styles).toMatch(
      /\.chart-input-panel input\[type="date"\],\s*\.chart-input-panel input\[type="time"\]\s*{[^}]*inline-size:\s*100%[^}]*min-inline-size:\s*0[^}]*max-inline-size:\s*100%/s,
    );
  });

  it("wraps repeated-clock choices instead of clipping them", () => {
    expect(form).toContain('className="chart-ambiguity__options"');
    expect(styles).toMatch(
      /\.chart-ambiguity__options\s*{[^}]*display:\s*flex[^}]*flex-wrap:\s*wrap/s,
    );
  });
});
