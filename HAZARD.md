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
- **Next.js 15** — App Router, Server Components, Server Actions
- **TypeScript** — strict mode, non-negotiable
- **Tailwind CSS** — utility-first styling
- **shadcn/ui** — component primitives, fully owned (zinc theme, New York style)
- **Framer Motion** — micro-interactions and animations (not yet implemented)
- **JetBrains Mono** — font for all code rendering (not yet implemented)

### Backend & Infrastructure
- **Supabase** — entire backend:
  - PostgreSQL (primary database, 10 tables)
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
- **Zustand** — lightweight client state
- **React Hook Form** — form handling
- **nuqs** — URL state management (not yet implemented)

### Code Quality
- **ESLint + Prettier** — consistent code style
- **Husky** — pre-commit hooks (not yet implemented)
- **Commitlint** — conventional commits (not yet implemented)

### Deployment
- **Vercel** — frontend + edge functions (live)
- **Supabase Cloud** — managed backend (live)

---

## DESIGN SYSTEM

### Colors
```
Background:       zinc-950  (#09090b)
Surface:          zinc-900  (#18181b)
Surface elevated: zinc-800  (#27272a)
Border:           zinc-700  (#3f3f46)
Primary accent:   violet-500 (#8b5cf6)
AI gradient:      violet-500 → cyan-400
Success:          emerald-500
Error:            red-500
Warning:          amber-500
Text primary:     zinc-50
Text muted:       zinc-400
Diff add:         emerald-950 bg · emerald-400 text
Diff remove:      red-950 bg · red-400 text
```

### Typography
- UI: TBD — not Inter, something with character
- Code: JetBrains Mono

### Design References
- Sidebar density: Linear
- Surface + elevation: Vercel Dashboard
- Code blocks: GitHub + Ray.so
- Command menu: Linear Cmd+K
- AI feel: Vercel v0 / ChatGPT

### Principles
- Borders whisper, never shout (1px, zinc-800)
- Depth through layering, never heavy shadows
- Color carries meaning: violet=primary/AI, emerald=success, red=error, amber=warning
- Spacing: strict 4px base scale
- Every element: default → hover → active states, all designed

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
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   └── create-workspace/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   └── ai/
│   │   │       └── route.ts           # Streaming AI endpoint (Anthropic claude-sonnet-4-6)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                        # shadcn/ui primitives
│   │   ├── chat/
│   │   │   ├── message-feed.tsx       # real-time feed, reactions, reply count, AI grouping
│   │   │   ├── message-composer.tsx   # send messages + @hazard detection
│   │   │   ├── message-content.tsx    # markdown + syntax highlighting
│   │   │   ├── reaction-button.tsx    # emoji reactions with optimistic updates
│   │   │   ├── thread-panel.tsx       # thread replies panel
│   │   │   ├── typing-indicator.tsx   # typing + hazard thinking indicator
│   │   │   ├── ai-message.tsx         # distinct AI message component
│   │   │   ├── ai-panel.tsx           # dedicated AI side panel
│   │   │   └── ai-channel-sync.tsx    # syncs current channel to AI panel store
│   │   └── sidebar/
│   │       ├── channel-list.tsx
│   │       ├── create-channel-button.tsx
│   │       ├── sign-out-button.tsx
│   │       └── ai-panel-button.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   ├── middleware.ts
│   │   │   └── threads.ts
│   │   ├── db/
│   │   │   ├── schema.ts              # Drizzle schema (10 tables)
│   │   │   └── index.ts
│   │   ├── validations/
│   │   │   └── auth.ts
│   │   └── utils.ts
│   ├── stores/
│   │   ├── thread-store.ts
│   │   └── ai-panel-store.ts
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
- Typing indicators + "Hazard is thinking..." via Supabase Presence

### RLS Policies (Current — open for dev, tighten before ship)
- profiles: select all authenticated, update own
- workspaces/channels/members: all authenticated (open)
- messages: select/insert all, update/delete own

---

## DATABASE SCHEMA (DONE ✓)

### Tables
- `profiles` — extends Supabase auth.users
- `workspaces` — top level organization unit
- `workspace_members` — users ↔ workspaces (roles: owner, admin, member)
- `channels` — belongs to workspace (public/private)
- `channel_members` — users ↔ channels
- `messages` — belongs to channel. Fields: `is_ai` (AI flag), `parent_message_id` (links AI response to triggering message), `thread_id`
- `threads` — belongs to a parent message
- `reactions` — Realtime enabled. REPLICA IDENTITY FULL.
- `files` — uploaded files/images
- `ai_conversations` — AI panel history per user per workspace

---

## KEY FEATURES (CORE — BUILD THESE FIRST)

- [x] Authentication (sign up, sign in, sign out)
- [x] Workspaces (create, redirect to existing)
- [x] Channels (create, list, active highlight)
- [x] Messages (send, receive, real-time)
- [x] Auto-scroll to bottom on new messages
- [x] Sign out button
- [x] Deployed to Vercel (live in production)
- [x] Markdown rendering
- [x] Syntax highlighted code blocks (vscDarkPlus theme)
- [x] Auto-expanding composer
- [x] Threads with real-time replies
- [x] Emoji reactions with optimistic updates
- [x] Reactions real-time sync across tabs
- [x] Thread reply count indicator with real-time updates
- [x] Typing indicators with Supabase Presence
- [x] Hazard AI — API route, @hazard detection, streaming, ai-message component
- [x] AI panel — persistent history, context pill, streaming replies
- [x] AI response visually grouped under triggering message (parent_message_id)
- [x] User presence (online/offline)

### Next Up
- [ ] Test full AI flow end to end with Anthropic credits
- [ ] AI panel context pill timing fix (opens before channel syncs)
- [ ] UI polish pass
- [ ] Slash commands (/deploy, /run, /pr, /ai)
- [ ] Cmd+K search
- [ ] Keyboard-first navigation
- [ ] Git bot integration
- [ ] File uploads

---

## FEATURE BACKLOG (PARKED — DO NOT BUILD YET)

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
- Custom scrollbar styling
- Rate limiting for AI (Upstash Redis)
- Sliding panels (thread + AI) — shadcn Sheet + Framer Motion

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
| 11 | AI response visually grouped under triggering message. Added parent_message_id to messages. Composer captures message ID and passes as parent_message_id on AI response. Feed builds aiResponseMap and renders AI inline below parent. Reverted to Anthropic. |
| 12 | User presence. presence-store.ts (Zustand), WorkspacePresence component (workspace-level Supabase Presence channel). Online dot on sidebar user row + message avatars. Panels (thread + AI) flagged for Framer Motion + shadcn Sheet polish later. |
| 12 | ... + Fixed real-time messages: removed double filter on Realtime subscription, added REPLICA IDENTITY FULL to messages table. |

---

> Last updated: Session 12
> Next session:
> - UI polish pass
> - AI panel context pill timing fix
> - Cmd+K search or slash commands
