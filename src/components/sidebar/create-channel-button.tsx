"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const createChannelSchema = z.object({
  name: z
    .string()
    .min(2, "Channel name must be at least 2 characters")
    .max(50, "Channel name must be at most 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Channel name can only contain lowercase letters, numbers and hyphens",
    ),
});

type CreateChannelInput = z.infer<typeof createChannelSchema>;

export default function CreateChannelButton({
  workspaceId,
  workspaceSlug,
}: {
  workspaceId: string;
  workspaceSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<CreateChannelInput>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: { name: "" },
  });

  async function onSubmit(data: CreateChannelInput) {
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

    await supabase.from("channel_members").insert({
      channel_id: channel.id,
      user_id: user.id,
    });

    setOpen(false);
    form.reset();
    router.push(`/${workspaceSlug}/${channel.name}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          suppressHydrationWarning
          className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {" "}
          <span>+</span>
          <span>Add channel</span>
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-50">Create a channel</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Channel name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="general"
                      className="bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-sm text-red-400">
                {form.formState.errors.root.message}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-500 text-white"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Creating..." : "Create channel"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
