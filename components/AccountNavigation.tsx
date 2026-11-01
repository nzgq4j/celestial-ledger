"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Secondary account navigation. The header and the bottom tab bar carry the
 * main member screens (Today, My chart, Library); this chip row links the
 * account-management views to each other, and keeps old `#hash` links
 * working by mapping them onto `?view=`.
 */
export function AccountNavigation({
  view,
  copy,
  admin,
  adminLabel,
}: {
  view: string;
  copy: {
    label: string;
    settings: string;
    membership: string;
    create: string;
  };
  admin: boolean;
  adminLabel: string;
}) {
  const router = useRouter();
  useEffect(() => {
    function restoreLegacyLink() {
      // A freshly queued report lands on the library with `focusReport`;
      // its `#reports` anchor must not be remapped to the create view.
      if (new URLSearchParams(window.location.search).has("focusReport"))
        return;
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
  if (!["settings", "membership", "create"].includes(view)) return null;
  return (
    <nav className="member-tabs" aria-label={copy.label}>
      {(["settings", "membership", "create"] as const).map((key) => (
        <Link
          key={key}
          href={`/account?view=${key}`}
          className="atlas-chip"
          aria-current={view === key ? "page" : undefined}
        >
          {copy[key]}
        </Link>
      ))}
      {admin && (
        <Link href="/admin" className="atlas-chip">
          {adminLabel}
        </Link>
      )}
    </nav>
  );
}
