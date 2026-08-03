"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function accountNotice(value: string): never {
  redirect(`/account?notice=${encodeURIComponent(value)}#account-settings`);
}

async function authenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) redirect("/auth/login");
  return { supabase, user: data.user };
}

export async function updateDisplayName(formData: FormData) {
  const displayName = formData.get("display_name");
  if (typeof displayName !== "string") accountNotice("invalid_name");
  const normalized = displayName.trim().replace(/\s+/g, " ");
  if (normalized.length < 2 || normalized.length > 50)
    accountNotice("invalid_name");

  const { supabase, user } = await authenticatedUser();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: normalized })
    .eq("id", user.id);
  if (error) accountNotice("name_failed");
  accountNotice("name_updated");
}

export async function changeAccountPassword(formData: FormData) {
  const currentPassword = formData.get("current_password");
  const password = formData.get("password");
  const confirmation = formData.get("password_confirmation");
  if (
    typeof currentPassword !== "string" ||
    typeof password !== "string" ||
    password.length < 12 ||
    password !== confirmation
  )
    accountNotice("invalid_password");

  const { supabase, user } = await authenticatedUser();
  const { error: verificationError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });
  if (verificationError) accountNotice("current_password_failed");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) accountNotice("password_failed");
  accountNotice("password_updated");
}

export async function deleteAccount(formData: FormData) {
  const confirmation = formData.get("confirmation");
  const password = formData.get("current_password");
  if (confirmation !== "DELETE" || typeof password !== "string")
    accountNotice("delete_confirmation_failed");

  const { supabase, user } = await authenticatedUser();
  const { error: verificationError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  });
  if (verificationError) accountNotice("current_password_failed");

  await supabase.auth.signOut({ scope: "global" });
  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) redirect("/auth/login?error=account_deletion_failed");
  redirect("/?account=deleted");
}
