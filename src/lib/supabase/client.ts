// This is the file that lets your entire app talk to Supabase.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// What this does: Every time a client component needs to talk to Supabase — fetch messages, listen to real-time events, get the current user — it calls createClient() from this file to get a Supabase instance.
// The ! at the end of the env variables tells TypeScript "trust me, this exists" — and it does because we set up .env.local already.
