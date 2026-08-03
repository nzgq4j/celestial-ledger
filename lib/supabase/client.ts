import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabasePublicConfig } from "./config";

export function createClient() {
  const { url, publishableKey } = supabasePublicConfig();
  return createBrowserClient<Database>(url, publishableKey);
}
