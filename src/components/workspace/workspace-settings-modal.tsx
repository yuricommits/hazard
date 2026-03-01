"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Invite = {
  id: string;
  token: string;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  is_active: boolean;
  created_at: string;
};

type Props = {
  open: boolean;
  onCloseAction: () => void;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  currentUserId: string;
};

function copyToClipboard(text: string, onCopied: () => void) {
  navigator.clipboard.writeText(text).then(onCopied);
}

function inviteUrl(token: string) {
  return `${window.location.origin}/invite/${token}`;
}

function formatExpiry(expiresAt: string | null) {
  if (!expiresAt) return "Never";
  const d = new Date(expiresAt);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function WorkspaceSettingsModal({
  open,
  onCloseAction,
  workspaceId,
  workspaceName,
  workspaceSlug,
  currentUserId,
}: Props) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<"never" | "7d" | "30d">("never");

  // Load role + invites when modal opens
  useEffect(() => {
    if (!open) return;

    async function load() {
      const { data: member } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", currentUserId)
        .single();

      setUserRole(member?.role ?? null);

      if (member?.role === "owner" || member?.role === "admin") {
        const { data } = await supabase
          .from("workspace_invites")
          .select("*")
          .eq("workspace_id", workspaceId)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        setInvites(data ?? []);
      }
    }

    load();
  }, [open, workspaceId, currentUserId]);

  async function generateInvite() {
    setGenerating(true);

    // Generate a URL-safe random token
    const array = new Uint8Array(18);
    crypto.getRandomValues(array);
    const token = btoa(String.fromCharCode(...array))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const expiresAt =
      expiry === "7d"
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : expiry === "30d"
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null;

    const { data, error } = await supabase
      .from("workspace_invites")
      .insert({
        workspace_id: workspaceId,
        created_by: currentUserId,
        token,
        expires_at: expiresAt,
        max_uses: null,
        use_count: 0,
        is_active: true,
      })
      .select()
      .single();

    if (!error && data) {
      setInvites((prev) => [data, ...prev]);
    }

    setGenerating(false);
  }

  async function revokeInvite(id: string) {
    await supabase
      .from("workspace_invites")
      .update({ is_active: false })
      .eq("id", id);

    setInvites((prev) => prev.filter((inv) => inv.id !== id));
  }

  const isAdmin = userRole === "owner" || userRole === "admin";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseAction}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-50">
                    Workspace settings
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {workspaceName}
                  </p>
                </div>
                <button
                  onClick={onCloseAction}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="px-6 py-5 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
                {/* Workspace info */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                    Workspace
                  </p>
                  <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5">
                    <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500/20 to-cyan-400/10 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300 shrink-0">
                      {workspaceName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-50">
                        {workspaceName}
                      </p>
                      <p className="text-xs text-zinc-600">
                        hazard.app/{workspaceSlug}
                      </p>
                    </div>
                    {userRole && (
                      <span className="ml-auto text-[10px] font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-2 py-0.5 capitalize">
                        {userRole}
                      </span>
                    )}
                  </div>
                </div>

                {/* Invite links — admin/owner only */}
                {isAdmin && (
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                      Invite links
                    </p>

                    {/* Generate new invite */}
                    <div className="flex items-center gap-2">
                      {/* Expiry selector */}
                      <div className="flex rounded-lg border border-zinc-800 overflow-hidden text-xs shrink-0">
                        {(["never", "7d", "30d"] as const).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setExpiry(opt)}
                            className={`px-2.5 py-1.5 transition-colors ${
                              expiry === opt
                                ? "bg-zinc-700 text-zinc-50"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                            }`}
                          >
                            {opt === "never"
                              ? "No expiry"
                              : opt === "7d"
                                ? "7 days"
                                : "30 days"}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={generateInvite}
                        disabled={generating}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white transition-colors disabled:opacity-50 shrink-0"
                      >
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        {generating ? "Generating..." : "Generate link"}
                      </button>
                    </div>

                    {/* Active invites list */}
                    {invites.length === 0 ? (
                      <p className="text-xs text-zinc-600 text-center py-4 border border-dashed border-zinc-800 rounded-lg">
                        No active invite links
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {invites.map((inv) => (
                          <div
                            key={inv.id}
                            className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5"
                          >
                            {/* Token preview */}
                            <code className="text-xs text-zinc-400 font-mono flex-1 truncate">
                              /invite/{inv.token}
                            </code>

                            {/* Meta */}
                            <div className="flex items-center gap-2 shrink-0 text-[10px] text-zinc-600">
                              <span>
                                {inv.use_count} use
                                {inv.use_count !== 1 ? "s" : ""}
                              </span>
                              <span>·</span>
                              <span>
                                Expires {formatExpiry(inv.expires_at)}
                              </span>
                            </div>

                            {/* Copy */}
                            <button
                              onClick={() =>
                                copyToClipboard(inviteUrl(inv.token), () => {
                                  setCopiedId(inv.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                })
                              }
                              className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
                              title="Copy invite link"
                            >
                              {copiedId === inv.id ? (
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-emerald-400"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect
                                    x="9"
                                    y="9"
                                    width="13"
                                    height="13"
                                    rx="2"
                                    ry="2"
                                  />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                              )}
                            </button>

                            {/* Revoke */}
                            <button
                              onClick={() => revokeInvite(inv.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors shrink-0"
                              title="Revoke invite"
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Non-admin info */}
                {!isAdmin && userRole && (
                  <p className="text-xs text-zinc-600 text-center py-2">
                    Only workspace owners and admins can manage invite links.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
