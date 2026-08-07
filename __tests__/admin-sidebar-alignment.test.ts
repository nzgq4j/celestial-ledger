import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("app/globals.css", "utf8");

describe("admin sidebar alignment", () => {
  it("anchors the desktop sidebar to the dashboard top edge", () => {
    const sidebarRule = css.match(
      /\.admin-sidebar \{\n  grid-column: 1;[\s\S]*?\n\}/,
    )?.[0];

    expect(sidebarRule).toContain("align-self: start");
    expect(sidebarRule).toContain("position: sticky");
    expect(sidebarRule).toContain("height: calc(100vh - 4rem)");
    expect(sidebarRule).toContain("overflow-y: auto");
    expect(css).toContain("height: auto;");
    expect(css).toContain("overflow-y: visible;");
  });
});
