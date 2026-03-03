export default function LogoNode() {
  return (
    <div className="h-12 flex items-center justify-center relative border-b border-zinc-800">
      <div className="w-3 h-3 bg-white rotate-45 shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-10 h-10 bg-white/5 blur-xl rounded-full" />
      </div>
    </div>
  );
}
