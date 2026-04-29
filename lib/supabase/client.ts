import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey && url !== "" && anonKey !== "");
}

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured()
  ? createClient<Database>(url, anonKey)
  : null;

/**
 * Returns the supabase client typed as `any` for flexible usage in
 * context files that build their own type-safe row mappers.
 * Only call this when isSupabaseConfigured() is true.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: SupabaseClient<any> | null = supabase as SupabaseClient<any> | null;

export function createAuthenticatedClient(
  walletAddress: string
): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) return null;
  return createClient<Database>(url, anonKey, {
    global: {
      headers: {
        "x-wallet-address": walletAddress,
      },
    },
  });
}

