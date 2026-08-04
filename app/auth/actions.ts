"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/config";

function credentials(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string") {
    redirect("/auth/login?error=invalid_credentials");
  }
  return { email: email.trim(), password };
}

function canonicalAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  return "https://www.celestialatlas.app";
}

export async function signInWithGoogle() {
  if (isDemoMode()) redirect("/auth/login?error=preview_disabled");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${canonicalAppUrl()}/auth/callback?next=/account`,
    },
  });
  if (error || !data.url) redirect("/auth/login?error=oauth_failed");
  redirect(data.url);
}

export async function signIn(formData: FormData) {
  if (isDemoMode()) redirect("/auth/login?error=preview_disabled");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(
    credentials(formData),
  );
  if (error) redirect("/auth/login?error=sign_in_failed");
  redirect("/account");
}

export async function signUp(formData: FormData) {
  if (isDemoMode()) redirect("/auth/login?error=preview_disabled");
  const supabase = await createClient();
  const signupCredentials = credentials(formData);
  if (signupCredentials.password.length < 12)
    redirect("/auth/login?error=weak_password");
  const displayName = formData.get("display_name");
  const normalizedName =
    typeof displayName === "string" ? displayName.trim().slice(0, 50) : "";
  const { error } = await supabase.auth.signUp({
    ...signupCredentials,
    options: {
      emailRedirectTo: canonicalAppUrl(),
      data: normalizedName.length >= 2 ? { display_name: normalizedName } : {},
    },
  });
  if (error) redirect("/auth/login?error=sign_up_failed");
  redirect("/auth/check-email");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  if (isDemoMode()) redirect("/auth/login?error=preview_disabled");
  const email = formData.get("email");
  if (typeof email !== "string" || !email.trim())
    redirect("/auth/forgot-password?error=invalid_email");
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  if (!host) redirect("/auth/forgot-password?error=reset_failed");
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${protocol}://${host}/auth/confirm?next=/auth/update-password`,
  });
  redirect("/auth/forgot-password?sent=true");
}

export async function updatePassword(formData: FormData) {
  if (isDemoMode()) redirect("/auth/login?error=preview_disabled");
  const password = formData.get("password");
  if (typeof password !== "string" || password.length < 12)
    redirect("/auth/update-password?error=weak_password");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/auth/update-password?error=update_failed");
  redirect("/account?password=updated");
}
