"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { X, User, LayoutGrid, Plus, Copy, Check, Trash2 } from "lucide-react";

const supabase = createClient();

type Section = "profile" | "workspace";
type Invite = {
  id: string;
  token: string;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  is_active: boolean;
};
type Props = {
  open: boolean;
  initialSection?: Section;
  onCloseAction: () => void;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  currentUserId: string;
  username: string;
  displayName: string | null;
};

function inviteUrl(token: string) {
  return `${window.location.origin}/invite/${token}`;
}
function formatExpiry(expiresAt: string | null) {
  if (!expiresAt) return "No expiry";
  return new Date(expiresAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-zinc-800/60 last:border-0">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-zinc-200">{label}</span>
        {description && (
          <span className="text-xs text-zinc-500 leading-relaxed max-w-xs">
            {description}
          </span>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-2">{children}</div>
    </div>
  );
}

function SettingInput({
  value,
  onChange,
  placeholder,
  prefix,
  warning,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  warning?: string;
}) {
  return (
    <div className="flex flex-col gap-1 items-end">
      <div className="flex items-center bg-black border border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-600 transition-colors overflow-hidden">
        {prefix && (
          <span className="px-3 text-xs text-zinc-600 border-r border-zinc-800 py-2 select-none whitespace-nowrap">
            {prefix}
          </span>
        )}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none px-3 py-2 w-48"
        />
      </div>
      {warning && <span className="text-[10px] text-amber-500">{warning}</span>}
    </div>
  );
}

function SaveButton({
  onClick,
  saving,
  saved,
}: {
  onClick: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={`h-8 px-3 text-xs font-medium transition-all border ${saved ? "border-zinc-800 text-emerald-400" : "border-zinc-700 hover:border-zinc-500 bg-white hover:bg-zinc-100 text-black"} disabled:opacity-50`}
    >
      {saving ? "Saving..." : saved ? "✓ Saved" : "Save"}
    </button>
  );
}

function ProfileSection({
  currentUserId,
  username: initialUsername,
  displayName: initialDisplayName,
  onSignOut,
}: {
  currentUserId: string;
  username: string;
  displayName: string | null;
  onSignOut: () => void;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [username, setUsername] = useState(initialUsername);
  const [savingName, setSavingName] = useState(false);
  const [savedName, setSavedName] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [savedUsername, setSavedUsername] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveDisplayName() {
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", currentUserId);
    setSavingName(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSavedName(true);
    router.refresh();
    setTimeout(() => setSavedName(false), 2500);
  }

  async function saveUsername() {
    setSavingUsername(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", currentUserId);
    setSavingUsername(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSavedUsername(true);
    router.refresh();
    setTimeout(() => setSavedUsername(false), 2500);
  }

  return (
    <div className="flex flex-col">
      <div className="pb-4 mb-1 border-b border-zinc-800">
        <h3 className="text-base font-semibold text-zinc-50">Profile</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Manage your personal account details.
        </p>
      </div>
      <div className="py-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 border border-zinc-800 flex items-center justify-center text-lg font-semibold text-zinc-300">
            {(displayName || username)?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">
              {displayName || username}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">@{username}</p>
          </div>
        </div>
      </div>
      <SettingRow
        label="Display name"
        description="Your name visible to other members."
      >
        <SettingInput
          value={displayName}
          onChange={setDisplayName}
          placeholder="Your name"
        />
        <SaveButton
          onClick={saveDisplayName}
          saving={savingName}
          saved={savedName}
        />
      </SettingRow>
      <SettingRow
        label="Username"
        description="Your unique @handle in this workspace."
      >
        <SettingInput
          value={username}
          onChange={setUsername}
          placeholder="username"
          prefix="@"
        />
        <SaveButton
          onClick={saveUsername}
          saving={savingUsername}
          saved={savedUsername}
        />
      </SettingRow>
      {error && <p className="text-xs text-red-400 pt-2">{error}</p>}
      <div className="pt-4 mt-2 border-t border-zinc-800/60">
        <SettingRow
          label="Sign out"
          description="Sign out of your account on this device."
        >
          <button
            onClick={onSignOut}
            className="h-8 px-3 text-xs font-medium border border-zinc-800 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
          >
            Sign out
          </button>
        </SettingRow>
      </div>
    </div>
  );
}

function WorkspaceSection({
  workspaceId,
  workspaceName: initialName,
  workspaceSlug: initialSlug,
  currentUserId,
  userRole,
}: {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  currentUserId: string;
  userRole: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [savingName, setSavingName] = useState(false);
  const [savedName, setSavedName] = useState(false);
  const [savingSlug, setSavingSlug] = useState(false);
  const [savedSlug, setSavedSlug] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<"never" | "7d" | "30d">("never");
  const [error, setError] = useState<string | null>(null);
  const isAdmin = userRole === "owner" || userRole === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("workspace_invites")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setInvites(data ?? []));
  }, [workspaceId, isAdmin]);

  async function saveName() {
    setSavingName(true);
    const { error } = await supabase
      .from("workspaces")
      .update({ name })
      .eq("id", workspaceId);
    setSavingName(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSavedName(true);
    router.refresh();
    setTimeout(() => setSavedName(false), 2500);
  }

  async function saveSlug() {
    setSavingSlug(true);
    const { error } = await supabase
      .from("workspaces")
      .update({ slug })
      .eq("id", workspaceId);
    setSavingSlug(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSavedSlug(true);
    window.location.href = `/${slug}`;
  }

  async function generateInvite() {
    setGenerating(true);
    const array = new Uint8Array(18);
    crypto.getRandomValues(array);
    const token = btoa(String.fromCharCode(...array))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const expiresAt =
      expiry === "7d"
        ? new Date(Date.now() + 7 * 86400000).toISOString()
        : expiry === "30d"
          ? new Date(Date.now() + 30 * 86400000).toISOString()
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
    if (!error && data) setInvites((prev) => [data, ...prev]);
    setGenerating(false);
  }

  async function revokeInvite(id: string) {
    await supabase
      .from("workspace_invites")
      .update({ is_active: false })
      .eq("id", id);
    setInvites((prev) => prev.filter((i) => i.id !== id));
  }

  function copyInvite(token: string, id: string) {
    navigator.clipboard.writeText(inviteUrl(token)).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  return (
    <div className="flex flex-col">
      <div className="pb-4 mb-1 border-b border-zinc-800">
        <h3 className="text-base font-semibold text-zinc-50">Workspace</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Manage your workspace settings and invite links.
        </p>
      </div>
      {isAdmin ? (
        <>
          <SettingRow
            label="Workspace name"
            description="The display name for your workspace."
          >
            <SettingInput
              value={name}
              onChange={setName}
              placeholder="My Workspace"
            />
            <SaveButton
              onClick={saveName}
              saving={savingName}
              saved={savedName}
            />
          </SettingRow>
          <SettingRow
            label="Workspace URL"
            description="Changing this will update your URL and redirect."
          >
            <SettingInput
              value={slug}
              onChange={setSlug}
              placeholder="my-workspace"
              prefix="hazard.app/"
              warning={slug !== initialSlug ? "URL will change" : undefined}
            />
            <SaveButton
              onClick={saveSlug}
              saving={savingSlug}
              saved={savedSlug}
            />
          </SettingRow>
          {error && <p className="text-xs text-red-400 py-2">{error}</p>}
          <div className="pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  Invite links
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Generate links to invite people.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex border border-zinc-800 overflow-hidden text-xs">
                  {(["never", "7d", "30d"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setExpiry(opt)}
                      className={`px-2.5 py-1.5 transition-colors border-r border-zinc-800 last:border-0 ${expiry === opt ? "bg-zinc-800 text-zinc-100" : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/40"}`}
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
                  className="flex items-center gap-1.5 h-8 px-3 border border-zinc-700 hover:border-zinc-500 bg-white hover:bg-zinc-100 text-xs font-medium text-black transition-colors disabled:opacity-50"
                >
                  <Plus size={11} strokeWidth={2.5} />
                  {generating ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>
            {invites.length === 0 ? (
              <div className="text-xs text-zinc-700 text-center py-6 border border-dashed border-zinc-800">
                No active invite links
              </div>
            ) : (
              <div className="flex flex-col border border-zinc-800 divide-y divide-zinc-800">
                {invites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center gap-2 px-3 py-2.5"
                  >
                    <code className="text-xs text-zinc-400 font-mono flex-1 truncate">
                      /invite/{inv.token}
                    </code>
                    <span className="text-[10px] text-zinc-600 shrink-0">
                      {inv.use_count} use{inv.use_count !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[10px] text-zinc-700">·</span>
                    <span className="text-[10px] text-zinc-600 shrink-0">
                      {formatExpiry(inv.expires_at)}
                    </span>
                    <button
                      onClick={() => copyInvite(inv.token, inv.id)}
                      className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-zinc-200 hover:bg-zinc-900/40 transition-colors border border-transparent hover:border-zinc-800"
                    >
                      {copiedId === inv.id ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                    <button
                      onClick={() => revokeInvite(inv.id)}
                      className="w-7 h-7 flex items-center justify-center text-zinc-700 hover:text-red-400 hover:bg-zinc-900/40 transition-colors border border-transparent hover:border-zinc-800"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="py-8 text-center text-xs text-zinc-600">
          Only owners and admins can manage settings.
        </div>
      )}
    </div>
  );
}

export default function SettingsOverlay({
  open,
  initialSection = "profile",
  onCloseAction,
  workspaceId,
  workspaceName,
  workspaceSlug,
  currentUserId,
  username,
  displayName,
}: Props) {
  const [section, setSection] = useState<Section>(initialSection);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", currentUserId)
      .single()
      .then(({ data }) => setUserRole(data?.role ?? null));
  }, [open, workspaceId, currentUserId]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseAction();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCloseAction]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onCloseAction}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-2xl h-130 bg-black border border-zinc-800 shadow-2xl flex overflow-hidden">
              {/* Left nav */}
              <div className="w-44 shrink-0 border-r border-zinc-800 flex flex-col">
                <p className="text-[10px] font-medium text-zinc-700 uppercase tracking-widest px-4 py-3 border-b border-zinc-800">
                  Settings
                </p>
                {(["profile", "workspace"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSection(s)}
                    className={`flex items-center gap-2.5 w-full px-4 py-3 text-sm transition-colors text-left border-b border-zinc-800/50 ${section === s ? "bg-zinc-900/60 text-zinc-100" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"}`}
                  >
                    {s === "profile" ? (
                      <User
                        size={13}
                        strokeWidth={1.5}
                        className="text-zinc-600"
                      />
                    ) : (
                      <LayoutGrid
                        size={13}
                        strokeWidth={1.5}
                        className="text-zinc-600"
                      />
                    )}
                    {s === "profile" ? "Profile" : "Workspace"}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-800 shrink-0">
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <span>Settings</span>
                    <span>/</span>
                    <span className="text-zinc-300 capitalize">{section}</span>
                  </div>
                  <button
                    onClick={onCloseAction}
                    className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/40 border border-transparent hover:border-zinc-800 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <AnimatePresence mode="wait">
                    {section === "profile" ? (
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 6 }}
                        transition={{ duration: 0.12 }}
                      >
                        <ProfileSection
                          currentUserId={currentUserId}
                          username={username}
                          displayName={displayName}
                          onSignOut={handleSignOut}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="workspace"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 6 }}
                        transition={{ duration: 0.12 }}
                      >
                        <WorkspaceSection
                          workspaceId={workspaceId}
                          workspaceName={workspaceName}
                          workspaceSlug={workspaceSlug}
                          currentUserId={currentUserId}
                          userRole={userRole}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
