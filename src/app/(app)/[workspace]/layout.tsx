import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ThreadPanel from "@/components/chat/thread-panel";
import AiPanel from "@/components/chat/ai-panel";
import AppSidebar from "@/components/sidebar/app-sidebar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!workspace) redirect("/create-workspace");

  const { data: channels } = await supabase
    .from("channels")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <AppSidebar
        workspaceName={workspace.name}
        workspaceSlug={slug}
        workspaceId={workspace.id}
        currentUserId={user.id}
        username={profile?.username ?? "You"}
        channels={channels ?? []}
      />

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
        <ThreadPanel />
        <AiPanel workspaceId={workspace.id} currentUserId={user.id} />
      </main>
    </div>
  );
}
