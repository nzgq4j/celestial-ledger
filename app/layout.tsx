import type { Metadata } from "next";
import Script from "next/script";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { LocaleProvider } from "@/components/LocaleProvider";
import "./globals.css";
import { getAdminSettings } from "@/lib/admin/settings";
import { GoogleIntegrations } from "@/components/GoogleIntegrations";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { StructuredData } from "@/components/StructuredData";
import {
  coreKeywords,
  DEFAULT_SOCIAL_IMAGE,
  localizedAlternates,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAdminSettings();
  return {
    metadataBase: new URL(settings.seo.canonicalBase),
    title: {
      default: settings.seo.title,
      template: `%s — ${settings.seo.title}`,
    },
    description: settings.seo.description,
    keywords: [...coreKeywords],
    alternates: { canonical: "/", languages: localizedAlternates("/") },
    openGraph: {
      type: "website",
      url: "/",
      siteName: "Celestial Atlas",
      title: settings.seo.title,
      description: settings.seo.description,
      locale: "en_US",
      alternateLocale: ["es_ES", "fr_FR", "de_DE"],
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE,
          width: 1200,
          height: 630,
          alt: "Celestial Atlas — ancient sky, personal atlas",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.seo.title,
      description: settings.seo.description,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    robots: settings.seo.indexingEnabled
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : { index: false, follow: false },
    verification: settings.search.verificationToken
      ? { google: settings.search.verificationToken }
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [settings, pack] = await Promise.all([
    getAdminSettings(),
    getServerTranslationPack(),
  ]);
  const organizationJson = settings.geo.enabled
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${settings.seo.canonicalBase}/#organization`,
            name: "Celestial Atlas",
            url: settings.seo.canonicalBase,
            logo: `${settings.seo.canonicalBase}/icon.png`,
            description: settings.geo.organizationDescription,
            sameAs: settings.geo.sameAs,
          },
          {
            "@type": "WebSite",
            "@id": `${settings.seo.canonicalBase}/#website`,
            name: "Celestial Atlas",
            alternateName: "Celestial Atlas Astrology",
            url: settings.seo.canonicalBase,
            inLanguage: ["en", "es", "fr", "de"],
            publisher: {
              "@id": `${settings.seo.canonicalBase}/#organization`,
            },
          },
        ],
      }
    : null;
  return (
    <html
      lang={pack.tag}
      dir={pack.direction}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <Script src="/preferences-init.js" strategy="beforeInteractive" />
        {organizationJson && <StructuredData data={organizationJson} />}
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
        <LocaleProvider initialLocale={pack.tag} initialPack={pack}>
          <div className="meridian" aria-hidden="true" />
          <SiteHeader />
          {children}
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
