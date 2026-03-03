export default function LogoNode() {
  return (
    <div className="h-12 flex items-center justify-center relative border-b border-zinc-800">
      <div className="w-2 h-2 bg-white rotate-45 shadow-[0_0_8px_rgba(255,255,255,0.7)] z-10" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-6 h-6 bg-white/5 blur-lg rounded-full" />
      </div>
    </div>
  );
}
