import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateChannelButton from "@/components/sidebar/create-channel-button";

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
            {channels?.map((channel) => (
              <Link
                key={channel.id}
                href={`/${slug}/${channel.name}`}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-sm text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50 transition-colors"
              >
                <span className="text-zinc-600">#</span>
                {channel.name}
              </Link>
            ))}
            <CreateChannelButton
              workspaceId={workspace.id}
              workspaceSlug={slug}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}

// What this does:

// params is a Promise in Next.js 15 — we await it to get the workspace slug from the URL
// Fetches the workspace from Supabase by slug
// If workspace doesn't exist, redirects to create one
// Renders the 3 column shell — sidebar on the left, main content on the right
// Channels list is empty for now, we'll fill it in next
