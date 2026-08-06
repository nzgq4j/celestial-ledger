import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "How Celestial Atlas protects account information, birth data, natal charts, private readings, purchases, and marketing preferences.",
  path: "/privacy",
  keywords: ["astrology privacy", "birth data privacy"],
});

export default function PrivacyPage() {
  return (
    <main className="legal-page page-shell">
      <p className="eyebrow">Celestial Atlas</p>
      <h1>Privacy policy</h1>
      <p>
        When you contact us, we store your name, email address, contact reason,
        and message privately so authorised administrators can respond. A
        notification is sent to the administrative mailbox. Do not include birth
        data, passwords, or payment card details in a contact message.
      </p>
      <p>Last updated: 6 August 2026</p>
      <h2>Free chart and mailing list</h2>
      <p>
        Birth information is used to calculate the chart you request. It is not
        added to the marketing list. If you separately opt in to Celestial Atlas
        emails, the marketing list stores your name, email address, consent
        version, source, and timestamps.
      </p>
      <h2>Accounts and private reports</h2>
      <p>
        Account records, saved birth profiles, purchases, report evidence, and
        private reports are stored separately from the marketing list. Creating
        or deleting an account does not silently change marketing consent.
      </p>
      <h2>Your choices</h2>
      <p>
        You may unsubscribe from marketing messages using the link provided in
        each message. Account holders can delete saved profiles, reports, or
        their account. Minimized transaction records may be retained where
        legally required.
      </p>
      <h2>Service providers</h2>
      <p>
        Celestial Atlas uses Vercel for application hosting, Supabase for
        authentication and data storage, Stripe for payments, and OpenAI for
        constrained report interpretation. Sensitive server credentials are not
        exposed to browsers.
      </p>
    </main>
  );
}
