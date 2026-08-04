import type { Metadata } from "next";
import Script from "next/script";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { LocaleProvider } from "@/components/LocaleProvider";
import "./globals.css";
import { getAdminSettings } from "@/lib/admin/settings";
import { GoogleIntegrations } from "@/components/GoogleIntegrations";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAdminSettings();
  return {
    metadataBase: new URL(settings.seo.canonicalBase),
    title: {
      default: settings.seo.title,
      template: `%s — ${settings.seo.title}`,
    },
    description: settings.seo.description,
    verification: settings.search.verificationToken
      ? { google: settings.search.verificationToken }
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getAdminSettings();
  const organizationJson = settings.geo.enabled
    ? {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Celestial Atlas",
        url: settings.seo.canonicalBase,
        description: settings.geo.organizationDescription,
        sameAs: settings.geo.sameAs,
      }
    : null;
  return (
    <html lang="en-GB" data-theme="dark" suppressHydrationWarning>
      <head>
        <Script src="/preferences-init.js" strategy="beforeInteractive" />
        {organizationJson && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(organizationJson).replaceAll(
                "<",
                "\\u003c",
              ),
            }}
          />
        )}
      </head>
      <body>
        <GoogleIntegrations
          analyticsId={
            settings.analytics.enabled
              ? settings.analytics.measurementId
              : undefined
          }
          recaptchaSiteKey={
            settings.recaptcha.enabled ? settings.recaptcha.siteKey : undefined
          }
        />
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
