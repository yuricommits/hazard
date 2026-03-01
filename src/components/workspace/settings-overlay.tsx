"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function inviteUrl(token: string) {
  return `${window.location.origin}/invite/${token}`;
}

function formatExpiry(expiresAt: string | null) {
  if (!expiresAt) return "Never expires";
  return new Date(expiresAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Row primitives ────────────────────────────────────────────────────────────

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
          <span className="text-xs text-zinc-500 leading-relaxed">
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
      <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden focus-within:border-zinc-600 transition-colors">
        {prefix && (
          <span className="px-2.5 text-xs text-zinc-600 border-r border-zinc-800 py-2 select-none whitespace-nowrap">
            {prefix}
          </span>
        )}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent text-sm text-zinc-50 placeholder:text-zinc-600 outline-none px-3 py-2 w-52"
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
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        saved
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-violet-600 hover:bg-violet-500 text-white"
      } disabled:opacity-50`}
    >
      {saving ? "Saving..." : saved ? "✓ Saved" : "Save"}
    </button>
  );
}

// ── Profile section ───────────────────────────────────────────────────────────

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
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [username, setUsername] = useState(initialUsername);
  const [savingName, setSavingName] = useState(false);
  const [savedName, setSavedName] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [savedUsername, setSavedUsername] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveDisplayName() {
    setSavingName(true);
    setError(null);
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
    setTimeout(() => setSavedName(false), 2500);
  }

  async function saveUsername() {
    setSavingUsername(true);
    setError(null);
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
    setTimeout(() => setSavedUsername(false), 2500);
  }

  return (
    <div className="flex flex-col">
      <SectionHeader
        title="Profile"
        description="Manage your personal account details."
      />

      {/* Avatar placeholder */}
      <div className="py-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl font-semibold text-zinc-300">
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

      {/* Sign out */}
      <div className="pt-6 mt-2 border-t border-zinc-800/60">
        <SettingRow
          label="Sign out"
          description="Sign out of your account on this device."
        >
          <button
            onClick={onSignOut}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            Sign out
          </button>
        </SettingRow>
      </div>
    </div>
  );
}

// ── Workspace section ─────────────────────────────────────────────────────────

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
    setError(null);
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
    setTimeout(() => setSavedName(false), 2500);
  }

  async function saveSlug() {
    setSavingSlug(true);
    setError(null);
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
    setTimeout(() => setSavedSlug(false), 2500);
    // Redirect to new slug
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
      <SectionHeader
        title="Workspace"
        description="Manage your workspace settings and invite links."
      />

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
            description="Changing this will update your workspace URL and redirect."
          >
            <div className="flex flex-col gap-1 items-end">
              <SettingInput
                value={slug}
                onChange={setSlug}
                placeholder="my-workspace"
                prefix="hazard.app/"
                warning={
                  slug !== initialSlug
                    ? "⚠ URL will change and redirect"
                    : undefined
                }
              />
            </div>
            <SaveButton
              onClick={saveSlug}
              saving={savingSlug}
              saved={savedSlug}
            />
          </SettingRow>

          {error && <p className="text-xs text-red-400 py-2">{error}</p>}

          {/* Invite links */}
          <div className="pt-2 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  Invite links
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Generate links to invite people to this workspace.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Expiry selector */}
                <div className="flex rounded-lg border border-zinc-800 overflow-hidden text-xs">
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white transition-colors disabled:opacity-50"
                >
                  <svg
                    width="10"
                    height="10"
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
                  {generating ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>

            {/* Invite list */}
            {invites.length === 0 ? (
              <div className="text-xs text-zinc-600 text-center py-5 border border-dashed border-zinc-800 rounded-lg">
                No active invite links — generate one above
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {invites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5"
                  >
                    <code className="text-xs text-zinc-400 font-mono flex-1 truncate">
                      /invite/{inv.token}
                    </code>
                    <span className="text-[10px] text-zinc-600 shrink-0">
                      {inv.use_count} use{inv.use_count !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[10px] text-zinc-700 shrink-0">
                      ·
                    </span>
                    <span className="text-[10px] text-zinc-600 shrink-0">
                      {formatExpiry(inv.expires_at)}
                    </span>
                    {/* Copy */}
                    <button
                      onClick={() => copyInvite(inv.token, inv.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
                      title="Copy link"
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
                      title="Revoke"
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
        </>
      ) : (
        <div className="py-8 text-center text-xs text-zinc-600">
          Only workspace owners and admins can manage settings.
        </div>
      )}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="pb-4 mb-2 border-b border-zinc-800">
      <h3 className="text-base font-semibold text-zinc-50">{title}</h3>
      <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
    </div>
  );
}

// ── Nav item ──────────────────────────────────────────────────────────────────

function NavItem({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors text-left ${
        active
          ? "bg-zinc-800 text-zinc-50"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
      }`}
    >
      <span className={active ? "text-violet-400" : "text-zinc-600"}>
        {icon}
      </span>
      {label}
    </button>
  );
}

// ── Main overlay ──────────────────────────────────────────────────────────────

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
  // After — no useState needed for initial sync, use key on the component
  const [section, setSection] = useState<Section>(initialSection);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Sync section when initialSection changes (e.g. clicking Settings vs user row)

  // Load user role once
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

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseAction();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCloseAction]);

  const navIcons = {
    profile: (
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
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    workspace: (
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
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onCloseAction}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
          >
            <div
              key={initialSection}
              className="pointer-events-auto w-full max-w-2xl h-130 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex overflow-hidden"
            >
              {/* Left nav */}
              <div className="w-48 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col p-3 gap-1">
                <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest px-3 py-2">
                  Settings
                </p>
                <NavItem
                  active={section === "profile"}
                  onClick={() => setSection("profile")}
                  icon={navIcons.profile}
                  label="Profile"
                />
                <NavItem
                  active={section === "workspace"}
                  onClick={() => setSection("workspace")}
                  icon={navIcons.workspace}
                  label="Workspace"
                />
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
                  <div className="flex items-center gap-2 text-zinc-500 text-xs">
                    <span>Settings</span>
                    <span>/</span>
                    <span className="text-zinc-300 capitalize">{section}</span>
                  </div>
                  <button
                    onClick={onCloseAction}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                    title="Close (Esc)"
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

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <AnimatePresence mode="wait">
                    {section === "profile" ? (
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 6 }}
                        transition={{ duration: 0.15 }}
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
                        transition={{ duration: 0.15 }}
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
