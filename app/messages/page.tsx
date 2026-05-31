"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { SocialLogo } from "../components/SocialLogo";
import { EmojiPickerButton } from "../components/EmojiPickerButton";
import {
  createOrGetConversation,
  getConversations,
  getMessages,
  sendMessage,
  updateMessage,
  markMessagesAsRead,
  addReaction,
  removeReaction,
  getMessageRequests,
  acceptMessageRequest,
  declineMessageRequest,
} from "@/lib/api/messageApi";
import { getMessageSuggestions, searchUsers } from "@/lib/api/profileApi";
import { getUnreadCount } from "@/lib/api/notificationApi";
import type { UserInfoDTO } from "@/lib/types/feed";
import type { ConversationDTO, MessageDTO, MessageRequestDTO } from "@/lib/types/messaging";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function mediaUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString();
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-900"><p className="text-zinc-500">Loading...</p></div>}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });
  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [requests, setRequests] = useState<MessageRequestDTO[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [showRequests, setShowRequests] = useState(false);
  const [sending, setSending] = useState(false);
  const [startUserId, setStartUserId] = useState<number | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [startUserInfo, setStartUserInfo] = useState<{ id: number; firstName: string; lastName: string; avatarUrl?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserInfoDTO[]>([]);
  const [suggestions, setSuggestions] = useState<UserInfoDTO[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<number | null>(null);
  const reactionRef = useRef<HTMLDivElement | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadConversations();
    loadRequests();
    getMessageSuggestions().then(setSuggestions).catch(() => {});
    (async () => {
      try {
        const { getProfile } = await import("@/lib/api/profileApi");
        const profile = await getProfile();
        setCurrentUserId(profile.id);
      } catch {}
    })();
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const convIdParam = searchParams.get("convId");
    const userIdParam = searchParams.get("userId");
    if (convIdParam) {
      const cid = Number(convIdParam);
      setSelectedConvId(cid);
      markMessagesAsRead(cid).catch(() => {});
      loadConversations();
    } else if (userIdParam) {
      const uid = Number(userIdParam);
      if (conversations.length > 0) {
        const existing = conversations.find((c) => c.participant?.id === uid);
        if (existing) {
          setSelectedConvId(existing.id);
          return;
        }
      }
      setStartUserId(uid);
    }
  }, [status, conversations, searchParams]);

  useEffect(() => {
    if (startUserId && !startUserInfo) {
      (async () => {
        try {
          const { getUserProfile } = await import("@/lib/api/profileApi");
          const profile = await getUserProfile(startUserId);
          setStartUserInfo({
            id: profile.id,
            firstName: profile.firstName ?? "",
            lastName: profile.lastName ?? "",
            avatarUrl: profile.avatarUrl,
          });
        } catch {
          setStartUserInfo({ id: startUserId, firstName: "User", lastName: `#${startUserId}`, avatarUrl: undefined });
        }
      })();
    }
  }, [startUserId, startUserInfo]);

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId);
    }
  }, [selectedConvId]);

  useEffect(() => {
    if (!selectedConvId) return;
    const interval = setInterval(() => {
      getMessages(selectedConvId)
        .then((data) => setMessages(data.content ?? []))
        .catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedConvId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (reactionRef.current && !reactionRef.current.contains(e.target as Node)) {
        setActiveReactionMsgId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConversations() {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(convId: number) {
    try {
      const [data] = await Promise.all([
        getMessages(convId),
        markMessagesAsRead(convId).catch(() => {}),
      ]);
      setMessages(data.content ?? []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadRequests() {
    try {
      const data = await getMessageRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      if (startUserId && !selectedConvId) {
        const result = await createOrGetConversation(startUserId, text);
        if (result.conversation) {
          setStartUserId(null);
          setStartUserInfo(null);
          setConversations((prev) => [result.conversation!, ...prev]);
          setSelectedConvId(result.conversation.id);
        } else {
          alert("This user requires a message request. It has been sent.");
          setStartUserId(null);
          setStartUserInfo(null);
        }
      } else if (selectedConvId) {
        const msg = await sendMessage(selectedConvId, text);
        setMessages((prev) => [msg, ...prev]);
        loadConversations();
      }
      setInput("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  async function handleEditMessage(msgId: number) {
    const text = editingContent.trim();
    if (!text) return;
    try {
      const updated = await updateMessage(msgId, text);
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, content: updated.content } : m)));
      setEditingMsgId(null);
      setEditingContent("");
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAcceptRequest(requestId: number) {
    try {
      const conv = await acceptMessageRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setConversations((prev) => [conv, ...prev]);
      setSelectedConvId(conv.id);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeclineRequest(requestId: number) {
    try {
      await declineMessageRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleLogout() {
    const s = session as any;
    await signOut({ redirect: false });
    const logoutUrl =
      "http://localhost:8081/realms/social-realm/protocol/openid-connect/logout" +
      `?id_token_hint=${s?.idToken ?? ""}` +
      "&post_logout_redirect_uri=http://localhost:3000";
    window.location.href = logoutUrl;
  }

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-900">
      {/* Left sidebar */}
      <div className="flex w-80 flex-col border-r border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <Link href="/feed" className="flex items-center gap-2">
            <svg className="h-5 w-5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <SocialLogo className="h-5 text-zinc-900 dark:text-white" />
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Log out
          </button>
        </div>

        <div className="flex items-center border-b border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setShowRequests(false)}
            className={`flex-1 py-2.5 text-sm font-medium transition ${
              !showRequests
                ? "border-b-2 border-sky-500 text-sky-500"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => setShowRequests(true)}
            className={`flex-1 py-2.5 text-sm font-medium transition ${
              showRequests
                ? "border-b-2 border-sky-500 text-sky-500"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Requests {requests.length > 0 && `(${requests.length})`}
          </button>
        </div>

        {!showRequests && (
          <div className="border-b border-zinc-200 px-4 py-2 dark:border-zinc-700">
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
                if (!e.target.value.trim()) { setSearchResults([]); return; }
                searchTimerRef.current = setTimeout(() => {
                  searchUsers(e.target.value.trim()).then(setSearchResults).catch(() => {});
                }, 300);
              }}
              placeholder="Search users by name..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
            />
            {searchResults.length > 0 && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-600 dark:bg-zinc-700">
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      router.push(`/messages?userId=${u.id}`);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-zinc-50 dark:hover:bg-zinc-600"
                  >
                    <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
                      {u.avatarUrl ? (
                        <img src={mediaUrl(u.avatarUrl)} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">{u.firstName?.[0] ?? "?"}</div>
                      )}
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-white">{u.firstName} {u.lastName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {showRequests ? (
            requests.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-500">No pending requests</p>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-700">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                        {req.fromUser.firstName?.[0] ?? "?"}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                        {req.fromUser.firstName} {req.fromUser.lastName}
                      </p>
                      <p className="text-xs text-zinc-500">Wants to message you</p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      className="flex-1 rounded-lg bg-sky-500 py-1.5 text-xs font-semibold text-white hover:bg-sky-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(req.id)}
                      className="flex-1 rounded-lg border border-zinc-200 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            <>
              {conversations.length === 0 && suggestions.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-zinc-500">No conversations yet</p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`flex w-full items-center gap-3 border-b border-zinc-100 px-4 py-3 text-left transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-700 ${
                      selectedConvId === conv.id ? "bg-zinc-50 dark:bg-zinc-700" : ""
                    }`}
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
                      {conv.participant?.avatarUrl ? (
                        <img src={mediaUrl(conv.participant.avatarUrl)} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                          {conv.participant?.firstName?.[0] ?? "?"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                          {conv.participant?.firstName} {conv.participant?.lastName}
                        </p>
                        {conv.lastMessage && (
                          <span className="text-xs text-zinc-400 shrink-0 ml-2">
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs text-zinc-500">
                          {conv.lastMessage?.content ?? "No messages yet"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 rounded-full bg-sky-500 px-1.5 py-0.5 text-xs font-bold text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}

              {suggestions.length > 0 && (
                <>
                  <div className="px-4 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Suggestions
                  </div>
                  {suggestions.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => router.push(`/messages?userId=${u.id}`)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-700"
                    >
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
                        {u.avatarUrl ? (
                          <img src={mediaUrl(u.avatarUrl)} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                            {u.firstName?.[0] ?? "?"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                          {u.firstName} {u.lastName}
                        </p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col">
        {selectedConv || startUserInfo ? (
          <>
            <div className="flex items-center gap-3 border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-700 dark:bg-zinc-800">
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
                {(() => {
                  const p = selectedConv?.participant ?? startUserInfo;
                  return p?.avatarUrl ? (
                    <img src={mediaUrl(p.avatarUrl)} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                      {p?.firstName?.[0] ?? "?"}
                    </div>
                  );
                })()}
              </div>
              <Link
                href={`/user/${selectedConv?.participant?.id ?? startUserInfo?.id}`}
                className="text-sm font-semibold text-zinc-900 hover:underline dark:text-white"
              >
                {selectedConv?.participant?.firstName ?? startUserInfo?.firstName}{" "}
                {selectedConv?.participant?.lastName ?? startUserInfo?.lastName}
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto bg-zinc-50 px-5 py-4 dark:bg-zinc-900/50">
              {messages.length === 0 ? (
                <p className="pt-8 text-center text-sm text-zinc-500">No messages yet. Say hello!</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {[...messages].reverse().map((msg) => {
                    const isMine = msg.sender.id === currentUserId;
                    const reactedEmojis = [...new Set((msg.reactions ?? []).map((r) => r.emoji))];
                    const PRESET_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                            isMine
                              ? "bg-sky-500 text-white rounded-br-md"
                              : "bg-white text-zinc-900 dark:bg-zinc-700 dark:text-white rounded-bl-md"
                          }`}
                        >
                          {editingMsgId === msg.id ? (
                            <div className="flex flex-col gap-2">
                              <input
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-500 dark:bg-zinc-600 dark:text-white"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => { setEditingMsgId(null); setEditingContent(""); }}
                                  className="text-xs text-zinc-400 hover:text-zinc-600"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleEditMessage(msg.id)}
                                  disabled={!editingContent.trim()}
                                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 disabled:opacity-40"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          )}
                          <div className={`mt-1 flex items-center gap-1 ${isMine ? "justify-end" : "justify-start"} ${isMine ? "text-white/70" : "text-zinc-400"}`}>
                            <span className="text-xs">{formatTime(msg.createdAt)}</span>
                              {isMine && (
                              msg.read ? (
                                <svg className="h-3.5 w-3.5 text-blue-200" viewBox="0 0 16 11" fill="currentColor">
                                  <path d="M11.07.57c.27.2.37.47.2.74l-4.5 6.3c-.2.28-.5.34-.78.15l-3.2-2.27c-.27-.2-.37-.48-.2-.75.2-.27.47-.37.74-.2l2.67 1.9 4.07-5.7c.2-.28.5-.38.78-.18h.01zm0 3.43c.27.2.37.47.2.74l-4.5 6.3c-.2.28-.5.34-.78.15l-3.2-2.27c-.27-.2-.37-.48-.2-.75.2-.27.47-.37.74-.2l2.67 1.9 4.07-5.7c.2-.28.5-.38.78-.18z"/>
                                </svg>
                              ) : (
                                <svg className="h-3.5 w-3.5 text-white/50" viewBox="0 0 11 9" fill="currentColor">
                                  <path d="M3.6 8.2.3 5.2c-.3-.2-.3-.6 0-.8l.8-.6c.2-.2.6-.2.8 0L4 6.1 8.4.4c.2-.3.6-.3.8 0l.7.7c.2.2.2.6 0 .8L4.4 8.2c-.2.2-.6.2-.8 0z"/>
                                </svg>
                              )
                            )}
                            {isMine && (msg as any).editable && editingMsgId !== msg.id && (
                              <button
                                onClick={() => { setEditingMsgId(msg.id); setEditingContent(msg.content); }}
                                className="text-xs hover:underline"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </div>

                        <div className={`mt-0.5 flex items-center gap-1 ${isMine ? "flex-row-reverse" : ""}`}>
                          {reactedEmojis.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => {
                                const myReaction = (msg.reactions ?? []).find((r) => r.emoji === emoji && r.userId === currentUserId);
                                if (myReaction) removeReaction(msg.id, emoji).catch(() => {});
                                else addReaction(msg.id, emoji).catch(() => {});
                                loadMessages(selectedConvId!);
                              }}
                              className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs transition hover:scale-110 ${
                                (msg.reactions ?? []).some((r) => r.emoji === emoji && r.userId === currentUserId)
                                  ? "bg-sky-100 dark:bg-sky-900"
                                  : "bg-zinc-100 dark:bg-zinc-700"
                              }`}
                            >
                              {emoji}
                              <span className="text-[10px] text-zinc-500">{msg.reactions?.filter((r) => r.emoji === emoji).length}</span>
                            </button>
                          ))}
                          <div className="relative" ref={reactionRef}>
                            <button
                              onClick={() => setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id)}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs text-zinc-500 transition hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                            >
                              +
                            </button>
                            {activeReactionMsgId === msg.id && (
                              <div className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-full bg-zinc-800 px-3 py-1.5 shadow-lg dark:bg-zinc-600">
                                {PRESET_EMOJIS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => { addReaction(msg.id, emoji).catch(() => {}); loadMessages(selectedConvId!); setActiveReactionMsgId(null); }}
                                    className="px-1 text-base transition hover:scale-125"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-zinc-200 bg-white px-5 py-3 dark:border-zinc-700 dark:bg-zinc-800">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message..."
                className="flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              />
              <EmojiPickerButton onSelect={(emoji) => setInput((prev) => prev + emoji)} />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="rounded-full bg-sky-500 p-2 text-white hover:bg-sky-600 disabled:opacity-40"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-sm text-center">
              <svg className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
              </svg>
              <p className="mt-4 text-lg font-medium text-zinc-900 dark:text-white">Your messages</p>
              <p className="mt-1 text-sm text-zinc-500">Search for a user to start a conversation</p>
              <div className="mx-auto mt-4 max-w-xs">
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
                    if (!e.target.value.trim()) { setSearchResults([]); return; }
                    searchTimerRef.current = setTimeout(() => {
                      searchUsers(e.target.value.trim()).then(setSearchResults).catch(() => {});
                    }, 300);
                  }}
                  placeholder="Name..."
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
                {searchResults.length > 0 && (
                  <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-600 dark:bg-zinc-700">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          router.push(`/messages?userId=${u.id}`);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-600"
                      >
                        <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
                          {u.avatarUrl ? (
                            <img src={mediaUrl(u.avatarUrl)} className="h-full w-full object-cover" alt="" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">{u.firstName?.[0] ?? "?"}</div>
                          )}
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-white">{u.firstName} {u.lastName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
