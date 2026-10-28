import { createClient, type SupabaseClient } from "@supabase/supabase-js";
/**
 * Browser Supabase client, or null when the deployment has no account
 * backend configured (the site then stays in guest mode). Only the public
 * URL and anon key are used here: every table is protected by RLS, and a
 * service-role key must never reach the browser or the repository.
 */
let client: SupabaseClient | null | undefined;
export function readSupabaseConfig(env: {
  url?: string;
  anonKey?: string;
}): { url: string; anonKey: string } | null {
  const url = env.url?.trim(),
    anonKey = env.anonKey?.trim();
  if (!url || !anonKey) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost")
      return null;
  } catch {
    return null;
  }
  return { url: url.replace(/\/+$/, ""), anonKey };
}
export const supabaseConfig = readSupabaseConfig({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  client = supabaseConfig
    ? createClient(supabaseConfig.url, supabaseConfig.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
        },
      })
    : null;
  return client;
}
