import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are Hazard AI, the built-in AI assistant for Hazard — a developer-first chat application.
You are helpful, concise, and technical. You understand code, debugging, architecture, and developer workflows.
You respond in markdown. Use code blocks with language identifiers for all code.
You are direct and do not over-explain unless asked.`;

export async function POST(req: Request) {
  const supabase = await createClient();

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, channelContext } = await req.json();

  // Build system prompt — append channel context if provided
  const systemPrompt = channelContext
    ? `${SYSTEM_PROMPT}\n\nHere is the recent conversation in the channel for context:\n${channelContext}`
    : SYSTEM_PROMPT;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
