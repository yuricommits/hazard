"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";

const supabase = createClient();

const schema = z.object({
  name: z
    .string()
    .min(2, "At least 2 characters")
    .max(50, "At most 50 characters")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
});

type Input = z.infer<typeof schema>;

export default function CreateChannelButton({
  workspaceId,
  workspaceSlug,
}: {
  workspaceId: string;
  workspaceSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<Input>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  async function onSubmit(data: Input) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: channel, error } = await supabase
      .from("channels")
      .insert({
        workspace_id: workspaceId,
        name: data.name,
        type: "public",
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    await supabase
      .from("channel_members")
      .insert({ channel_id: channel.id, user_id: user.id });

    setOpen(false);
    form.reset();
    router.push(`/${workspaceSlug}/${channel.name}`);
    router.refresh();
  }

  return (
    <>
      <button
        suppressHydrationWarning
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
      >
        <Plus size={12} />
        <span>Add channel</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setOpen(false);
                form.reset();
              }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-white">
                    Create a channel
                  </h2>
                  <button
                    onClick={() => {
                      setOpen(false);
                      form.reset();
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-zinc-400">
                      Channel name
                    </label>
                    <div
                      className={`flex items-center bg-black border rounded-md overflow-hidden transition-all ${
                        form.formState.errors.name
                          ? "border-red-500/50"
                          : "border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-600"
                      }`}
                    >
                      <span className="px-3 text-sm text-zinc-600 border-r border-zinc-800 py-3 select-none">
                        #
                      </span>
                      <input
                        {...form.register("name")}
                        placeholder="general"
                        className="flex-1 bg-transparent px-3 py-3 text-sm text-white placeholder:text-zinc-600 outline-none"
                      />
                    </div>
                    {form.formState.errors.name && (
                      <p className="text-xs text-red-400">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  {form.formState.errors.root && (
                    <p className="text-xs text-red-400">
                      {form.formState.errors.root.message}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        form.reset();
                      }}
                      className="flex-1 px-4 py-2.5 rounded-md border border-zinc-800 hover:border-zinc-700 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                      className="flex-1 px-4 py-2.5 rounded-md bg-white hover:bg-zinc-100 text-sm font-medium text-black transition-colors disabled:opacity-50"
                    >
                      {form.formState.isSubmitting
                        ? "Creating..."
                        : "Create channel"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
