# 🤖 Hazard AI — Spec & Architecture

> This document defines the vision, behavior, and implementation plan for Hazard AI.
> Read this before touching any AI-related code.

---

## VISION

Hazard AI is a first-class citizen in the Hazard chat experience — not a bolted-on chatbot, but a native developer intelligence layer. It lives in the conversation, speaks when spoken to, and understands context.

---

## INTERACTION MODEL

### 1. @hazard mention in any channel ✓ BUILT
- User types `@hazard <prompt>` in the message composer
- AI response streams directly into the channel feed as a distinct AI message
- Any channel can invoke AI — no dedicated channel required
- Visible to ALL members in the channel — collaborative by design
- Triggers a "Hazard is thinking..." typing indicator while generating

### 2. Dedicated AI panel ✓ BUILT
- Opens from "Hazard AI" button in sidebar
- Private conversation history — one persistent thread per user per workspace
- History saved to `ai_conversations` table — survives refresh
- "Clear history" button in panel header
- Context-aware by default: picks up last 10 messages from current channel
- Context pill shows active channel — click X to go private
- Switching channels updates context automatically

---

## CAPABILITIES (IN ORDER OF IMPLEMENTATION)

| Priority | Capability | Status |
|----------|-----------|--------|
| 1 | Stream responses | ✓ Built |
| 2 | General chat | ✓ Built (needs credits to test) |
| 3 | Write and explain code | ✓ Built (needs credits to test) |
| 4 | Channel context | ✓ Built |

---

## VISUAL DESIGN

### AI Message in Feed ✓ BUILT
- Left-side accent bar: violet-500 → cyan-400 gradient
- Avatar: gradient circle with layers icon
- Name: "Hazard AI" in violet gradient text
- Streaming cursor: animate-pulse vertical bar while streaming

### "Hazard is thinking..." indicator ✓ BUILT
- Violet animated dots + gradient text
- Appears above composer, visible to all channel members
- Uses same Supabase Presence channel as typing indicators

### AI Panel ✓ BUILT
- w-72, sits alongside thread panel
- Gradient header icon + name
- Context pill with dismiss X
- Streaming response with dots while waiting, cursor while generating
- Disabled input while streaming

---

## TECHNICAL ARCHITECTURE

### Stack
- **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`) ✓ installed
- **Anthropic Claude API** — `claude-sonnet-4-6`
- **Next.js Route Handler** — `src/app/api/ai/route.ts` ✓ built

### API Route
- POST `/api/ai`
- Body: `{ messages: CoreMessage[], channelContext?: string }`
- Auth-gated — returns 401 if not logged in
- Returns streaming text via `toTextStreamResponse()`

### Database
- `messages.is_ai` — boolean flag for AI channel messages ✓
- `ai_conversations` — panel history per user per workspace ✓

### Key Files
- `src/app/api/ai/route.ts` — streaming endpoint
- `src/components/chat/ai-message.tsx` — feed AI message component
- `src/components/chat/ai-panel.tsx` — side panel
- `src/components/chat/ai-channel-sync.tsx` — syncs channel to store
- `src/components/sidebar/ai-panel-button.tsx` — opens panel
- `src/stores/ai-panel-store.ts` — Zustand store

---

## SYSTEM PROMPT

```
You are Hazard AI, the built-in AI assistant for Hazard — a developer-first chat application.
You are helpful, concise, and technical. You understand code, debugging, architecture, and developer workflows.
You respond in markdown. Use code blocks with language identifiers for all code.
You are direct and do not over-explain unless asked.
```

---

## KNOWN ISSUES / NEXT UP

- [ ] Add Anthropic credits and test full flow end to end
- [ ] Connect @hazard response visually to the triggering message (reply-style grouping)
- [ ] AI panel context pill timing fix — panel opens before AiChannelSync fires
- [ ] Rate limiting (Upstash Redis — parked)

---

> Last updated: Session 10
> Status: Built — pending credits to test
