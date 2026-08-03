import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function createAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL;
  const secretKey =
    process.env.STORAGE_SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey)
    throw new Error("Server-side Supabase configuration is incomplete.");
  return createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
