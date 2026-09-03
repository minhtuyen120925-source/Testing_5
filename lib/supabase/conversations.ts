import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ConversationSummary {
  id: string;
  channel: string;
  startedAt: string;
  messageCount: number;
}

export interface ConversationMessage {
  id: string;
  sender: "user" | "bot";
  content: string;
  createdAt: string;
}

export interface ConversationDetail {
  id: string;
  channel: string;
  startedAt: string;
  messages: ConversationMessage[];
}

interface ConversationListRow {
  id: string;
  channel: string;
  started_at: string;
  chat_messages: { count: number }[];
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, channel, started_at, chat_messages(count)")
    .order("started_at", { ascending: false })
    .returns<ConversationListRow[]>();

  if (error) {
    console.error("Supabase list conversations error:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    channel: row.channel,
    startedAt: row.started_at,
    messageCount: row.chat_messages[0]?.count ?? 0,
  }));
}

interface ConversationRow {
  id: string;
  channel: string;
  started_at: string;
}

interface ChatMessageRow {
  id: string;
  sender: "user" | "bot";
  content: string;
  created_at: string;
}

export async function getConversation(id: string): Promise<ConversationDetail | null> {
  const supabase = createSupabaseServerClient();

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("id, channel, started_at")
    .eq("id", id)
    .maybeSingle()
    .returns<ConversationRow | null>();

  if (convError || !conversation) {
    if (convError) console.error("Supabase get conversation error:", convError);
    return null;
  }

  const { data: messages, error: msgError } = await supabase
    .from("chat_messages")
    .select("id, sender, content, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .returns<ChatMessageRow[]>();

  if (msgError) {
    console.error("Supabase get conversation messages error:", msgError);
    return null;
  }

  return {
    id: conversation.id,
    channel: conversation.channel,
    startedAt: conversation.started_at,
    messages: (messages ?? []).map((m) => ({
      id: m.id,
      sender: m.sender,
      content: m.content,
      createdAt: m.created_at,
    })),
  };
}
