import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sampleBirthInput, sampleChart, sampleIdentity } from "@/lib/samples";
import { sampleNatalInterpretation } from "@/lib/sample-reports/natal-chart";

describe("complete sample natal chart", () => {
  it("uses the requested local birth time and calculates stable chart anchors", async () => {
    expect(sampleBirthInput.date).toBe("1967-05-24");
    expect(sampleBirthInput.time).toBe("08:43");
    expect(sampleBirthInput.place.timeZone).toBe("America/Chicago");
    expect(sampleIdentity.born).toContain("8:43 AM");

    const chart = await sampleChart();

    expect(chart.utc).toBe("1967-05-24T13:43:00.000Z");
    expect(chart.ascendant).toMatchObject({
      sign: "Cancer",
      degree: 14,
      minute: 17,
    });
    expect(chart.midheaven).toMatchObject({
      sign: "Pisces",
      degree: 29,
      minute: 37,
    });
    expect(chart.placements).toHaveLength(11);
    expect(chart.houses).toHaveLength(12);
    expect(chart.aspects.length).toBeGreaterThanOrEqual(15);
  });

  it("publishes the full visual, interpretation and technical appendix", () => {
    const page = readFileSync("app/samples/natal-chart/page.tsx", "utf8");
    const wheel = readFileSync("components/NatalChartWheel.tsx", "utf8");
    const library = readFileSync("lib/sample-reports/library-copy.ts", "utf8");
    const sitemap = readFileSync("app/sitemap.ts", "utf8");
    const llms = readFileSync("app/llms.txt/route.ts", "utf8");

    expect(page).toContain("<NatalChartWheel chart={chart} />");
    expect(page).toContain("<NatalInterpretation");
    expect(page).toContain("Planetary positions");
    expect(page).toContain("House cusps");
    expect(page).toContain("Major aspects");
    expect(page).toContain("Calculation version");
    expect(wheel).toContain("Number(x.toFixed(6))");
    expect(wheel).toContain("Number(y.toFixed(6))");
    expect(library.match(/href: "\/samples\/natal-chart"/g)).toHaveLength(4);
    expect(sitemap).toContain('path: "/samples/natal-chart"');
    expect(llms).toContain("/samples/natal-chart");
  });

  it("contains a substantial nine-chapter interpretation", () => {
    expect(sampleNatalInterpretation.match(/^\d+\. /gm)).toHaveLength(9);
    expect(sampleNatalInterpretation.split(/\s+/).length).toBeGreaterThan(1200);
    expect(sampleNatalInterpretation).toContain("Mercury's close squares");
    expect(sampleNatalInterpretation).toContain("The deeper pattern");
  });
});
