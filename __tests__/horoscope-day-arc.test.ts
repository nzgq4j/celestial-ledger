import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const componentSource = readFileSync(
  "components/horoscopes/horoscope-day-arc.tsx",
  "utf8",
);
const stylesheet = readFileSync("app/styles/atlas-public.css", "utf8");

describe("horoscope day arc", () => {
  it("keys each row by its period instead of reading intensity", () => {
    expect(componentSource).toContain("data-period={part.period}");
    expect(componentSource).not.toContain("--arc-level");
    expect(componentSource).not.toContain("part.level");
    expect(stylesheet).not.toContain("var(--arc-level)");
  });

  it("lays out morning, midday and evening as labelled rows", () => {
    expect(stylesheet).toMatch(
      /\.sign-arc li\s*{[^}]*grid-template-columns: 6rem minmax\(0, 1fr\);/s,
    );
    expect(stylesheet).toMatch(/\.sign-arc__when\s*{[^}]*--atlas-gold/s);
    expect(componentSource).toContain(
      "{!compact && <span>{part.guidance}</span>}",
    );
  });
});
