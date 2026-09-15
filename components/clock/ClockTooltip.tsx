"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { ClockExplanation } from "@/lib/clock/explanations";

type ActiveTooltip = {
  id: string;
  explanation: ClockExplanation;
  anchor: DOMRect;
};
type TooltipContext = {
  activeId?: string;
  open: (id: string, explanation: ClockExplanation, element: Element) => void;
  closeSoon: () => void;
  keepOpen: () => void;
};
const Context = createContext<TooltipContext | null>(null);

export function ClockTooltipProvider({
  children,
  resetKey,
}: {
  children: ReactNode;
  resetKey: string;
}) {
  const [active, setActive] = useState<ActiveTooltip | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keepOpen = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const close = useCallback(() => {
    keepOpen();
    setActive(null);
  }, [keepOpen]);
  const closeSoon = () => {
    keepOpen();
    timer.current = setTimeout(() => setActive(null), 200);
  };
  useEffect(() => {
    setActive(null);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [resetKey]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const scroll = (event: Event) => {
      // Scrolling a long tooltip must not dismiss it.
      if (
        event.target instanceof Element &&
        event.target.closest(".clock-tooltip")
      )
        return;
      close();
    };
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest(".clock-hover-target, .clock-tooltip")
      )
        return;
      close();
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("scroll", scroll, true);
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("scroll", scroll, true);
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", close);
    };
  }, [close]);
  return (
    <Context.Provider
      value={{
        activeId: active?.id,
        open: (id, explanation, element) => {
          keepOpen();
          setActive({
            id,
            explanation,
            anchor: element.getBoundingClientRect(),
          });
        },
        closeSoon,
        keepOpen,
      }}
    >
      {children}
      {active &&
        createPortal(
          <TooltipCard
            key={active.id}
            active={active}
            keepOpen={keepOpen}
            closeSoon={closeSoon}
          />,
          document.body,
        )}
    </Context.Provider>
  );
}

function TooltipCard({
  active,
  keepOpen,
  closeSoon,
}: {
  active: ActiveTooltip;
  keepOpen: () => void;
  closeSoon: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 12, top: 12 });
  useLayoutEffect(() => {
    const card = ref.current;
    if (!card) return;
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const a = active.anchor;
    const roomRight = window.innerWidth - a.right;
    const left = roomRight > width + 24 ? a.right + 12 : a.left - width - 12;
    setPosition({
      left: Math.max(12, Math.min(left, window.innerWidth - width - 12)),
      top: Math.max(12, Math.min(a.top - 12, window.innerHeight - height - 12)),
    });
  }, [active]);
  const data = active.explanation;
  return (
    <div
      ref={ref}
      id={active.id}
      role="tooltip"
      className="clock-tooltip"
      style={position}
      data-evidence-id={data.evidenceId}
      onPointerEnter={keepOpen}
      onPointerLeave={closeSoon}
    >
      <p className="clock-tooltip-title">{data.title}</p>
      <p className="clock-tooltip-value">{data.value}</p>
      <p>{data.meaning}</p>
      <p>{data.reading}</p>
      <footer>
        {data.utc && (
          <time dateTime={data.utc}>
            {new Date(data.utc).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "UTC",
            })}{" "}
            UTC
          </time>
        )}
        <span>{data.source}</span>
      </footer>
      <span className="clock-tooltip-hint">Escape to dismiss</span>
    </div>
  );
}

export function ClockTooltipTarget({
  children,
  explanation,
  href,
  onActivate,
  className = "",
}: {
  children: ReactNode;
  explanation: ClockExplanation;
  href?: string;
  onActivate?: () => void;
  className?: string;
}) {
  const context = useContext(Context);
  const id = useId();
  const active = context?.activeId === id;
  const props = {
    className: `clock-hover-target ${className}`,
    "data-active": active ? "true" : undefined,
    "data-evidence-id": explanation.evidenceId,
    "aria-label": `${explanation.title}, ${explanation.value}`,
    "aria-describedby": active ? id : undefined,
    onPointerEnter: (event: React.PointerEvent<Element>) => {
      if (event.pointerType !== "touch")
        context?.open(id, explanation, event.currentTarget);
    },
    onPointerLeave: () => context?.closeSoon(),
    onFocus: (event: React.FocusEvent<Element>) =>
      context?.open(id, explanation, event.currentTarget),
    onBlur: () => context?.closeSoon(),
    onClick: (event: React.MouseEvent<Element>) => {
      if (onActivate) onActivate();
      else context?.open(id, explanation, event.currentTarget);
    },
  };
  return href ? (
    <a {...props} href={href}>
      {children}
    </a>
  ) : (
    <g
      {...props}
      tabIndex={0}
      role="button"
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          context?.open(id, explanation, event.currentTarget);
        }
      }}
    >
      {children}
    </g>
  );
}
