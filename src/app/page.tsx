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
    .select("workspaces(slug)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    redirect("/create-workspace");
  }

  const workspace = membership.workspaces as unknown as { slug: string }[];
  redirect(`/${workspace[0].slug}`);
}

// What changed: Now it checks if the user already belongs to a workspace and redirects there directly. Only sends to /create-workspace if they have none.
