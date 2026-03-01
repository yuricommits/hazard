import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WorkspacePicker from "@/components/workspace/workspace-picker";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch ALL workspaces this user belongs to
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("role, workspaces(id, name, slug, icon_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const workspaces = (memberships ?? [])
    .map((m) => {
      const ws = Array.isArray(m.workspaces) ? m.workspaces[0] : m.workspaces;
      return ws ? { ...ws, role: m.role } : null;
    })
    .filter(Boolean) as {
    id: string;
    name: string;
    slug: string;
    icon_url: string | null;
    role: string;
  }[];

  return <WorkspacePicker workspaces={workspaces} />;
}
