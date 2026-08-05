import { MembershipExperience } from "@/components/MembershipExperience";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Membership",
  description:
    "Compare Celestial Atlas Free, Personal and Premium membership levels for natal charts, daily readings, weekly guidance and detailed reports.",
};

export default async function MembershipPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return <MembershipExperience signedIn={Boolean(data.user)} />;
}
