import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ workspace: string; channel: string }>;
}) {
  const { workspace: workspaceSlug, channel: channelName } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .single();

  if (!workspace) {
    redirect("/create-workspace");
  }

  const { data: channel } = await supabase
    .from("channels")
    .select("*")
    .eq("workspace_id", workspace.id)
    .eq("name", channelName)
    .single();

  if (!channel) {
    redirect(`/${workspaceSlug}`);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Channel Header */}
      <div className="h-12 border-b border-zinc-800 flex items-center px-4 shrink-0">
        <span className="text-zinc-600 mr-1">#</span>
        <h1 className="text-sm font-semibold text-zinc-50">{channel.name}</h1>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-zinc-500">
            This is the beginning of #{channel.name}
          </p>
        </div>
      </div>

      {/* Composer */}
      <div className="p-4 shrink-0">
        <div className="border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-600">
          Message #{channel.name}
        </div>
      </div>
    </div>
  );
}
