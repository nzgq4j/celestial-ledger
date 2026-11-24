import { redirect } from "next/navigation";
import HoroscopeApp from "@/components/HoroscopeApp";
import { createClient } from "@/lib/supabase/server";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({
  title: "Free Birth Chart & Personal Astrology Readings",
  description:
    "Create your natal chart, explore daily and weekly astrology, and follow planetary transits through private, evidence-linked Celestial Atlas readings.",
  path: "/",
  keywords: ["free birth chart", "personal natal chart", "astrology reading"],
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ chart?: string | string[] }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return <HoroscopeApp />;
  // Signed-in members land on Today, as in the Celestial Atlas app. Links that
  // add a chart pass ?chart=new to reach the calculator on this page.
  if ((await searchParams).chart !== "new") redirect("/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .maybeSingle();
  const metadataName = data.user.user_metadata.full_name;
  const displayName =
    profile?.display_name?.trim() ||
    (typeof metadataName === "string" ? metadataName.trim() : "") ||
    data.user.email?.split("@")[0] ||
    "Explorer";

  return <HoroscopeApp account={{ displayName }} />;
}
