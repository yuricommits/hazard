import { createClient } from "@/lib/supabase/client";

export async function getOrCreateThread(messageId: string, userId: string) {
  const supabase = createClient();

  // Check if thread already exists for this message
  const { data: existing } = await supabase
    .from("threads")
    .select("id")
    .eq("message_id", messageId)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create a new thread
  const { data: created, error } = await supabase
    .from("threads")
    .insert({
      message_id: messageId,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) return null;

  return created.id;
}

// What this does:

// First checks if a thread already exists for the message
// If yes — returns the existing thread ID, no duplicate created
// If no — creates a new thread and returns its ID
// This is called "get or create" pattern — idempotent, safe to call multiple times
