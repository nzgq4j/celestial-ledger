// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  ClockTooltipProvider,
  ClockTooltipTarget,
} from "@/components/clock/ClockTooltip";
import { explainPlanet } from "@/lib/clock/explanations";
import { calculateClock } from "@/lib/clock/calculation";

const snapshot = calculateClock("2026-09-15T12:00:00.000Z");
const explanation = explainPlanet(snapshot.planets[0], snapshot);
function Example({
  version = "one",
  onActivate,
}: {
  version?: string;
  onActivate?: () => void;
}) {
  return (
    <ClockTooltipProvider resetKey={version}>
      <svg>
        <ClockTooltipTarget
          explanation={explanation}
          href={onActivate ? "#details" : undefined}
          onActivate={onActivate}
        >
          <circle r={8} />
        </ClockTooltipTarget>
      </svg>
    </ClockTooltipProvider>
  );
}
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe("clock explanatory tooltips", () => {
  it("highlights on hover and associates the explanation with its evidence", () => {
    const select = vi.fn();
    render(<Example onActivate={select} />);
    const target = screen.getByRole("link");
    fireEvent.pointerEnter(target);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.textContent).toContain("not a compass direction");
    expect(tooltip.getAttribute("data-evidence-id")).toBe(
      explanation.evidenceId,
    );
    expect(target.getAttribute("aria-describedby")).toBe(tooltip.id);
    expect(target.getAttribute("data-active")).toBe("true");
    expect(select).not.toHaveBeenCalled();
    fireEvent.click(target);
    expect(select).toHaveBeenCalledOnce();
  });
  it("opens on keyboard focus and dismisses with Escape", () => {
    render(<Example />);
    const target = screen.getByRole("button");
    fireEvent.focus(target);
    expect(screen.getByRole("tooltip")).toBeTruthy();
    fireEvent.keyDown(target, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(target.hasAttribute("aria-describedby")).toBe(false);
    fireEvent.keyDown(target, { key: "Enter" });
    expect(screen.getByRole("tooltip")).toBeTruthy();
  });
  it("allows moving into the tooltip to read it, then dismisses after leaving", () => {
    vi.useFakeTimers();
    render(<Example />);
    const target = screen.getByRole("button");
    fireEvent.pointerEnter(target);
    fireEvent.pointerLeave(target);
    fireEvent.pointerEnter(screen.getByRole("tooltip"));
    act(() => vi.advanceTimersByTime(250));
    expect(screen.getByRole("tooltip")).toBeTruthy();
    fireEvent.pointerLeave(screen.getByRole("tooltip"));
    act(() => vi.advanceTimersByTime(250));
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
  it("opens on tap and clears stale explanations when the calculation changes", () => {
    const view = render(<Example />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("tooltip")).toBeTruthy();
    view.rerender(<Example version="two" />);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
