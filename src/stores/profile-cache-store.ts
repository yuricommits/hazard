import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type ProfileCacheStore = {
  cache: Record<string, Profile>;
  pending: Set<string>; // user_ids currently being fetched
  getProfile: (userId: string) => Profile | null;
  fetchProfile: (userId: string) => Promise<Profile | null>;
  seedProfiles: (profiles: Profile[]) => void;
};

export const useProfileCache = create<ProfileCacheStore>((set, get) => ({
  cache: {},
  pending: new Set(),

  getProfile: (userId) => get().cache[userId] ?? null,

  seedProfiles: (profiles) => {
    const entries = Object.fromEntries(profiles.map((p) => [p.id, p]));
    set((s) => ({ cache: { ...s.cache, ...entries } }));
  },

  fetchProfile: async (userId) => {
    const state = get();

    // Already cached
    if (state.cache[userId]) return state.cache[userId];

    // Already fetching — wait for it to resolve by polling briefly
    if (state.pending.has(userId)) {
      await new Promise((r) => setTimeout(r, 150));
      return get().cache[userId] ?? null;
    }

    // Mark as pending
    set((s) => ({ pending: new Set([...s.pending, userId]) }));

    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", userId)
      .single();

    if (data) {
      set((s) => {
        const next = new Set(s.pending);
        next.delete(userId);
        return { cache: { ...s.cache, [userId]: data }, pending: next };
      });
      return data;
    }

    set((s) => {
      const next = new Set(s.pending);
      next.delete(userId);
      return { pending: next };
    });

    return null;
  },
}));
