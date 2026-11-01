// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  fillCopy,
  memberCopy,
  moonPhaseIndex,
  moonPhaseNames,
} from "@/lib/account/member-copy";
import { bodyGlyph, signGlyph } from "@/lib/account/astro-glyphs";
import { ChartDataTabs } from "@/components/account/ChartDataTabs";

afterEach(cleanup);

describe("member copy", () => {
  it("defines every key in every locale and never names a retired plan", () => {
    const keys = Object.keys(memberCopy["en-GB"]).sort();
    for (const copy of Object.values(memberCopy)) {
      expect(Object.keys(copy).sort()).toEqual(keys);
      for (const value of Object.values(copy)) {
        expect(value.trim()).not.toBe("");
        expect(value).not.toMatch(/\bPremium\b/);
      }
    }
    for (const names of Object.values(moonPhaseNames))
      expect(names).toHaveLength(8);
  });

  it("fills placeholders and leaves unknown ones visible", () => {
    expect(fillCopy("{a} of {b}", { a: 7, b: 10 })).toBe("7 of 10");
    expect(fillCopy("{a} {missing}", { a: 1 })).toBe("1 {missing}");
  });

  it("maps the Sun–Moon elongation onto the eight principal phases", () => {
    expect(moonPhaseIndex(0)).toBe(0);
    expect(moonPhaseIndex(359)).toBe(0);
    expect(moonPhaseIndex(90)).toBe(2);
    expect(moonPhaseIndex(135)).toBe(3);
    expect(moonPhaseIndex(180)).toBe(4);
    expect(moonPhaseIndex(-90)).toBe(6);
  });

  it("renders astrological glyphs in text presentation", () => {
    expect(bodyGlyph("Sun")).toBe("☉︎");
    expect(signGlyph("Scorpio")).toBe("♏︎");
    expect(bodyGlyph("Ascendant")).toBeUndefined();
  });
});

describe("chart data tabs", () => {
  it("switches panels by click and arrow keys with correct tab semantics", () => {
    render(
      <ChartDataTabs
        label="Chart data"
        tabs={[
          {
            id: "planets",
            label: "Planets",
            empty: "",
            rows: [
              {
                key: "Sun",
                glyph: "☉︎",
                name: "Sun",
                value: "22°14′ ♏︎",
                valueLabel: "22°14′ Scorpio",
                note: "House 12",
              },
            ],
          },
          {
            id: "houses",
            label: "Houses",
            empty: "Needs a birth time.",
            rows: [],
          },
        ]}
      />,
    );
    const [planets, houses] = screen.getAllByRole("tab");
    expect(planets.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("22°14′ Scorpio")).toBeTruthy();
    fireEvent.keyDown(planets, { key: "ArrowRight" });
    expect(houses.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Needs a birth time.")).toBeTruthy();
    fireEvent.click(planets);
    expect(planets.getAttribute("aria-selected")).toBe("true");
  });
});
