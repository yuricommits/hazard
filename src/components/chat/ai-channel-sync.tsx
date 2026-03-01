"use client";

import { useEffect } from "react";
import { useAiPanelStore } from "@/stores/ai-panel-store";

export default function AiChannelSync({
  channelId,
  channelName,
}: {
  channelId: string;
  channelName: string;
}) {
  const { updateChannel } = useAiPanelStore();

  useEffect(() => {
    updateChannel(channelId, channelName);
  }, [channelId, channelName, updateChannel]);

  return null;
}
