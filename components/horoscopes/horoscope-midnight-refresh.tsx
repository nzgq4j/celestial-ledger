"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { millisecondsUntilNextUtcMidnight } from "@/lib/horoscopes/rollover";

const rolloverBufferMs = 1_500;

export function HoroscopeMidnightRefresh() {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function scheduleNextRollover() {
      timer = setTimeout(() => {
        router.refresh();
        scheduleNextRollover();
      }, millisecondsUntilNextUtcMidnight() + rolloverBufferMs);
    }

    scheduleNextRollover();
    return () => clearTimeout(timer);
  }, [router]);

  return null;
}
