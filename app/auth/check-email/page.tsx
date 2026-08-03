export const metadata = { title: "Verify your email — Celestial Atlas" };

export default function CheckEmailPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 py-16">
      <section className="panel p-6 md:p-8">
        <h1 className="text-3xl font-semibold gold">Check your email</h1>
        <p className="mt-3 text-[#ddd6c8]">
          Use the verification link from Supabase before signing in. No private
          report data is available until your email is verified.
        </p>
      </section>
    </main>
  );
}
