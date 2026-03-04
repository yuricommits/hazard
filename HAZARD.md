# ⚡ HAZARD — Project Source of Truth

> Paste this file at the start of every new chat to restore full context.
> Update this file before ending every chat session.

---

## VISION

Hazard is a powerful developer-first chat application. It competes directly with Linear, Vercel, GitHub, and Slack. Built for developers who have taste — fast, opinionated, and beautiful. Every decision should feel like it was made by a world-class design team.

**Developer:** Kim (learning, needs step-by-step explanation)  
**Assistant:** Claude (explains everything, one file at a time, no assumptions)  
**Rule:** One file, fully understood, before moving to the next.

---

## TECH STACK (LOCKED)

### Frontend
- **Next.js 16** — App Router, Server Components, Server Actions, Turbopack
- **TypeScript** — strict mode, non-negotiable
- **Tailwind CSS v4** — no tailwind.config.ts, keyframes in globals.css, no @apply
- **shadcn/ui** — component primitives, fully owned (zinc theme, New York style)
- **Framer Motion** — micro-interactions and animations
- **JetBrains Mono** — font for all code rendering (not yet implemented)

### Backend & Infrastructure
- **Supabase** — entire backend:
  - PostgreSQL (primary database, 11 tables)
  - Auth (email auth, no email confirmation in dev)
  - Realtime (live messages + reactions working across tabs)
  - Storage (not yet implemented)
- **Upstash Redis** — rate limiting and caching (not yet implemented)
- **Cloudflare R2** — CDN for media uploads (not yet implemented)

### AI
- **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`) — installed
- **Anthropic Claude API** — `claude-sonnet-4-6` — active model
- **Note:** `@ai-sdk/google` may still be installed — can uninstall with `npm uninstall @ai-sdk/google`

### Developer Experience
- **Drizzle ORM** — type-safe database schema and queries
- **Zod** — schema validation
- **Zustand** — lightweight client state (multiple stores)
- **React Hook Form** — form handling
- **nuqs** — URL state management (not yet implemented)
- **react-syntax-highlighter** — hljs (highlight.js) for auto-detection, CJS path
- **emoji-picker-react** — full emoji picker in context menu

### Code Quality
- **ESLint + Prettier** — consistent code style
- **Husky** — pre-commit hooks (not yet implemented)
- **Commitlint** — conventional commits (not yet implemented)

### Deployment
- **Vercel** — frontend + edge functions (live)
- **Supabase Cloud** — managed backend (live)

---

## DESIGN SYSTEM

### Visual Language (FINALIZED)
- Pure black backgrounds (`bg-black`)
- `border border-zinc-800` on all structural elements
- `rounded-none` or `rounded-sm` — boxy grid aesthetic
- Hover: `bg-zinc-900/30` or `bg-zinc-900/40`
- Feed separators: `border-b border-zinc-800/20`
- No drag resize on any panel — all fixed widths

### Layout Architecture
- **48px permanent icon rail sidebar** — no collapse, no expand
- **Thread panel** — fixed 300px
- **AI panel** — fixed 340px
- **Members panel** — fixed 220px
- **Header buttons** — equal-width 12px cells, icon-only, separated by vertical borders

### Diamond Logo
- `w-2 h-2 bg-white rotate-45`
- Glow: `shadow-[0_0_8px_rgba(255,255,255,0.7)]`
- Used in: sidebar logo-node.tsx, AI message mark

### AI Panel Button (Plasma Dot)
- Three states: open (white core + violet plasma + ping ring), hover (white glow), idle (zinc-600)
- No icon — just the plasma dot

### AI Message Style
- Left violet glow bar: `absolute left-0 w-px bg-violet-500/60 shadow-[0_0_8px_2px_rgba(139,92,246,0.4)]`
- Diamond mark: `w-2.5 h-2.5 bg-white rotate-45 shadow-[0_0_10px_3px_rgba(255,255,255,0.5),0_0_20px_6px_rgba(139,92,246,0.3)]`
- Label: `text-violet-300` — "Hazard AI"

### Avatar System
- Circular: `rounded-full`
- Presence dot: `w-2 h-2 rounded-full bg-emerald-500 border-2 border-black` absolute bottom-right

### Colors
```
Background:       black (#000000)
Surface:          zinc-900/30 hover
Border:           zinc-800 structural, zinc-800/20 feed separators
Primary accent:   violet-500 (#8b5cf6)
AI accent:        violet-300 (text), violet-500/60 (glow bar)
Success:          emerald-500
Error:            red-500, red-600
Pending:          opacity-50 + animate-pulse avatar
Text primary:     zinc-100
Text secondary:   zinc-400 / zinc-500
Text muted:       zinc-600 / zinc-700
```

### Code Blocks (message-content.tsx)
- `react-syntax-highlighter` hljs with auto-detection (no language tag needed)
- `atomOneDark` theme
- Header bar: language label left, copy button fades in on hover (`group-hover:opacity-100`)
- Copy button: Check icon + "Copied" on success, 2s timeout
- `pre: ({ children }) => <>{children}</>` — strips default wrapper

---

## ARCHITECTURE

### Data Hierarchy
```
Workspaces → Channels → Messages → Threads → Replies
```

### Folder Structure (Current)
```
hazard/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── verify/page.tsx
│   │   ├── (app)/
│   │   │   ├── [workspace]/
│   │   │   │   ├── [channel]/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── loading.tsx        # Terminal boot sequence (first load) + plasma bar (return)
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   └── create-workspace/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   └── route.ts
│   │   │   └── workspace/
│   │   │       └── join/
│   │   │           └── route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── chat/
│   │   │   ├── message-feed.tsx           # Unified message list, reads from message-store cache
│   │   │   ├── message-composer.tsx       # Optimistic send, confirm/fail/retry via message-store
│   │   │   ├── message-content.tsx        # Markdown + hljs auto-detection + copy button
│   │   │   ├── message-context-menu.tsx   # Right-click menu: quick emojis + Reply + Thread
│   │   │   ├── reaction-button.tsx        # Emoji pills only (no + button)
│   │   │   ├── thread-panel.tsx           # Fixed 300px, no drag resize
│   │   │   ├── threads-button.tsx         # Top bar dropdown, fixed channel_id query
│   │   │   ├── typing-indicator.tsx
│   │   │   ├── ai-message.tsx             # Diamond mark + violet glow bar + violet label
│   │   │   ├── ai-panel.tsx               # Fixed 340px, no drag resize
│   │   │   └── ai-channel-sync.tsx
│   │   ├── sidebar/
│   │   │   ├── app-sidebar.tsx            # Permanent 48px icon rail, useTransition, prefetch on hover
│   │   │   ├── logo-node.tsx              # 2x2 diamond with glow
│   │   │   ├── create-channel-button.tsx  # iconOnly prop
│   │   │   ├── sign-out-button.tsx
│   │   │   ├── ai-panel-button.tsx        # Plasma dot, 3 states
│   │   │   └── workspace-presence.tsx
│   │   └── workspace/
│   │       ├── workspace-picker.tsx
│   │       └── settings-overlay.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   ├── middleware.ts
│   │   │   └── threads.ts
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   └── index.ts
│   │   ├── validations/
│   │   │   └── auth.ts
│   │   └── utils.ts
│   ├── stores/
│   │   ├── message-store.ts               # Multi-channel cache (Record<channelId, Message[]>)
│   │   ├── profile-cache-store.ts         # Profile cache keyed by userId
│   │   ├── boot-store.ts                  # Tracks first boot for loading.tsx
│   │   ├── thread-store.ts
│   │   ├── ai-panel-store.ts
│   │   ├── sidebar-store.ts
│   │   ├── presence-store.ts
│   │   └── reply-store.ts
│   ├── types/
│   │   └── index.ts
│   └── proxy.ts
├── supabase/
│   └── migrations/
├── drizzle.config.ts
├── HAZARD.md
├── HAZARD-AI.md
└── .env.local
```

### Auth Flow
- Supabase Auth (email, no confirmation in dev)
- Database trigger auto-creates profile on signup
- Route protection via `proxy.ts`
- Session managed via cookies (server + browser clients)

### Real-time Strategy
- Supabase Realtime enabled on messages + reactions tables
- reactions table has REPLICA IDENTITY FULL
- messages table has REPLICA IDENTITY FULL
- Typing indicators + "Hazard is thinking..." via Supabase Presence

### RLS Policies (Current — open for dev, tighten before ship)
- profiles: select all authenticated, update own
- workspaces/channels/members: all authenticated (open)
- messages: select/insert all, update/delete own
- workspace_invites: authenticated can read; owner/admin can insert/update

---

## DATABASE SCHEMA (DONE ✓)

### Tables
- `profiles` — extends Supabase auth.users
- `workspaces` — top level organization unit
- `workspace_members` — users ↔ workspaces (roles: owner, admin, member)
- `workspace_invites` — invite links with token, expiry, max_uses, use_count, is_active
- `channels` — belongs to workspace (public/private)
- `channel_members` — users ↔ channels
- `messages` — belongs to channel. Fields: `is_ai`, `parent_message_id`, `thread_id`
- `threads` — belongs to a parent message
- `reactions` — Realtime enabled. REPLICA IDENTITY FULL.
- `files` — uploaded files/images
- `ai_conversations` — AI panel history per user per workspace

---

## STATE MANAGEMENT

### message-store.ts (PRIMARY — multi-channel cache)
```
cache: Record<string, Message[]>   — keyed by channelId
loaded: Record<string, boolean>    — which channels are seeded

Key methods:
- seedChannel(channelId, messages)    — first visit only, no overwrite
- refreshChannel(channelId, messages) — background sync, merges new + keeps pending
- addPending(msg)                     — instant optimistic insert in-place
- confirmMessage(channelId, tempId, realId) — swap tempId→realId, no layout shift
- failMessage(channelId, tempId)      — marks isFailed, shows retry
- retryMessage(channelId, tempId)     — marks isPending again
- realtimeInsert(channelId, msg)      — deduplicates by id AND tempId
- toggleReaction / setReactions / removeReaction
- setReplyCount / incrementReplyCount
```

**Important:** Zustand selectors must return primitives or stable references.
- `loaded` is `Record<string, boolean>` NOT `Set<string>` (Set causes infinite loop)
- `?? []` fallback must be OUTSIDE the selector, not inside

### profile-cache-store.ts
- Caches profiles by userId — zero extra DB queries for known users
- `seedProfiles(profiles[])` — bulk seed from initial messages on mount
- `fetchProfile(userId)` — cache hit = synchronous, miss = one DB query then cached

### boot-store.ts
- `hasBooted: boolean` — tracks if terminal loading sequence has run
- First visit → full terminal boot animation
- Return visits → quick plasma bar only

---

## PERFORMANCE PATTERNS

### Channel Switching (current)
- `useTransition` + `startTransition` wraps `router.push` — keeps current channel interactive
- `router.prefetch` on `onMouseEnter` — data pre-fetched before click
- `message-store` cache — cached channels render instantly from Zustand memory
- Background `refreshChannel` — syncs any missed messages silently

### Next Performance Win (NOT YET IMPLEMENTED)
- **Prefetch all channel messages on workspace layout mount**
- Fire background fetches for every channel when layout loads
- Seed all into message-store cache
- Every channel click instant from first visit

### Optimistic Messages
- Composer calls `addPending` immediately — message appears at `opacity-50` with `animate-pulse` avatar
- After insert: `confirmMessage(tempId, realId)` — swaps ID in-place, opacity-100, zero layout shift
- On failure: `failMessage` → red "failed to send" + retry button
- Realtime INSERT deduplicates against both `id` and `tempId` — no doubles

### AI Channel Context
- `getChannelContext()` in composer reads from local message-store cache
- Zero DB cost before every AI message

---

## UX PATTERNS

### Message Interactions
- **Right-click** on any message → `MessageContextMenu`
  - Quick emoji row (6 common emojis + full picker button)
  - Reply action
  - Create thread action (only if no thread exists)
  - Closes on outside click or Escape
- **No hover buttons** — all actions moved to right-click
- **Reaction pills** — always visible if reactions exist, no + button

### Message States
```
isPending  → opacity-50, avatar animate-pulse, "sending…" label
isFailed   → opacity-40, "failed to send" label, Retry button
confirmed  → opacity-100, full interactions enabled
```

### Loading States
- `loading.tsx` at `(app)/[workspace]/[channel]/loading.tsx`
- First load: terminal boot sequence (diamond pulses, lines typewrite, "Stream Connected")
- Return visits: plasma bar sweeps across top of content area
- Plasma bar keyframe in `globals.css` (Tailwind v4 — no tailwind.config.ts)

### Context Menu Props
- All callback props must end in `Action` suffix (Next.js 16 requirement):
  `onCloseAction`, `onReplyAction`, `onThreadAction`, `onReactAction`

---

## REPLY MODEL (DECIDED ✓)

- **Channel replies** — flat, Discord-style. Click Reply → quote bar in composer → `@mention message`
- **Threads** — optional deep conversation. Right-click → "Create thread"
- **Decided against** `reply_to_message_id` — @mention carries enough context

---

## KEY FEATURES (CORE — BUILD THESE FIRST)

- [x] Authentication (sign up, sign in, sign out)
- [x] Workspaces (create, redirect to existing)
- [x] Channels (create, list, active highlight)
- [x] Messages (send, receive, real-time)
- [x] Auto-scroll to bottom on new messages
- [x] Deployed to Vercel (live in production)
- [x] Markdown rendering
- [x] Syntax highlighted code blocks (hljs auto-detection, atomOneDark, copy button)
- [x] Auto-expanding composer
- [x] Threads with real-time replies
- [x] Emoji reactions with optimistic updates
- [x] Reactions real-time sync across tabs
- [x] Thread reply count indicator with real-time updates
- [x] Typing indicators with Supabase Presence
- [x] Hazard AI — streaming, @hazard detection, violet glow AI message
- [x] AI panel — persistent history, suggestion chips
- [x] User presence (online/offline dots)
- [x] Boxy grid design system — pure black, zinc-800 borders, no rounded fills
- [x] Permanent 48px icon rail sidebar — no collapse
- [x] Diamond logo with glow (logo-node.tsx)
- [x] Plasma dot AI button — 3 states (open/hover/idle)
- [x] Fixed-width panels (Thread 300px, AI 340px, Members 220px)
- [x] Circular avatars with emerald presence dots
- [x] Right-click context menu (reactions, reply, thread)
- [x] Optimistic messages — addPending → confirmMessage/failMessage/retryMessage
- [x] Multi-channel message cache (message-store.ts)
- [x] Profile cache (profile-cache-store.ts) — zero extra DB queries
- [x] useTransition channel switching — current channel stays interactive
- [x] router.prefetch on hover — data ready before click
- [x] Terminal boot loading screen (first load)
- [x] Plasma bar loading (return visits)
- [x] Workspace invites — token-based, expiry, revoke
- [x] Settings overlay — Profile + Workspace, left nav
- [x] Members panel — online presence, role badges

### Next Up
- [ ] Prefetch all channel messages on workspace layout mount (biggest performance win)
- [ ] Unread message counts on channels in sidebar
- [ ] Message edit / delete
- [ ] Toast notifications for errors (failed send, failed reaction, etc.)
- [ ] Search functionality (button exists, no logic)
- [ ] Thread panel optimistic replies
- [ ] Mobile layout

---

## FEATURE BACKLOG (PARKED — DO NOT BUILD YET)

- File Uploads
- E2EE for private channels
- Voice/video calls
- AI code diff panel
- Repo-aware AI context
- Custom bot API
- Mobile app (React Native)
- /ui slash command
- Desktop app (Electron/Tauri)
- Notification preferences
- Message search with filters
- Pinned messages
- Channel analytics
- Workspace billing
- Tighten RLS policies before ship
- Enable email confirmation with Resend (production)
- Husky + Commitlint setup
- Rate limiting for AI (Upstash Redis)
- Workspace switcher in sidebar

---

## OPEN QUESTIONS

- Font choice for UI (not Inter — something with character)
- Upstash Redis free tier enough for early stage?
- Cloudflare R2 vs Supabase Storage to start with?

---

## SESSION LOG

| Session | What We Did |
|---------|-------------|
| 01 | Project vision, tech stack locked, Next.js 15 scaffolded, HAZARD.md created, GitHub + Supabase + Vercel set up |
| 02 | Dependencies, Supabase client setup, Drizzle ORM, full database schema |
| 03 | Auth pages, Supabase trigger for profiles, route protection |
| 04 | Workspace creation, RLS policies, app layout shell |
| 05 | Channel creation, sidebar channel list, channel page layout |
| 06 | Message composer, real-time feed, Supabase Realtime |
| 07 | Active channel highlight, sign out, auto-scroll, deployed to Vercel |
| 08 | Markdown, syntax highlighting, auto-expanding composer, threads, emoji reactions |
| 09 | Reactions real-time sync. Enabled Realtime on reactions. REPLICA IDENTITY FULL. |
| 10 | Thread reply count (real-time). Typing indicators. Hazard AI: API route, @hazard detection, ai-message, ai-panel, ai-panel-store, ai-panel-button, ai-channel-sync |
| 11 | AI response visually grouped under triggering message. Added parent_message_id to messages. |
| 12 | User presence. presence-store.ts. Fixed real-time messages REPLICA IDENTITY FULL. |
| 13 | UI polish: message grouping, reaction animation, collapsible sidebar, AI + Thread panel slide animations. |
| 14 | AI panel empty state, drag-to-resize panels, workspace invites. |
| 15 | Unified settings overlay, Discord-style replies, optional threads, threads dropdown. |
| 16 | Threads lazy creation, members panel, settings RLS fixes. |
| 17 | Auth + workspace picker Vercel-style (pure black, white CTAs). |
| 18 | AI panel redesign, message composer polish, create-channel custom modal. |
| 19 | Full boxy grid design system pivot — pure black, zinc-800 borders, no rounded fills. Permanent 48px icon rail sidebar. Diamond logo. Fixed-width panels (no drag resize). Equal-width icon-only header buttons. Threads popover rewrite with fixed channel_id query. |
| 20 | Circular avatars, subtle borders (zinc-800/20), reaction button redesign (pills only, no + button), presence dot fix, diamond branding in inputs (later removed), plasma AI button (3 states), logo size reduction, textarea alignment fixes. |
| 21 | Right-click context menu (MessageContextMenu) — quick emoji row + full picker + Reply + Thread. Removed all hover action buttons. AI message redesigned: diamond mark + violet left glow bar + violet-300 "Hazard AI" label. Threads button query fixed (cross-reference messages by channel_id). Reaction pills kept, + button removed. |
| 22 | message-content.tsx: switched to hljs (highlight.js) for auto-detection, atomOneDark theme, copy button with hover fade-in, fixed pre wrapper stripping. Optimistic messages: message-store.ts (multi-channel cache, Record<channelId, Message[]>), addPending/confirmMessage/failMessage/retryMessage, zero layout shift in-place swap. profile-cache-store.ts: zero extra DB queries for known users. Fixed Zustand infinite loop (Set→Record for loaded, ?? [] outside selector). Terminal boot loading screen + plasma bar for return visits. useTransition channel switching + router.prefetch on hover. Context menu props require Action suffix (Next.js 16). |

---

> Next session:
> - Prefetch all channel messages on workspace layout mount
> - Unread message counts in sidebar
> - Message edit / delete
> - Toast notifications
> - Search functionality
