import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MessageComposer from "@/components/chat/message-composer";
import MessageFeed from "@/components/chat/message-feed";

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

  const { data: messages } = await supabase
    .from("messages")
    .select("*, profiles(id, username, display_name, avatar_url)")
    .eq("channel_id", channel.id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-col h-full">
      <div className="h-12 border-b border-zinc-800 flex items-center px-4 shrink-0">
        <span className="text-zinc-600 mr-1">#</span>
        <h1 className="text-sm font-semibold text-zinc-50">{channel.name}</h1>
      </div>

      <MessageFeed
        channelId={channel.id}
        channelName={channel.name}
        initialMessages={messages ?? []}
      />

      <MessageComposer channelId={channel.id} channelName={channel.name} />
    </div>
  );
}
