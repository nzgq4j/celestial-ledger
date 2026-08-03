import type { Metadata } from "next";
import Script from "next/script";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { LocaleProvider } from "@/components/LocaleProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Celestial Atlas — Personal Astrology Reports",
  description:
    "Discover the planetary patterns, hidden correspondences, and ancient celestial wisdom held within your personal birth chart.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" data-theme="dark" suppressHydrationWarning>
      <head>
        <Script src="/preferences-init.js" strategy="beforeInteractive" />
      </head>
      <body>
        <LocaleProvider>
          <div className="meridian" aria-hidden="true" />
          <SiteHeader />
          {children}
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
