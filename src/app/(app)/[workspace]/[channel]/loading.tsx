"use client";

import { useEffect, useState } from "react";
import { useBootStore } from "@/stores/boot-store";

const BOOT_LINES = [
  { text: "HAZARD_OS v2.1.0 — INITIALIZING", delay: 0 },
  { text: "CORE_STREAM ········ ACTIVE", delay: 80 },
  { text: "SYNCING MESSAGE HISTORY", delay: 160 },
  { text: "PRESENCE ENGINE ···· ONLINE", delay: 240 },
  { text: "NEURAL INTERFACE ··· READY", delay: 320 },
];

function BootLine({ text, delay }: { text: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  const [chars, setChars] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!visible || chars >= text.length) return;
    const t = setTimeout(() => setChars((c) => c + 1), 12);
    return () => clearTimeout(t);
  }, [visible, chars, text.length]);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 font-mono text-[11px]">
      <span className="text-zinc-700 select-none w-4 text-right shrink-0">
        {chars >= text.length ? "›" : "·"}
      </span>
      <span className="text-zinc-500">
        {text.slice(0, chars)}
        {chars < text.length && (
          <span className="inline-block w-1.5 h-3 bg-zinc-500 ml-px animate-pulse align-middle" />
        )}
      </span>
    </div>
  );
}

function QuickLoader() {
  return (
    <div className="flex-1 flex flex-col justify-start bg-black h-full">
      <div className="relative h-px w-full overflow-hidden">
        <div className="absolute inset-0 bg-zinc-800" />
        <div
          className="absolute top-0 h-full w-32"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(139,92,246,0.8), rgba(255,255,255,0.9), rgba(139,92,246,0.8), transparent)",
            animation: "plasma 1s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

export default function ChannelLoading() {
  const { hasBooted, setBooted } = useBootStore();
  const [glowIntensity, setGlowIntensity] = useState(0.5);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowIntensity((g) => (g === 0.5 ? 0.9 : 0.5));
    }, 700);
    const t = setTimeout(() => setBooted(), 600);
    return () => {
      clearInterval(interval);
      clearTimeout(t);
    };
  }, [setBooted]);

  if (hasBooted) return <QuickLoader />;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-black h-full gap-8">
      <div className="relative flex items-center justify-center">
        <div
          className="w-3 h-3 bg-white rotate-45 transition-all duration-700"
          style={{
            boxShadow: `0 0 ${glowIntensity * 20}px ${glowIntensity * 8}px rgba(255,255,255,${glowIntensity * 0.7}), 0 0 ${glowIntensity * 40}px ${glowIntensity * 16}px rgba(139,92,246,${glowIntensity * 0.4})`,
          }}
        />
        <div
          className="absolute w-16 h-16 rounded-full transition-all duration-700"
          style={{
            background: `radial-gradient(circle, rgba(139,92,246,${glowIntensity * 0.08}) 0%, transparent 70%)`,
          }}
        />
      </div>

      <div className="flex flex-col gap-2 w-64">
        {BOOT_LINES.map((line) => (
          <BootLine key={line.text} text={line.text} delay={line.delay} />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase">
          Stream Connected
        </span>
      </div>
    </div>
  );
}
