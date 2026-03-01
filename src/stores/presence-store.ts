// src/stores/presence-store.ts
import { create } from "zustand";

type PresenceStore = {
  onlineUserIds: Set<string>;
  setOnlineUserIds: (ids: Set<string>) => void;
};

export const usePresenceStore = create<PresenceStore>((set) => ({
  onlineUserIds: new Set(),
  setOnlineUserIds: (ids) => set({ onlineUserIds: ids }),
}));

// What this does and why:

// onlineUserIds is a Set (not an array) because sets automatically deduplicate — if a user has two tabs open, they still only appear once online
// setOnlineUserIds replaces the whole set on every Presence sync — this is intentional, Supabase Presence's sync event gives you the full current state every time, so replacing is correct
// Any component anywhere in the app can call usePresenceStore to know who's online — no prop drilling needed
