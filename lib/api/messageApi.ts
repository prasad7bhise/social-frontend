import { getSession } from "next-auth/react";
import type {
  ConversationDTO,
  MessageDTO,
  MessageReactionDTO,
  MessageRequestDTO,
  SendMessageRequest,
} from "@/lib/types/messaging";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

async function authFetch(path: string, options: RequestInit = {}) {
  const session = await getSession();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    Authorization: `Bearer ${session?.accessToken}`,
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res;
}

export async function createOrGetConversation(
  recipientId: number,
  content: string
): Promise<{ conversation?: ConversationDTO; request?: MessageRequestDTO }> {
  const res = await authFetch(`/api/conversations/${recipientId}`, {
    method: "POST",
    body: JSON.stringify({ content } satisfies SendMessageRequest),
  });
  return res.json();
}

export async function markMessagesAsRead(conversationId: number): Promise<void> {
  await authFetch(`/api/conversations/${conversationId}/read`, { method: "PATCH" });
}

export async function getConversation(
  conversationId: number
): Promise<ConversationDTO> {
  const res = await authFetch(`/api/conversations/${conversationId}`);
  return res.json();
}

export async function updateMessage(
  messageId: number,
  content: string
): Promise<MessageDTO> {
  const res = await authFetch(`/api/messages/${messageId}`, {
    method: "PATCH",
    body: JSON.stringify({ content } satisfies SendMessageRequest),
  });
  return res.json();
}

export async function getConversations(): Promise<ConversationDTO[]> {
  const res = await authFetch("/api/conversations");
  return res.json();
}

export async function getMessages(
  conversationId: number,
  page = 0,
  size = 50
): Promise<{ content: MessageDTO[] }> {
  const res = await authFetch(
    `/api/conversations/${conversationId}/messages?page=${page}&size=${size}`
  );
  return res.json();
}

export async function sendMessage(
  conversationId: number,
  content: string
): Promise<MessageDTO> {
  const res = await authFetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content } satisfies SendMessageRequest),
  });
  return res.json();
}

export async function getMessageRequests(): Promise<MessageRequestDTO[]> {
  const res = await authFetch("/api/message-requests");
  return res.json();
}

export async function acceptMessageRequest(
  requestId: number
): Promise<ConversationDTO> {
  const res = await authFetch(`/api/message-requests/${requestId}/accept`, {
    method: "POST",
  });
  return res.json();
}

export async function declineMessageRequest(requestId: number): Promise<void> {
  await authFetch(`/api/message-requests/${requestId}/decline`, {
    method: "POST",
  });
}

export async function addReaction(messageId: number, emoji: string): Promise<MessageReactionDTO> {
  const res = await authFetch(`/api/messages/${messageId}/reactions`, {
    method: "POST",
    body: JSON.stringify({ emoji }),
  });
  return res.json();
}

export async function removeReaction(messageId: number, emoji: string): Promise<void> {
  await authFetch(`/api/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, {
    method: "DELETE",
  });
}
