import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MessageComposer from "@/components/chat/message-composer";
import MessageFeed from "@/components/chat/message-feed";
import TypingIndicator from "@/components/chat/typing-indicator";
import AiChannelSync from "@/components/chat/ai-channel-sync";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", user.id)
    .single();

  const currentUserName =
    profile?.display_name ?? profile?.username ?? "Someone";

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
    .select(
      "*, profiles(id, username, display_name, avatar_url), reactions(id, emoji, user_id)",
    )
    .eq("channel_id", channel.id)
    .is("thread_id", null)
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-col h-full">
      {/* Syncs current channel to AI panel store */}
      <AiChannelSync channelId={channel.id} channelName={channel.name} />

      <div className="h-12 border-b border-zinc-800 flex items-center px-4 shrink-0">
        <span className="text-zinc-600 mr-1">#</span>
        <h1 className="text-sm font-semibold text-zinc-50">{channel.name}</h1>
      </div>

      <MessageFeed
        channelId={channel.id}
        channelName={channel.name}
        initialMessages={messages ?? []}
        currentUserId={user.id}
      />

      <TypingIndicator channelId={channel.id} currentUserId={user.id} />

      <MessageComposer
        channelId={channel.id}
        channelName={channel.name}
        currentUserId={user.id}
        currentUserName={currentUserName}
      />
    </div>
  );
}
