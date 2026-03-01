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
- User's message saved first, its ID captured as `parent_message_id`
- AI response saved with `is_ai: true` and `parent_message_id` linking it to the trigger
- AI response renders indented below the triggering message with a connector line
- Visible to ALL members — collaborative by design
- "Hazard is thinking..." indicator shown while generating

### 2. Dedicated AI panel ✓ BUILT
- Opens from "Hazard AI" button in sidebar
- Persistent history per user per workspace (saved to `ai_conversations` table)
- "Clear history" button
- Context-aware: picks up last 10 messages from current channel
- Context pill shows active channel — click X to go private
- Streaming responses with animated cursor

---

## CAPABILITIES

| Priority | Capability | Status |
|----------|-----------|--------|
| 1 | Stream responses | ✓ Built |
| 2 | General chat | ✓ Built (needs credits to test) |
| 3 | Write and explain code | ✓ Built (needs credits to test) |
| 4 | Channel context | ✓ Built |

---

## VISUAL DESIGN ✓ BUILT

### AI Message in Feed
- Left-side accent bar: violet-500 → cyan-400 gradient
- Avatar: gradient circle with layers icon
- Name: "Hazard AI" in violet gradient text
- When grouped: indented with `ml-11 pl-4 border-l-2 border-zinc-800` connector

### "Hazard is thinking..." indicator
- Violet animated dots + gradient text
- Appears above composer, visible to all via Supabase Presence

### AI Panel
- w-72, sits alongside thread panel
- Gradient header + context pill
- Streaming with dots → cursor → done

---

## TECHNICAL ARCHITECTURE

### API Route — `src/app/api/ai/route.ts`
- POST `/api/ai`
- Body: `{ messages: CoreMessage[], channelContext?: string }`
- Auth-gated (401 if not logged in)
- Model: `claude-sonnet-4-6` via `@ai-sdk/anthropic`
- Returns streaming text via `toTextStreamResponse()`

### Database
- `messages.is_ai` — boolean flag for AI channel messages
- `messages.parent_message_id` — links AI response to triggering @hazard message
- `ai_conversations` — panel history per user per workspace

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

- [ ] Test full flow end to end with Anthropic credits
- [ ] AI panel context pill timing fix — panel opens before AiChannelSync fires
- [ ] Rate limiting (Upstash Redis — parked)

---

> Last updated: Session 11
> Status: Built — pending Anthropic credits to test end to end
