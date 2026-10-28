import type { SupabaseClient } from "@supabase/supabase-js";
/**
 * Browser Supabase client, or null when the deployment has no account
 * backend configured (the site then stays in guest mode). Only the public
 * URL and anon key are used here: every table is protected by RLS, and a
 * service-role key must never reach the browser or the repository.
 */
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
let client: Promise<SupabaseClient | null> | undefined;
/**
 * The SDK (~250 KB) is imported on demand, so guest pages and unconfigured
 * deployments never download it. A failed chunk load can be retried.
 */
export function loadSupabase(): Promise<SupabaseClient | null> {
  if (!supabaseConfig) return Promise.resolve(null);
  const { url, anonKey } = supabaseConfig;
  client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    }),
  );
  client.catch(() => {
    client = undefined;
  });
  return client;
}
