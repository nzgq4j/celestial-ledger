import HoroscopeApp from "@/components/HoroscopeApp";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return <HoroscopeApp />;

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
