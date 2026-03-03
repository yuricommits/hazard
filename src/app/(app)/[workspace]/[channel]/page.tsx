import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MessageComposer from "@/components/chat/message-composer";
import MessageFeed from "@/components/chat/message-feed";
import TypingIndicator from "@/components/chat/typing-indicator";
import AiChannelSync from "@/components/chat/ai-channel-sync";
import ThreadsButton from "@/components/chat/threads-button";
import MembersPanelButton from "@/components/chat/members-panel-button";

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
  if (!user) redirect("/login");

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
  if (!workspace) redirect("/create-workspace");

  const { data: channel } = await supabase
    .from("channels")
    .select("*")
    .eq("workspace_id", workspace.id)
    .eq("name", channelName)
    .single();
  if (!channel) redirect(`/${workspaceSlug}`);

  const { data: messages } = await supabase
    .from("messages")
    .select(
      "*, profiles(id, username, display_name, avatar_url), reactions(id, emoji, user_id)",
    )
    .eq("channel_id", channel.id)
    .is("thread_id", null)
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-col h-full bg-black">
      <AiChannelSync channelId={channel.id} channelName={channel.name} />

      {/* Channel header */}
      <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-zinc-700 text-sm">#</span>
          <h1 className="text-sm font-medium text-zinc-100">{channel.name}</h1>
        </div>

        {/* Right actions — equal-width icon cells */}
        <div className="flex items-stretch h-full border-l border-zinc-800">
          <div className="w-12 flex items-center justify-center border-r border-zinc-800">
            <ThreadsButton channelId={channel.id} />
          </div>
          <button
            title="Search"
            className="w-12 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/30 transition-colors border-r border-zinc-800"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          <div className="w-12 flex items-center justify-center">
            <MembersPanelButton />
          </div>
        </div>
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
        displayName={profile?.display_name ?? null}
      />
    </div>
  );
}
