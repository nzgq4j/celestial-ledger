import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const adminRoles = [
  "site_admin",
  "user_admin",
  "content_admin",
  "analyst",
] as const;
export type AdminRole = (typeof adminRoles)[number];

export async function getAdminIdentity() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: assignment } = await createAdminClient()
    .from("admin_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!assignment || !adminRoles.includes(assignment.role as AdminRole))
    return null;
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    role: assignment.role as AdminRole,
  };
}

export async function requireAdmin(allowed: readonly AdminRole[] = adminRoles) {
  const identity = await getAdminIdentity();
  if (!identity) redirect("/account");
  if (!allowed.includes(identity.role)) redirect("/admin?notice=forbidden");
  return identity;
}

export async function isAdmin() {
  return Boolean(await getAdminIdentity());
}
