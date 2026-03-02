"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginInput) {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      form.setError("root", { message: error.message });
      return;
    }
    router.push("/");
    router.refresh();
  }

  const isSubmitting = form.formState.isSubmitting;
  const errors = form.formState.errors;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className="w-full max-w-sm flex flex-col gap-8"
    >
      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Log in to Hazard
        </h1>
      </div>

      {/* Form */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        {/* Email */}
        <input
          {...form.register("email")}
          type="email"
          placeholder="Email Address"
          className={`w-full bg-zinc-950 border rounded-md px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition-all duration-150 ${
            errors.email
              ? "border-red-500/50"
              : "border-zinc-800 hover:border-zinc-700 focus:border-zinc-600"
          }`}
        />
        {errors.email && (
          <p className="text-xs text-red-400 -mt-1">{errors.email.message}</p>
        )}

        {/* Password */}
        <input
          {...form.register("password")}
          type="password"
          placeholder="Password"
          className={`w-full bg-zinc-950 border rounded-md px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition-all duration-150 ${
            errors.password
              ? "border-red-500/50"
              : "border-zinc-800 hover:border-zinc-700 focus:border-zinc-600"
          }`}
        />
        {errors.password && (
          <p className="text-xs text-red-400 -mt-1">
            {errors.password.message}
          </p>
        )}

        {/* Error */}
        {errors.root && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-2.5 bg-red-950/40 border border-red-500/20 rounded-md"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-400 shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-xs text-red-400">{errors.root.message}</p>
          </motion.div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-white hover:bg-zinc-100 active:bg-zinc-200 text-sm font-medium text-black transition-colors disabled:opacity-50 mt-1"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin shrink-0"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Signing in...
            </>
          ) : (
            "Continue with Email"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-xs text-zinc-600">or</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      {/* Sign up link */}
      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-white hover:text-zinc-300 transition-colors"
        >
          Sign Up
        </Link>
      </p>
    </motion.div>
  );
}

// What this does:

// useForm with zodResolver — connects our Zod schema to the form. Validation runs automatically on submit
// supabase.auth.signInWithPassword — sends the credentials to Supabase, gets back either a session or an error
// form.setError("root") — if Supabase returns an error, we show it at the form level not on a specific field
// router.refresh() — after login, forces Next.js to re-fetch server components so they pick up the new session
// The form styling follows our design system — zinc surfaces, violet accent
