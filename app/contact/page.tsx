import { ContactForm } from "@/components/ContactForm";
import "@/app/styles/atlas-public.css";

export const metadata = { title: "Contact — Celestial Atlas" };

export default function ContactPage() {
  return (
    <main className="atlas-shell public-page public-contact">
      <header className="public-page__hero">
        <p className="atlas-kicker">Contact Celestial Atlas</p>
        <h1 className="atlas-page-title">How can we help?</h1>
        <p>
          Send a question about your account, billing, privacy, technical
          support, or a potential partnership.
        </p>
      </header>
      <ContactForm />
      <p className="public-note">
        Your message is stored privately for support and shown only to
        authorised administrators. Do not include birth data, passwords, payment
        card details, or urgent crisis information.
      </p>
    </main>
  );
}
