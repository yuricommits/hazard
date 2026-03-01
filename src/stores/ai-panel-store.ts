import { create } from "zustand";

type AiPanelStore = {
  isOpen: boolean;
  channelId: string | null;
  channelName: string | null;
  openPanel: (channelId: string, channelName: string) => void;
  closePanel: () => void;
  updateChannel: (channelId: string, channelName: string) => void;
};

export const useAiPanelStore = create<AiPanelStore>((set) => ({
  isOpen: false,
  channelId: null,
  channelName: null,
  openPanel: (channelId, channelName) =>
    set({ isOpen: true, channelId, channelName }),
  closePanel: () => set({ isOpen: false }),
  updateChannel: (channelId, channelName) => set({ channelId, channelName }),
}));

// What this does:

// isOpen — controls whether the AI panel is visible
// channelId + channelName — the current channel for context awareness
// openPanel — call this when user clicks the AI button, pass current channel info
// closePanel — call this when user closes the panel
// updateChannel — call this when user switches channels while panel is open
