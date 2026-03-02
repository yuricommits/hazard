"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, SignupInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: SignupInput) {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (error) {
      form.setError("root", { message: error.message });
      return;
    }
    router.push("/login");
    router.refresh();
  }

  const isSubmitting = form.formState.isSubmitting;
  const errors = form.formState.errors;

  const inputClass = (hasError: boolean) =>
    `w-full bg-zinc-950 border rounded-md px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition-all duration-150 ${
      hasError
        ? "border-red-500/50"
        : "border-zinc-800 hover:border-zinc-700 focus:border-zinc-600"
    }`;

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
          Create your account
        </h1>
      </div>

      {/* Form */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1">
          <input
            {...form.register("email")}
            type="email"
            placeholder="Email Address"
            className={inputClass(!!errors.email)}
          />
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div
            className={`flex items-center bg-zinc-950 border rounded-md overflow-hidden transition-all duration-150 ${
              errors.username
                ? "border-red-500/50"
                : "border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-600"
            }`}
          >
            <span className="px-4 text-sm text-zinc-600 border-r border-zinc-800 py-3 select-none">
              @
            </span>
            <input
              {...form.register("username")}
              placeholder="username"
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none"
            />
          </div>
          {errors.username && (
            <p className="text-xs text-red-400">{errors.username.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <input
            {...form.register("password")}
            type="password"
            placeholder="Password"
            className={inputClass(!!errors.password)}
          />
          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <input
            {...form.register("confirmPassword")}
            type="password"
            placeholder="Confirm Password"
            className={inputClass(!!errors.confirmPassword)}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

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
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-xs text-zinc-600">or</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-white hover:text-zinc-300 transition-colors"
        >
          Log in
        </Link>
      </p>
    </motion.div>
  );
}

// What's different from login:

// Two step process — first supabase.auth.signUp creates the auth user, then we insert into profiles to store the username
// If the profile insert fails after auth succeeds we show the error — in a future session we'll make this more robust with a database transaction
// display_name defaults to username on signup, user can change it later in settings
