import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const form = readFileSync("components/HoroscopeApp.tsx", "utf8");
const styles = readFileSync("app/styles/atlas-public.css", "utf8");

describe("natal chart mobile form", () => {
  it("keeps the calculator inside the hero at the #chart anchor", () => {
    expect(form).toContain('id="chart"');
    expect(form).toContain('className="home-form"');
    expect(form).toContain('className="home-hero"');
  });

  it("marks form columns as shrinkable layout fields", () => {
    expect(form).toContain('className="home-form__fields"');
    expect(form).toContain('className="atlas-field home-form__field"');
    expect(styles).toMatch(/\.home-form__fields\s*{[^}]*min-width:\s*0/);
    expect(styles).toMatch(/\.home-form__field\s*{\s*min-width:\s*0/);
  });

  it("constrains native date and time controls to the card width", () => {
    expect(styles).toMatch(
      /\.home-form__field input\[type="date"\],\s*\.home-form__field input\[type="time"\]\s*{[^}]*inline-size:\s*100%[^}]*min-inline-size:\s*0[^}]*max-inline-size:\s*100%/s,
    );
  });

  it("wraps repeated-clock choices instead of clipping them", () => {
    expect(form).toContain('className="home-form__ambiguity-options"');
    expect(styles).toMatch(
      /\.home-form__ambiguity-options\s*{[^}]*display:\s*flex[^}]*flex-wrap:\s*wrap/s,
    );
  });

  it("labels every calculator control and shows the resolved birthplace", () => {
    for (const id of ["birth-date", "birth-time", "place"])
      expect(form).toContain(`htmlFor="${id}"`);
    expect(form).toContain('className="home-form__resolved"');
    expect(styles).toMatch(/\.home-form__resolved\s*{[^}]*--atlas-cyan/);
  });
});
