import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import type { Database } from "./database.types";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
// New publishable key first, legacy anon key as the fallback. Both are baked in
// at build time, so a key change needs a new app build.
const anonKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY — copy mobile/.env.example to mobile/.env"
  );
}

export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? "https://tintnotes.com";
export const TURNSTILE_SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY ?? "";

// The phone talks to Supabase directly under RLS with the public anon key +
// the user's JWT — the same policies the website runs under. Sessions live in
// AsyncStorage (SecureStore caps values at 2 KB, smaller than a session).
export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});

// Refresh tokens only while the app is in the foreground.
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

export function publicUrl(bucket: "installer-note-media" | "profile-pictures", path: string) {
  return `${url}/storage/v1/object/public/${bucket}/${path}`;
}
