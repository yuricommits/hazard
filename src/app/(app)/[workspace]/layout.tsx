import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
          {/* Channels will go here */}
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
