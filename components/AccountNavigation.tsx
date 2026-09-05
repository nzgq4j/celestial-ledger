"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AccountNavigation({
  view,
  copy,
  admin,
  adminLabel,
}: {
  view: string;
  copy: Record<string, string>;
  admin: boolean;
  adminLabel: string;
}) {
  const router = useRouter();
  useEffect(() => {
    function restoreLegacyLink() {
      const hash = window.location.hash.slice(1);
      const target = hash.startsWith("report-")
        ? "library"
        : (
            {
              reports: "create",
              readings: "create",
              "daily-reading": "create",
              "weekly-reading": "create",
              "tarot-daily-draw": "create",
              "birth-profiles": "charts",
              billing: "membership",
              "account-settings": "settings",
            } as Record<string, string>
          )[hash];
      if (target && target !== view)
        router.replace(`/account?view=${target}${window.location.hash}`);
    }
    restoreLegacyLink();
    window.addEventListener("hashchange", restoreLegacyLink);
    return () => window.removeEventListener("hashchange", restoreLegacyLink);
  }, [router, view]);
  return (
    <nav className="account-jump-links" aria-label={copy.overview}>
      {[
        "overview",
        "library",
        "create",
        "charts",
        "membership",
        "settings",
      ].map((key) => (
        <Link
          key={key}
          href={key === "overview" ? "/account" : `/account?view=${key}`}
          aria-current={view === key ? "page" : undefined}
        >
          {copy[key]}
        </Link>
      ))}
      {admin && <Link href="/admin">{adminLabel}</Link>}
    </nav>
  );
}
