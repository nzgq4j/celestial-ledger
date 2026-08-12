import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("daily horoscope rollover", () => {
  it("retries hourly and protects the rollover endpoint", () => {
    const vercelConfig = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
    expect(vercelConfig.crons).toContainEqual({
      path: "/api/internal/horoscope-rollover",
      schedule: "0 * * * *",
    });

    const route = fs.readFileSync(
      "app/api/internal/horoscope-rollover/route.ts",
      "utf8",
    );
    expect(route).toContain("process.env.CRON_SECRET");
    expect(route).toContain("authorization");
    expect(route).toContain('timeZone: "UTC"');
    expect(route).toContain('revalidatePath("/horoscopes")');
    expect(route).toContain("opengraph-image");
    expect(route).toContain("pinterest-image");
  });

  it("refreshes open horoscope pages at the next GMT boundary", () => {
    const refresh = fs.readFileSync(
      "components/horoscopes/horoscope-midnight-refresh.tsx",
      "utf8",
    );
    const indexPage = fs.readFileSync("app/horoscopes/page.tsx", "utf8");
    const detailPage = fs.readFileSync(
      "app/horoscopes/[sign]/page.tsx",
      "utf8",
    );
    expect(refresh).toContain("millisecondsUntilNextUtcMidnight");
    expect(refresh).toContain("router.refresh()");
    expect(indexPage).toContain("<HoroscopeMidnightRefresh />");
    expect(detailPage).toContain("<HoroscopeMidnightRefresh />");
  });
});
