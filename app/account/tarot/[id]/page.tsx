import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { savedTarotSchema } from "@/lib/tarot/saved-schema";
import { signedTarotCardFaceUrlsForDeck } from "@/lib/tarot/decks";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { TarotReadingExperience } from "@/components/TarotReadingExperience";
import { DeleteTarotReading } from "@/components/DeleteTarotReading";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Saved tarot reading",
  robots: { index: false, follow: false, nocache: true },
};
export default async function SavedTarotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const client = await createClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) redirect("/auth/login");
  const { data: reading, error } = await client
    .from("tarot_readings")
    .select("payload,deck_id,expires_at")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error("Saved reading could not be loaded");
  if (!reading) notFound();
  const parsed = savedTarotSchema.safeParse(reading.payload);
  if (!parsed.success) notFound();
  const payload = parsed.data;
  try {
    const urls = await signedTarotCardFaceUrlsForDeck(
      reading.deck_id,
      payload.cards.map((card) => card.id),
    );
    payload.cards = payload.cards.map((card) => ({
      ...card,
      faceImageUrl: urls.get(card.id) ?? null,
    }));
  } catch {
    /* Saved meanings remain readable with symbolic artwork. */
  }
  const pack = await getServerTranslationPack();
  const copy = pack.messages.tarot;
  return (
    <main className="page-shell private-library tarot-page">
      <Link href="/account?view=library">{copy.myLibrary}</Link>
      <TarotReadingExperience
        decks={[]}
        readings={[]}
        currentPlan="free"
        locale={pack.tag}
        copy={copy}
        initialResult={{ ...payload, savedReadingId: id, saveStatus: "saved" }}
      />
      <DeleteTarotReading
        id={id}
        label={copy.deleteReading}
        confirmLabel={copy.deleteConfirmation}
        cancelLabel={copy.cancel}
        errorLabel={copy.deleteError}
      />
    </main>
  );
}
