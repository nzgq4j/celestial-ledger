"use client";

import { useEffect } from "react";
import { appPlatformFromWindow } from "@/lib/app-shell/detect";

/**
 * Client-side fallback for app mode. The server already sets
 * `<html data-app="android">` when the Capacitor shell's user-agent token is
 * present; this covers WebViews where the token is missing.
 */
export function AppShell() {
  useEffect(() => {
    const platform = appPlatformFromWindow();
    if (platform && document.documentElement.dataset.app !== platform)
      document.documentElement.dataset.app = platform;
  }, []);
  return null;
}
