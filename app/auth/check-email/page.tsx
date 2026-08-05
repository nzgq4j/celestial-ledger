import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata(
  "Verify your email — Celestial Atlas",
);

export default function CheckEmailPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 py-16">
      <section className="panel p-6 md:p-8">
        <h1 className="text-3xl font-semibold gold">Check your email</h1>
        <p className="mt-3 text-[#ddd6c8]">
          Follow the verification link to open your private Celestial Atlas and
          begin collecting the patterns written across your sky.
        </p>
      </section>
    </main>
  );
}
