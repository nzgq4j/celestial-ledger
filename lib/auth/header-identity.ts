import "server-only";

import { isDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { effectivePlanKeyForUser } from "@/lib/entitlements/server";
import {
  membershipPlanFor,
  type MembershipPlanId,
} from "@/lib/membership/plans";

export type HeaderIdentity = {
  displayName: string;
  email: string;
  plan: MembershipPlanId;
};

export function resolveHeaderDisplayName(
  profileDisplayName: string | null | undefined,
  email: string,
) {
  return profileDisplayName?.trim() || email.split("@")[0] || email;
}

export async function getHeaderIdentity(): Promise<HeaderIdentity | null> {
  if (isDemoMode()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    const email = data?.claims?.email;
    if (error || typeof userId !== "string" || typeof email !== "string")
      return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();
    const planKey = await effectivePlanKeyForUser(userId).catch(() => "free");
    return {
      displayName: resolveHeaderDisplayName(profile?.display_name, email),
      email,
      plan: membershipPlanFor(planKey),
    };
  } catch {
    return null;
  }
}
