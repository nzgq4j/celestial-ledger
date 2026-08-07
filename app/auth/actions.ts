"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/config";

function credentials(formData: FormData, errorPath: string) {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string") {
    redirect(`${errorPath}?error=invalid_credentials`);
  }
  return { email: email.trim(), password };
}

function canonicalAppUrl() {
  if (process.env.VERCEL_ENV === "production") {
    return "https://www.celestialatlas.app";
  }
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  return "https://www.celestialatlas.app";
}

async function continueWithGoogle(errorPath: string) {
  if (isDemoMode()) redirect(`${errorPath}?error=preview_disabled`);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${canonicalAppUrl()}/auth/callback`,
    },
  });
  if (error || !data.url) redirect(`${errorPath}?error=oauth_failed`);
  redirect(data.url);
}

export async function signInWithGoogle() {
  return continueWithGoogle("/auth/login");
}

export async function createAccountWithGoogle() {
  return continueWithGoogle("/auth/create-account");
}

export async function signIn(formData: FormData) {
  if (isDemoMode()) redirect("/auth/login?error=preview_disabled");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(
    credentials(formData, "/auth/login"),
  );
  if (error) redirect("/auth/login?error=sign_in_failed");
  redirect("/account");
}

export async function signUp(formData: FormData) {
  if (isDemoMode()) redirect("/auth/create-account?error=preview_disabled");
  const supabase = await createClient();
  const signupCredentials = credentials(formData, "/auth/create-account");
  if (signupCredentials.password.length < 12)
    redirect("/auth/create-account?error=weak_password");
  const { error } = await supabase.auth.signUp({
    ...signupCredentials,
    options: {
      emailRedirectTo: canonicalAppUrl(),
    },
  });
  if (error) redirect("/auth/create-account?error=sign_up_failed");
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
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${canonicalAppUrl()}/auth/confirm?next=/auth/update-password`,
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
