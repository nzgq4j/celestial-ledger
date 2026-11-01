// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DailyReadingGenerator } from "@/components/DailyReadingGenerator";
import { MembershipExperience } from "@/components/MembershipExperience";
import { LocaleProvider } from "@/components/LocaleProvider";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));
afterEach(cleanup);
const date = new Date();
const today = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);

describe("membership allowance interface", () => {
  it("shows the selected chart's allowance and only reopens matching saved readings", () => {
    render(
      <LocaleProvider>
        <DailyReadingGenerator
          profiles={[
            { id: "primary", label: "My chart" },
            { id: "companion", label: "Companion chart" },
          ]}
          primaryProfileId="primary"
          allowances={{
            primary: {
              status: "allowance_exhausted",
              allowance: 1,
              remaining: 0,
            },
            companion: { status: "available", allowance: 10, remaining: 8 },
          }}
          existingReadings={[
            {
              id: "saved",
              birth_profile_id: "companion",
              reading_date: today,
              locale: "en-GB",
              generated_at: new Date().toISOString(),
            },
          ]}
        />
      </LocaleProvider>,
    );
    expect(screen.getByRole("status").textContent).toContain("0 / 1 remaining");
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(
      document.querySelector('a.text-link[href="/daily-readings/saved"]'),
    ).toBeNull();
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "companion" },
    });
    expect(screen.getByRole("status").textContent).toContain(
      "8 / 10 remaining",
    );
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(
      false,
    );
    expect(
      document.querySelector('a.text-link[href="/daily-readings/saved"]'),
    ).not.toBeNull();
  });
  it("presents the two membership levels without legacy plan names", () => {
    render(
      <LocaleProvider>
        <MembershipExperience
          signedIn={false}
          subscriptionsEnabled={true}
          availableIntervals={["month", "year"]}
          planId="free"
          provider={null}
          trialEligible={true}
        />
      </LocaleProvider>,
    );
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Atlas" })).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Premium|Personal/);
    expect(screen.queryByText(/delivered by email/i)).toBeNull();
    expect(screen.queryByText(/credit packs/i)).toBeNull();
  });
});
