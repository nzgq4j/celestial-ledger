// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { calculateClock } from "@/lib/clock/calculation";
import { CelestialClock } from "@/components/clock/CelestialClock";

const initial = calculateClock("2026-09-15T12:00:00.000Z");
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("clock accessible interactions", () => {
  it("requests the chosen leap-day instant and replaces the visible calculation", async () => {
    const mock = vi.fn().mockImplementation(async (url: string) => {
      const at = new URL(url, "https://example.com").searchParams.get("at")!;
      return Response.json(calculateClock(at));
    });
    vi.stubGlobal("fetch", mock);
    render(<CelestialClock initial={initial} />);
    fireEvent.input(screen.getByLabelText("Date and time (UTC)"), {
      target: { value: "2024-02-29T12:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Explore" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(
        "29 Feb 2024, 12:00 UTC",
      ),
    );
    expect(
      mock.mock.calls.some(([url]) =>
        decodeURIComponent(url).includes("2024-02-29T12:00:00.000Z"),
      ),
    ).toBe(true);
  });
  it("exposes named date controls, planetary buttons and calculation details", () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(initial)));
    render(<CelestialClock initial={initial} />);
    expect(screen.getByLabelText("Date and time (UTC)")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back to now" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Mercury.*Direct/ }));
    expect(screen.getByRole("heading", { name: "Mercury" })).toBeTruthy();
    expect(screen.getByText(/apparent motion is forwards/)).toBeTruthy();
    expect(screen.getByText(/does not use birth details/)).toBeTruthy();
  });
  it("keeps a failed date change explicitly marked and retryable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<CelestialClock initial={initial} />);
    fireEvent.change(screen.getByLabelText("Date and time (UTC)"), {
      target: { value: "2024-02-29T12:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Explore" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(
        "last calculated view",
      ),
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "The planetary register" }),
    ).toBeTruthy();
  });
});
