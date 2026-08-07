import { describe, expect, it } from "vitest";
import fs from "node:fs";

describe("daily reading actions", () => {
  it("downloads a native private PDF instead of invoking browser print", () => {
    const actions = fs.readFileSync(
      "components/DailyReadingActions.tsx",
      "utf8",
    );
    const route = fs.readFileSync(
      "app/api/daily-readings/[id]/pdf/route.ts",
      "utf8",
    );
    expect(actions).toContain("Download PDF");
    expect(actions).not.toContain("window.print");
    expect(route).toContain('"Content-Type": "application/pdf"');
    expect(route).toContain('"Content-Disposition"');
    expect(route).toContain("supabase.auth.getClaims()");
    expect(route).toContain('"Cache-Control": "private, no-store, max-age=0"');
  });
});
