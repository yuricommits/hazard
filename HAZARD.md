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
- **shadcn/ui** — component primitives, fully owned
- **Framer Motion** — micro-interactions and animations
- **JetBrains Mono** — font for all code rendering

### Backend & Infrastructure
- **Supabase** — entire backend:
  - PostgreSQL (primary database)
  - Auth (authentication + session management)
  - Realtime (live messages, presence, typing indicators)
  - Storage (file and image uploads)
- **Upstash Redis** — rate limiting and caching
- **Cloudflare R2** — CDN for media uploads

### AI
- **Vercel AI SDK** — streaming, model switching, tool calling
- **Anthropic Claude API** — Hazard AI brain

### Developer Experience
- **Drizzle ORM** — type-safe database schema and queries
- **Zod** — schema validation (forms → API → database)
- **Zustand** — lightweight client state
- **React Hook Form** — form handling
- **nuqs** — URL state (filters, search, threads)

### Code Quality
- **ESLint + Prettier** — consistent code style
- **Husky** — pre-commit hooks
- **Commitlint** — conventional commits

### Deployment
- **Vercel** — frontend + edge functions
- **Supabase Cloud** — managed backend

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
- UI: Next.js font (TBD — not Inter, something with character)
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
Avoids flat message table. Scales cleanly.

### Layout
```
[Left Sidebar 240px] [Middle Panel flex-1] [Right Sidebar 280px collapsible]
```

### Auth Flow
- Supabase Auth (email + OAuth)
- Session managed server-side via Next.js proxy (proxy.ts, exported as `proxy`)
- Row Level Security (RLS) on all Supabase tables

### Real-time Strategy
- Supabase Realtime for messages, presence, typing indicators
- Optimistic UI everywhere — app feels faster than it is

### File Uploads
- Cloudflare R2 via presigned URLs
- Supabase Storage as fallback
- Never upload through the main server

### Rate Limiting
- Upstash Redis on API routes
- Protect against automated scripts

### Security
- E2EE consideration for private channels (future)
- RLS policies on every table
- API keys never stored in messages (scrubbed or warned)

---

## KEY FEATURES (CORE — BUILD THESE FIRST)

- [ ] Authentication (sign up, sign in, sign out)
- [ ] Workspaces (create, join, switch)
- [ ] Channels (create, browse, join)
- [ ] Messages (send, receive, real-time)
- [ ] Threads (reply to message, persistent)
- [ ] Code blocks (syntax highlighted, copy button)
- [ ] Markdown rendering
- [ ] Reactions (emoji, count, who reacted)
- [ ] Slash commands (/deploy, /run, /pr, /ai)
- [ ] Cmd+K search
- [ ] Keyboard-first navigation
- [ ] Git bot integration (PR, CI/CD notifications)
- [ ] Hazard AI (inline, streaming, context-aware)
- [ ] File uploads
- [ ] User presence (online/offline/away)
- [ ] Typing indicators

---

## FEATURE BACKLOG (PARKED — DO NOT BUILD YET)

- E2EE for private channels
- Voice/video calls
- AI code diff panel
- Repo-aware AI context
- Custom bot API
- Mobile app (React Native)
- /ui slash command — generate UI components inline (big future feature)
- IDE-like environment with AI as first-class citizen (separate big project)
- Desktop app (Electron/Tauri)
- Notification preferences
- Message search with filters
- Pinned messages
- Channel analytics
- Workspace billing

---

## FOLDER STRUCTURE (PLANNED)

```
hazard/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Auth routes group
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (app)/                  # Main app routes group
│   │   │   ├── [workspace]/
│   │   │   │   ├── [channel]/
│   │   │   │   └── layout.tsx
│   │   │   └── layout.tsx
│   │   ├── api/                    # API routes
│   │   │   ├── ai/
│   │   │   └── webhooks/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives
│   │   ├── chat/                   # Chat-specific components
│   │   ├── sidebar/                # Sidebar components
│   │   ├── composer/               # Message composer
│   │   └── shared/                 # Shared across features
│   ├── lib/
│   │   ├── supabase/               # Supabase clients + helpers
│   │   ├── ai/                     # AI SDK setup
│   │   ├── redis/                  # Upstash Redis
│   │   └── utils.ts                # Shared utilities
│   ├── hooks/                      # Custom React hooks
│   ├── stores/                     # Zustand stores
│   ├── types/                      # TypeScript types
│   └── styles/                     # Global styles
├── supabase/
│   ├── schema.sql                  # Database schema
│   ├── seed.sql                    # Dev seed data
│   └── migrations/                 # Schema migrations
├── HAZARD.md                       # THIS FILE
├── FEATURES.md                     # Extended feature ideas
└── .env.local                      # Environment variables (never commit)
```

---

## DATABASE SCHEMA (DONE ✓)

### Tables
- `profiles` — extends Supabase auth.users
- `workspaces` — top level organization unit
- `workspace_members` — users ↔ workspaces (roles: owner, admin, member)
- `channels` — belongs to workspace (public/private)
- `channel_members` — users ↔ channels
- `messages` — belongs to channel, optionally belongs to thread
- `threads` — belongs to a parent message
- `reactions` — belongs to message, belongs to user
- `files` — uploaded files/images, linked to messages

---

## BUILD PROGRESS

### Done
- [x] Next.js 15 scaffolded (App Router, TypeScript, Tailwind)
- [x] HAZARD.md created
- [x] GitHub repository created (private)
- [x] Supabase project created (free tier, RLS enabled)
- [x] Vercel project created and connected to GitHub
- [x] .env.local configured with Supabase credentials
- [x] Drizzle ORM installed and configured
- [x] Database schema written (9 tables)
- [x] Migration generated and pushed to Supabase

### Next Up
- [ ] Authentication (sign up, sign in, sign out)
- [ ] shadcn/ui setup
- [ ] Login and signup pages

---

## OPEN QUESTIONS

- Font choice for UI (not Inter — something with more character)
- Upstash Redis free tier enough for early stage?
- Cloudflare R2 vs Supabase Storage to start with?
- shadcn/ui theme customization approach

---

## SESSION LOG

| Session | What We Did |
|---------|-------------|
| 01 | Project vision, tech stack locked, Next.js 15 scaffolded, HAZARD.md created, GitHub + Supabase + Vercel set up, credentials secured |
| 02 | Installed dependencies, Supabase client setup (browser, server, proxy), Drizzle ORM configured, full database schema written and migrated |

---

> Last updated: Session 01
> Next session: Start with dependency installation + Supabase schema design
