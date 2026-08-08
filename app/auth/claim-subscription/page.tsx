import type { Metadata } from "next";
import Link from "next/link";
import { SubscriptionClaimStatus } from "@/components/SubscriptionClaimStatus";

export const metadata: Metadata = {
  title: "Confirming membership — Celestial Atlas",
  robots: { index: false, follow: false },
};

export default async function ClaimSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sessionId = (await searchParams).session_id;
  return (
    <main className="auth-page">
      <section className="auth-panel subscription-claim-panel">
        <p className="section-kicker">Your atlas is opening</p>
        <h1>Bringing your chart into focus</h1>
        {sessionId ? (
          <SubscriptionClaimStatus sessionId={sessionId} />
        ) : (
          <>
            <p>The checkout return could not be verified.</p>
            <Link href="/membership" className="button-primary">
              Return to membership
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
