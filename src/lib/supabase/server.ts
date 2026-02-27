// This file is for server components, server actions, and API routes:

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );
}

// What this does: Server components in Next.js don't have access to the browser — no window, no localStorage. So Supabase needs to read and write the user's session through cookies instead. That's what this file handles.
// The cookies() from next/headers reaches into the incoming request, reads the session cookie, and passes it to Supabase so it knows who's logged in — all on the server, before anything reaches the browser.
// The empty try/catch on setAll is intentional — server components can read cookies but not always write them, so we silently ignore that case.
