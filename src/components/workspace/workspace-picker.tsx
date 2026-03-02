"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const supabase = createClient();

type Workspace = {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  role: string;
};

const createSchema = z.object({
  name: z
    .string()
    .min(2, "At least 2 characters")
    .max(50, "At most 50 characters"),
  slug: z
    .string()
    .min(2, "At least 2 characters")
    .max(50, "At most 50 characters")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
});

const joinSchema = z.object({
  token: z.string().min(1, "Paste an invite link or token"),
});

type CreateInput = z.infer<typeof createSchema>;
type JoinInput = z.infer<typeof joinSchema>;

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function extractToken(raw: string): string {
  try {
    const url = new URL(raw.trim());
    const parts = url.pathname.split("/");
    return parts[parts.length - 1] ?? raw.trim();
  } catch {
    return raw.trim();
  }
}

function workspaceInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Input style ───────────────────────────────────────────────────────────────

const inputClass = (hasError: boolean) =>
  `w-full bg-black border rounded-md px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition-all duration-150 ${
    hasError
      ? "border-red-500/50"
      : "border-zinc-800 hover:border-zinc-700 focus:border-zinc-600"
  }`;

// ── Create modal ──────────────────────────────────────────────────────────────

function CreateWorkspaceModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const form = useForm<CreateInput>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", slug: "" },
  });

  async function onSubmit(data: CreateInput) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: workspace, error } = await supabase
      .from("workspaces")
      .insert({ name: data.name, slug: data.slug, owner_id: user.id })
      .select()
      .single();

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
    });

    router.push(`/${workspace.slug}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Create a workspace</h2>
        <p className="text-sm text-zinc-500 mt-1">
          A workspace is where your team communicates.
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1">
          <input
            {...form.register("name")}
            placeholder="Workspace name"
            onChange={(e) => {
              form.setValue("name", e.target.value);
              form.setValue("slug", generateSlug(e.target.value));
            }}
            className={inputClass(!!form.formState.errors.name)}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-red-400">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div
            className={`flex items-center bg-black border rounded-md overflow-hidden transition-all duration-150 ${
              form.formState.errors.slug
                ? "border-red-500/50"
                : "border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-600"
            }`}
          >
            <span className="px-4 text-sm text-zinc-600 border-r border-zinc-800 py-3 select-none whitespace-nowrap">
              hazard.app/
            </span>
            <input
              {...form.register("slug")}
              placeholder="my-workspace"
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none"
            />
          </div>
          {form.formState.errors.slug && (
            <p className="text-xs text-red-400">
              {form.formState.errors.slug.message}
            </p>
          )}
        </div>

        {form.formState.errors.root && (
          <p className="text-xs text-red-400">
            {form.formState.errors.root.message}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-md border border-zinc-800 hover:border-zinc-700 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex-1 px-4 py-3 rounded-md bg-white hover:bg-zinc-100 text-sm font-medium text-black transition-colors disabled:opacity-50"
          >
            {form.formState.isSubmitting ? "Creating..." : "Create workspace"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Join modal ────────────────────────────────────────────────────────────────

function JoinWorkspaceModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const form = useForm<JoinInput>({
    resolver: zodResolver(joinSchema),
    defaultValues: { token: "" },
  });

  async function onSubmit(data: JoinInput) {
    const token = extractToken(data.token);
    const res = await fetch("/api/workspace/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const json = await res.json();
    if (!res.ok) {
      form.setError("root", { message: json.error ?? "Invalid invite link" });
      return;
    }
    router.push(`/${json.slug}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Join a workspace</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Paste an invite link or token to join an existing workspace.
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1">
          <input
            {...form.register("token")}
            placeholder="https://hazard.app/invite/abc123"
            className={inputClass(!!form.formState.errors.token)}
          />
          {form.formState.errors.token && (
            <p className="text-xs text-red-400">
              {form.formState.errors.token.message}
            </p>
          )}
        </div>

        {form.formState.errors.root && (
          <p className="text-xs text-red-400">
            {form.formState.errors.root.message}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-md border border-zinc-800 hover:border-zinc-700 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex-1 px-4 py-3 rounded-md bg-white hover:bg-zinc-100 text-sm font-medium text-black transition-colors disabled:opacity-50"
          >
            {form.formState.isSubmitting ? "Joining..." : "Join workspace"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main picker ───────────────────────────────────────────────────────────────

export default function WorkspacePicker({
  workspaces,
}: {
  workspaces: Workspace[];
}) {
  const router = useRouter();
  const [modal, setModal] = useState<"create" | "join" | null>(null);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className="w-full max-w-sm flex flex-col gap-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            {workspaces.length > 0 ? "Your workspaces" : "Welcome to Hazard"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            {workspaces.length > 0
              ? "Pick a workspace to continue."
              : "Create a workspace or join one with an invite link."}
          </p>
        </div>

        {/* Workspace list */}
        {workspaces.length > 0 && (
          <div className="flex flex-col gap-1">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => router.push(`/${ws.slug}`)}
                className="flex items-center gap-3 w-full border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950 rounded-md px-4 py-3 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0 text-xs font-semibold text-zinc-300">
                  {ws.icon_url ? (
                    <Image
                      src={ws.icon_url}
                      alt={ws.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    workspaceInitials(ws.name)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {ws.name}
                  </p>
                  <p className="text-xs text-zinc-600 truncate">
                    hazard.app/{ws.slug}
                  </p>
                </div>

                {ws.role === "owner" && (
                  <span className="text-[10px] font-medium text-zinc-500 border border-zinc-800 rounded-full px-2 py-0.5 shrink-0">
                    Owner
                  </span>
                )}

                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setModal("create")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-white hover:bg-zinc-100 text-sm font-medium text-black transition-colors"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create workspace
          </button>
          <button
            onClick={() => setModal("join")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950 text-sm font-medium text-zinc-300 hover:text-white transition-all"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Join workspace
          </button>
        </div>
      </motion.div>

      <Modal open={modal === "create"} onClose={() => setModal(null)}>
        <CreateWorkspaceModal onClose={() => setModal(null)} />
      </Modal>
      <Modal open={modal === "join"} onClose={() => setModal(null)}>
        <JoinWorkspaceModal onClose={() => setModal(null)} />
      </Modal>

      <p className="fixed bottom-6 text-[11px] text-zinc-700">
        © {new Date().getFullYear()} Hazard
      </p>
    </div>
  );
}
