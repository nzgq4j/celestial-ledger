import { privatePageMetadata } from "@/lib/seo";
import "@/app/styles/atlas-public.css";

export const metadata = privatePageMetadata(
  "Verify your email — Celestial Atlas",
);

export default function CheckEmailPage() {
  return (
    <main className="auth-page">
      <section className="panel atlas-auth">
        <h1 className="atlas-auth__title">Check your email</h1>
        <p className="atlas-auth__copy">
          Follow the verification link to open your private Celestial Atlas and
          begin collecting the patterns written across your sky.
        </p>
      </section>
    </main>
  );
}
