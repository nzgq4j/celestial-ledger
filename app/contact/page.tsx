import { ContactForm } from "@/components/ContactForm";

export const metadata = { title: "Contact — Celestial Atlas" };

export default function ContactPage() {
  return (
    <main className="page-shell contact-page">
      <header>
        <p className="eyebrow">Contact Celestial Atlas</p>
        <h1>How can we help?</h1>
        <p>
          Send a question about your account, billing, privacy, technical
          support, or a potential partnership.
        </p>
      </header>
      <ContactForm />
      <p className="contact-page__privacy">
        Your message is stored privately for support and shown only to
        authorised administrators. Do not include birth data, passwords, payment
        card details, or urgent crisis information.
      </p>
    </main>
  );
}
