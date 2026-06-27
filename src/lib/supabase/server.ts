import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types.gen";

// Server-only Supabase client.
//
// Reads/writes go through here so a secret key (and therefore private phone
// numbers) never reach the browser. We prefer a secret/service-role key when
// present (it bypasses RLS, so all writes are server-controlled). Otherwise we
// fall back to the publishable/anon key — the app still works because RLS
// allows inserts and the public_* views expose only non-sensitive columns.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Server-side secret key (new `sb_secret_...` format or legacy service-role JWT).
const secretKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Public client key (new `sb_publishable_...` format or legacy anon JWT).
const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cached: SupabaseClient<Database> | null = null;

// True when a secret/service-role key is configured — writes bypass RLS and we
// can read back inserted rows.
export function hasSecretKey(): boolean {
  return Boolean(secretKey);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(url && (secretKey || publicKey));
}

export function getServerSupabase(): SupabaseClient<Database> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY (o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)."
    );
  }
  if (cached) return cached;
  cached = createClient<Database>(url!, (secretKey || publicKey)!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
