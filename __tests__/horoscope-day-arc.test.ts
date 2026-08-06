import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const componentSource = readFileSync(
  "components/horoscopes/horoscope-day-arc.tsx",
  "utf8",
);
const stylesheet = readFileSync("app/globals.css", "utf8");

describe("horoscope day arc", () => {
  it("uses the period for fixed timeline geometry instead of reading intensity", () => {
    expect(componentSource).toContain("data-period={part.period}");
    expect(componentSource).not.toContain("--arc-level");
    expect(stylesheet).not.toContain("var(--arc-level)");
  });

  it("keeps every marker the same size and raises afternoon to the apex", () => {
    expect(stylesheet).toMatch(
      /\.horoscope-day-arc__signal > span\s*{[^}]*width: 0\.72rem;[^}]*height: 0\.72rem;/s,
    );
    expect(stylesheet).toMatch(
      /li\[data-period="afternoon"\] \.horoscope-day-arc__signal\s*{\s*transform: translateY\(-1\.4rem\);/s,
    );
    expect(stylesheet).toMatch(
      /\.horoscope-day-arc--compact[\s\S]*li\[data-period="afternoon"\][\s\S]*transform: translateY\(-0\.95rem\);/,
    );
  });
});
