"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Workspace name must be at least 2 characters")
    .max(50, "Workspace name must be at most 50 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug must be at most 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers and hyphens",
    ),
});

type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export default function CreateWorkspacePage() {
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  async function onSubmit(data: CreateWorkspaceInput) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // console.log("Current user:", user?.id); // temporary

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: workspace, error } = await supabase
      .from("workspaces")
      .insert({
        name: data.name,
        slug: data.slug,
        owner_id: user.id,
      })
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
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">
            Create a workspace
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            A workspace is where your team communicates
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">
                    Workspace name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Inc."
                      className="bg-zinc-900 border-zinc-800 text-zinc-50 placeholder:text-zinc-600"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        form.setValue("slug", generateSlug(e.target.value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Workspace URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="acme-inc"
                      className="bg-zinc-900 border-zinc-800 text-zinc-50 placeholder:text-zinc-600"
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
              {form.formState.isSubmitting ? "Creating..." : "Create workspace"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

// What's new here:

// generateSlug — as you type the workspace name, the slug auto-fills. "Acme Inc." becomes "acme-inc" automatically. User can still edit it manually
// Two inserts happen on submit — first creates the workspace, then adds the creator as a member with owner role
// After creation, redirects to /{workspace-slug} — that'll be the main app layout we build next
