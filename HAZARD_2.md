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
  - PostgreSQL (primary database, 9 tables)
  - Auth (email auth, no email confirmation in dev)
  - Realtime (live messages working across tabs)
  - Storage (not yet implemented)
- **Upstash Redis** — rate limiting and caching (not yet implemented)
- **Cloudflare R2** — CDN for media uploads (not yet implemented)

### AI
- **Vercel AI SDK** — streaming, model switching, tool calling (not yet implemented)
- **Anthropic Claude API** — Hazard AI brain (not yet implemented)

### Developer Experience
- **Drizzle ORM** — type-safe database schema and queries
- **Zod** — schema validation (forms → API → database)
- **Zustand** — lightweight client state (not yet implemented)
- **React Hook Form** — form handling
- **nuqs** — URL state management (not yet implemented)

### Code Quality
- **ESLint + Prettier** — consistent code style
- **Husky** — pre-commit hooks (not yet implemented)
- **Commitlint** — conventional commits (not yet implemented)

### Deployment
- **Vercel** — frontend + edge functions (project created, not yet deployed)
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
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives
│   │   ├── chat/
│   │   │   ├── message-feed.tsx    # real-time message feed + reactions real-time
│   │   │   └── message-composer.tsx # send messages
│   │   └── sidebar/
│   │       ├── channel-list.tsx    # active channel highlight
│   │       ├── create-channel-button.tsx
│   │       └── sign-out-button.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # browser client
│   │   │   ├── server.ts           # server client
│   │   │   └── middleware.ts       # session refresh helper
│   │   ├── db/
│   │   │   ├── schema.ts           # Drizzle schema (9 tables)
│   │   │   └── index.ts            # Drizzle client
│   │   ├── validations/
│   │   │   └── auth.ts             # Zod schemas for auth forms
│   │   └── utils.ts                # shadcn utility
│   ├── types/
│   │   └── index.ts                # TypeScript types from Drizzle
│   └── proxy.ts                    # Next.js 16 route protection
├── supabase/
│   └── migrations/                 # Generated SQL migrations
├── drizzle.config.ts
├── HAZARD.md
└── .env.local
```

### Auth Flow
- Supabase Auth (email, no confirmation in dev)
- Database trigger auto-creates profile on signup
- Route protection via `proxy.ts` (Next.js 16)
- Session managed via cookies (server + browser clients)

### Real-time Strategy
- Supabase Realtime enabled on messages table
- Supabase Realtime enabled on reactions table (added session 09)
- reactions table has REPLICA IDENTITY FULL (required for DELETE events)
- Client subscribes to INSERT events filtered by channel_id
- Reactions: INSERT re-fetches from DB for accuracy; DELETE finds by reaction id in local state
- Initial messages fetched server-side, passed as props
- New messages appended to state via Realtime subscription

### RLS Policies (Current — open for dev, tighten before ship)
- profiles: select own, update own
- workspaces: all authenticated users (open)
- workspace_members: all authenticated users (open)
- channels: all authenticated users (open)
- channel_members: all authenticated users (open)
- messages: select/insert all, update/delete own

---

## DATABASE SCHEMA (DONE ✓)

### Tables
- `profiles` — extends Supabase auth.users (trigger auto-creates on signup)
- `workspaces` — top level organization unit
- `workspace_members` — users ↔ workspaces (roles: owner, admin, member)
- `channels` — belongs to workspace (public/private)
- `channel_members` — users ↔ channels
- `messages` — belongs to channel, real-time enabled
- `threads` — belongs to a parent message
- `reactions` — belongs to message, belongs to user. Realtime enabled. REPLICA IDENTITY FULL.
- `files` — uploaded files/images, linked to messages

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
- [x] Reactions real-time sync across tabs (no page refresh needed)

### Next Up
- [ ] Thread reply count indicator on messages
- [ ] Typing indicators
- [ ] User presence (online/offline)
- [ ] Hazard AI integration
- [ ] UI polish pass with v0 design
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
- /ui slash command — generate UI components inline
- IDE-like environment with AI as first-class citizen (separate big project)
- Desktop app (Electron/Tauri)
- Notification preferences
- Message search with filters
- Pinned messages
- Channel analytics
- Workspace billing
- Tighten RLS policies before ship
- Move all SQL to supabase/policies.sql
- Enable email confirmation with Resend (production)
- Husky + Commitlint setup
- Custom scrollbar styling (hide default, subtle custom)

---

## OPEN QUESTIONS

- Font choice for UI (not Inter — something with character)
- Upstash Redis free tier enough for early stage?
- Cloudflare R2 vs Supabase Storage to start with?

---

## SESSION LOG

| Session | What We Did |
|---------|-------------|
| 01 | Project vision, tech stack locked, Next.js 15 scaffolded, HAZARD.md created, GitHub + Supabase + Vercel set up, credentials secured |
| 02 | Installed dependencies, Supabase client setup (browser, server, proxy), Drizzle ORM configured, full database schema written and migrated |
| 03 | Auth pages built, Supabase trigger for profiles, route protection working, full auth flow tested |
| 04 | Workspace creation, RLS policies, app layout shell, smart home redirect |
| 05 | Channel creation, sidebar channel list, channel page layout, composer placeholder |
| 06 | Message composer, real-time feed, Supabase Realtime enabled, messages working across tabs |
| 07 | Active channel highlight, sign out button, auto-scroll, deployed to Vercel |
| 08 | Markdown, syntax highlighting, auto-expanding composer, threads, emoji reactions with optimistic updates |
| 09 | Reactions real-time sync across tabs. Enabled Realtime on reactions table. Set REPLICA IDENTITY FULL. INSERT re-fetches from DB; DELETE finds reaction by id in local state. Removed router.refresh() from reaction-button.tsx |

---

> Last updated: Session 09
> Next session:
- Thread reply count indicator on messages
- Typing indicators
- Then Hazard AI
