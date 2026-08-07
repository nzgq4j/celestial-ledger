"use client";

import { useEffect, useState } from "react";

type AdminTheme = "dark" | "light";

const storageKey = "celestial-atlas-admin-theme";

export function AdminThemeToggle() {
  const [theme, setTheme] = useState<AdminTheme>("dark");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    const initialTheme: AdminTheme = saved === "light" ? "light" : "dark";
    setTheme(initialTheme);
    document.documentElement.dataset.adminTheme = initialTheme;
    return () => {
      delete document.documentElement.dataset.adminTheme;
    };
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
    document.documentElement.dataset.adminTheme = nextTheme;
  }

  return (
    <button
      type="button"
      className="admin-theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      <span className="admin-theme-toggle__track" aria-hidden="true">
        <i />
      </span>
      <span>{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
