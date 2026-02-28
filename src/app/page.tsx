import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    redirect("/create-workspace");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("slug")
    .eq("id", membership.workspace_id)
    .single();

  if (!workspace) {
    redirect("/create-workspace");
  }

  redirect(`/${workspace.slug}`);
}

// What changed: Now it checks if the user already belongs to a workspace and redirects there directly. Only sends to /create-workspace if they have none.

// What changed: Instead of a join, two separate queries — first get the workspace_id from membership, then get the slug from workspaces. Simpler and no type issues. 🤙
