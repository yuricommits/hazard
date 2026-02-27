import Link from "next/link";

export default function VerifyPage() {
  return (
    <div className="w-full max-w-sm px-4 text-center">
      <div className="mb-4 text-4xl">✉️</div>
      <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">
        Check your email
      </h1>
      <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
        We sent a confirmation link to your email address. Click the link to
        activate your account.
      </p>
      <p className="text-sm text-zinc-600 mt-6">
        Already confirmed?{" "}
        <Link href="/login" className="text-violet-400 hover:text-violet-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
