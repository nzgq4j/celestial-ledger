"use client";

import Link from "next/link";
import { SitePreferences } from "@/components/SitePreferences";
import { useLocale } from "@/components/LocaleProvider";

/**
 * The site footer's links and language picker, shown in Account settings.
 * On phones and in the Android app the footer is hidden for members, so this
 * is where they find the journal, method, legal pages and language.
 */
export function SiteLinksSection() {
  const { pack } = useLocale();
  const footer = pack.messages.footer;
  const nav = pack.messages.navigation;
  return (
    <section
      className="atlas-card member-site-links"
      aria-labelledby="member-site-links-title"
    >
      <h2 id="member-site-links-title" className="member-site-links__title">
        {footer.trust}
      </h2>
      <nav className="member-site-links__list" aria-label={footer.trust}>
        <Link href="/journal">{nav.journal}</Link>
        <Link href="/method">{footer.method}</Link>
        <Link href="/privacy">{footer.privacy}</Link>
        <Link href="/terms">{footer.terms}</Link>
        <Link href="/contact">{nav.contact}</Link>
      </nav>
      <div className="member-site-links__language">
        <span>{footer.language}</span>
        <SitePreferences />
      </div>
      <p className="member-site-links__colophon">
        © {new Date().getFullYear()} Celestial Atlas
      </p>
    </section>
  );
}
