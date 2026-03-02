export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      {children}
      <p className="absolute bottom-6 text-[11px] text-zinc-700">
        © {new Date().getFullYear()} Hazard
      </p>
    </div>
  );
}

// What this does: Every page inside the (auth) folder — login and signup — will be wrapped by this layout. The parentheses around auth mean it's a route group, Next.js won't include auth in the URL. So the URL is just /login not /auth/login.
// The layout itself is simple — dark background, centers everything vertically and horizontally. The actual form card sits on top of this.
