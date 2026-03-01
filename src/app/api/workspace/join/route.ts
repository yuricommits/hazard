import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  // Look up the invite
  const { data: invite, error: inviteError } = await supabase
    .from("workspace_invites")
    .select("id, workspace_id, is_active, expires_at, max_uses, use_count")
    .eq("token", token)
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  // Validate invite is active
  if (!invite.is_active) {
    return NextResponse.json(
      { error: "This invite link has been revoked" },
      { status: 400 },
    );
  }

  // Validate expiry
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This invite link has expired" },
      { status: 400 },
    );
  }

  // Validate max uses
  if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
    return NextResponse.json(
      { error: "This invite link has reached its maximum uses" },
      { status: 400 },
    );
  }

  // Check if user is already a member
  const { data: existing } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", invite.workspace_id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Already a member — just get the slug and redirect them in
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("slug")
      .eq("id", invite.workspace_id)
      .single();

    return NextResponse.json({ slug: workspace?.slug });
  }

  // Add user as member
  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: invite.workspace_id,
      user_id: user.id,
      role: "member",
    });

  if (memberError) {
    return NextResponse.json(
      { error: "Failed to join workspace" },
      { status: 500 },
    );
  }

  // Increment use_count
  await supabase
    .from("workspace_invites")
    .update({ use_count: invite.use_count + 1 })
    .eq("id", invite.id);

  // Get workspace slug for redirect
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("slug")
    .eq("id", invite.workspace_id)
    .single();

  return NextResponse.json({ slug: workspace?.slug });
}
