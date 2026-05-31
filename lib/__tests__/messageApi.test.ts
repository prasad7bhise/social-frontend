import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSession } from "next-auth/react";
import {
  createOrGetConversation,
  markMessagesAsRead,
  getConversation,
  updateMessage,
  getConversations,
  getMessages,
  sendMessage,
  getMessageRequests,
  acceptMessageRequest,
  declineMessageRequest,
  addReaction,
  removeReaction,
} from "@/lib/api/messageApi";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  (getSession as any).mockResolvedValue({ accessToken: "test-token" });
});

describe("messageApi", () => {
  it("01_createOrGetConversation_sends_POST", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ conversation: { id: 1 } }),
    });

    const result = await createOrGetConversation(2, "Hello");

    expect(result.conversation?.id).toBe(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/conversations/2",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ content: "Hello" }),
      })
    );
  });

  it("02_markMessagesAsRead_sends_PATCH", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve() });

    await markMessagesAsRead(1);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/conversations/1/read",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("03_getConversation_fetches_by_id", async () => {
    const conv = { id: 1, participant: { id: 2 } };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(conv),
    });

    const result = await getConversation(1);

    expect(result.id).toBe(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/conversations/1",
      expect.any(Object)
    );
  });

  it("04_updateMessage_sends_PATCH_with_body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, content: "Edited" }),
    });

    const result = await updateMessage(1, "Edited");

    expect(result.content).toBe("Edited");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/messages/1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ content: "Edited" }),
      })
    );
  });

  it("05_getConversations_returns_list", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 1 }, { id: 2 }]),
    });

    const result = await getConversations();

    expect(result).toHaveLength(2);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/conversations",
      expect.any(Object)
    );
  });

  it("06_getMessages_fetches_with_pagination", async () => {
    const data = { content: [{ id: 1, content: "Hi" }] };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    });

    const result = await getMessages(1, 0, 50);

    expect(result.content).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/conversations/1/messages?page=0&size=50",
      expect.any(Object)
    );
  });

  it("07_sendMessage_sends_POST", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, content: "Hey" }),
    });

    const result = await sendMessage(1, "Hey");

    expect(result.content).toBe("Hey");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/conversations/1/messages",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ content: "Hey" }),
      })
    );
  });

  it("08_getMessageRequests_returns_list", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 1, status: "PENDING" }]),
    });

    const result = await getMessageRequests();

    expect(result).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/message-requests",
      expect.any(Object)
    );
  });

  it("09_acceptMessageRequest_sends_POST", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 10 }),
    });

    const result = await acceptMessageRequest(1);

    expect(result.id).toBe(10);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/message-requests/1/accept",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("10_declineMessageRequest_sends_POST", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve() });

    await declineMessageRequest(1);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/message-requests/1/decline",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("11_addReaction_sends_POST_with_emoji", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, emoji: "👍" }),
    });

    const result = await addReaction(1, "👍");

    expect(result.emoji).toBe("👍");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/messages/1/reactions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ emoji: "👍" }),
      })
    );
  });

  it("12_removeReaction_sends_DELETE", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve() });

    await removeReaction(1, "👍");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/messages/1/reactions/%F0%9F%91%8D",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
