"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAiPanelStore } from "@/stores/ai-panel-store";
import { Layers } from "lucide-react";

export default function AiPanelButton({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const { isOpen, openPanel, closePanel } = useAiPanelStore();

  function handleClick() {
    if (isOpen) closePanel();
    else openPanel("", "");
  }

  return (
    <button
      onClick={handleClick}
      title={collapsed ? "Hazard AI" : undefined}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
        isOpen
          ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
          : "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800"
      } ${collapsed ? "justify-center" : ""}`}
    >
      <div className="w-4 h-4 rounded-md flex items-center justify-center bg-linear-to-br from-violet-500 to-cyan-400 shrink-0">
        <Layers size={8} strokeWidth={2.5} color="white" />
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="text-xs"
          >
            Hazard AI
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
