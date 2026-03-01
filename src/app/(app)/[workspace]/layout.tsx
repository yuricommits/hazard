import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CreateChannelButton from "@/components/sidebar/create-channel-button";
import ChannelList from "@/components/sidebar/channel-list";
import SignOutButton from "@/components/sidebar/sign-out-button";
import ThreadPanel from "@/components/chat/thread-panel";
import AiPanel from "@/components/chat/ai-panel";
import AiPanelButton from "@/components/sidebar/ai-panel-button";

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

  if (!user) {
    redirect("/login");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!workspace) {
    redirect("/create-workspace");
  }

  const { data: channels } = await supabase
    .from("channels")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-60 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-50 truncate">
            {workspace.name}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-1">
            <p className="px-2 py-1 text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
              Channels
            </p>
            <ChannelList channels={channels ?? []} workspaceSlug={slug} />
            <CreateChannelButton
              workspaceId={workspace.id}
              workspaceSlug={slug}
            />
          </div>
        </div>

        {/* AI Panel button + Sign out */}
        <div className="p-3 border-t border-zinc-800 shrink-0 flex flex-col gap-2">
          <AiPanelButton />
          <SignOutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
        <ThreadPanel />
        <AiPanel workspaceId={workspace.id} currentUserId={user.id} />
      </main>
    </div>
  );
}
