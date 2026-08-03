function requiredPublicSetting(name: string, value: string | undefined) {
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function supabasePublicConfig() {
  return {
    url: requiredPublicSetting(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    publishableKey: requiredPublicSetting(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  };
}

export function isDemoMode() {
  return (
    process.env.VERCEL_ENV === "preview" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  );
}
