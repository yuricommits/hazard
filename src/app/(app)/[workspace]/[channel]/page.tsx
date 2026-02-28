import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MessageComposer from "@/components/chat/message-composer";

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
      {/* Channel Header */}
      <div className="h-12 border-b border-zinc-800 flex items-center px-4 shrink-0">
        <span className="text-zinc-600 mr-1">#</span>
        <h1 className="text-sm font-semibold text-zinc-50">{channel.name}</h1>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
        {messages?.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-zinc-500">
              This is the beginning of #{channel.name}
            </p>
          </div>
        )}
        {messages?.map((message) => (
          <div
            key={message.id}
            className="flex items-start gap-3 px-2 py-1 rounded-lg hover:bg-zinc-900/50 group"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-xs font-medium text-zinc-400">
              {message.profiles?.display_name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-zinc-50">
                  {message.profiles?.display_name ??
                    message.profiles?.username ??
                    "Unknown"}
                </span>
                <span className="text-[10px] text-zinc-600">
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-zinc-300 wrap-break-word">
                {message.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <MessageComposer channelId={channel.id} channelName={channel.name} />
    </div>
  );
}

// What's new:

// Fetches messages joined with profiles so we have the author's name and avatar initial
// Each message shows avatar initial, display name, timestamp and content
// Hover state on each message row — subtle zinc wash
// Empty state when no messages yet
// Composer wired up at the bottom with real channelId

// Top — fetch channel and messages from Supabase
// Middle — render each message with avatar, name, timestamp, content
// Bottom — composer component we just built
