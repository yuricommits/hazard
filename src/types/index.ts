import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  profiles,
  workspaces,
  workspaceMembers,
  channels,
  channelMembers,
  messages,
  threads,
  reactions,
  files,
} from "@/lib/db/schema";

// Select types — shape of data when reading from database
export type Profile = InferSelectModel<typeof profiles>;
export type Workspace = InferSelectModel<typeof workspaces>;
export type WorkspaceMember = InferSelectModel<typeof workspaceMembers>;
export type Channel = InferSelectModel<typeof channels>;
export type ChannelMember = InferSelectModel<typeof channelMembers>;
export type Message = InferSelectModel<typeof messages>;
export type Thread = InferSelectModel<typeof threads>;
export type Reaction = InferSelectModel<typeof reactions>;
export type File = InferSelectModel<typeof files>;

// Insert types — shape of data when writing to database
export type NewProfile = InferInsertModel<typeof profiles>;
export type NewWorkspace = InferInsertModel<typeof workspaces>;
export type NewWorkspaceMember = InferInsertModel<typeof workspaceMembers>;
export type NewChannel = InferInsertModel<typeof channels>;
export type NewChannelMember = InferInsertModel<typeof channelMembers>;
export type NewMessage = InferInsertModel<typeof messages>;
export type NewThread = InferInsertModel<typeof threads>;
export type NewReaction = InferInsertModel<typeof reactions>;
export type NewFile = InferInsertModel<typeof files>;

// Extended types — data joined with related tables
export type MessageWithAuthor = Message & {
  author: Profile;
  reactions: Reaction[];
  thread?: Thread;
  files?: File[];
};

export type ChannelWithMembers = Channel & {
  members: Profile[];
};

export type WorkspaceWithChannels = Workspace & {
  channels: Channel[];
};

// What's new here:

// InferSelectModel — Drizzle reads our schema and automatically generates the TypeScript type for what a row looks like when fetched. We never write these types manually, Drizzle figures them out
// InferInsertModel — same but for inserting. Some fields like createdAt are optional on insert because the database fills them in automatically
// Extended types at the bottom — these are the real world shapes. When we fetch a message we almost always need the author's profile and reactions with it. These types describe that combined shape
