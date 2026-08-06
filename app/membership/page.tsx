import { MembershipExperience } from "@/components/MembershipExperience";
import { createClient } from "@/lib/supabase/server";
import { createPageMetadata } from "@/lib/seo";
import { commerceFlags } from "@/lib/commerce/flags";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Astrology Membership Plans",
  description:
    "Compare Celestial Atlas Free, Personal and Premium membership levels for natal charts, daily readings, weekly guidance and detailed reports.",
  path: "/membership",
  keywords: ["astrology membership", "daily astrology readings"],
});

export default async function MembershipPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return (
    <MembershipExperience
      signedIn={Boolean(data.user)}
      subscriptionsEnabled={commerceFlags().subscriptions}
    />
  );
}
