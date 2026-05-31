"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { SocialLogo } from "../components/SocialLogo";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function mediaUrl(url: string) {
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
}
import {
  getFeed,
  toggleLike,
  deletePost,
  addComment,
  deleteComment,
  updateComment,
  followUser,
  unfollowUser,
  getFollowStatus,
} from "@/lib/api/feedApi";
import type { PostDTO, CommentDTO } from "@/lib/types/feed";
import { MediaType } from "@/lib/types/enums";
import CreatePostModal from "../components/CreatePostModal";
import { EmojiPickerButton } from "../components/EmojiPickerButton";
import { fetchCurrentUser } from "@/lib/api/userApi";
import { getUnreadCount } from "@/lib/api/notificationApi";
import type { UserInfoDTO } from "@/lib/types/feed";

const iconClass = "h-6 w-6 shrink-0";

const NAV_CONFIG = [
  { id: "feed", label: "Following", icon: <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" /></svg> },
  { id: "explore", label: "Explore", icon: <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg> },
  { id: "create", label: "Create", icon: <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg> },
  { id: "notifications", label: "Notifications", icon: <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" /></svg> },
  { id: "messages", label: "Messages", icon: <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" /></svg> },
  { id: "profile", label: "Profile", icon: <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg> },
] as const;

export default function FeedPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });
  const [selectedId, setSelectedId] = useState<(typeof NAV_CONFIG)[number]["id"]>("feed");
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [currentUser, setCurrentUser] = useState<UserInfoDTO | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [followState, setFollowState] = useState<Record<number, boolean>>({});
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchCurrentUser().then(setCurrentUser).catch(console.error);
    loadFeed();
    getUnreadCount().then(setUnreadNotifs).catch(() => {});
  }, [status]);

  useEffect(() => {
    function onFocus() {
      getUnreadCount().then(setUnreadNotifs).catch(() => {});
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    posts.forEach((p) => {
      if (p.user.id !== currentUser?.id && followState[p.user.id] === undefined) {
        getFollowStatus(p.user.id).then((f) =>
          setFollowState((prev) => ({ ...prev, [p.user.id]: f }))
        ).catch(() => {});
      }
    });
  }, [posts, currentUser]);

  async function loadFeed() {
    setLoading(true);
    try {
      const data = await getFeed(0, 20);
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(postId: number) {
    try {
      await toggleLike(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1 }
            : p
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(postId: number) {
    if (!confirm("Delete this post?")) return;
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddComment(postId: number) {
    const content = commentInputs[postId]?.trim();
    if (!content) return;
    try {
      const comment = await addComment(postId, { content });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, commentCount: p.commentCount + 1, recentComments: [comment, ...p.recentComments] }
            : p
        )
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleFollow(userId: number) {
    try {
      const isCurrentlyFollowed = followState[userId];
      if (isCurrentlyFollowed) {
        await unfollowUser(userId);
        setFollowState((prev) => ({ ...prev, [userId]: false }));
      } else {
        await followUser(userId);
        setFollowState((prev) => ({ ...prev, [userId]: true }));
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleEditComment(commentId: number, content: string) {
    try {
      const updated = await updateComment(commentId, content);
      setPosts((prev) =>
        prev.map((p) => ({
          ...p,
          recentComments: p.recentComments.map((c) =>
            c.id === commentId ? { ...c, content: updated.content, editable: updated.editable } : c
          ),
        }))
      );
      setEditingCommentId(null);
      setEditingCommentText("");
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteComment(postId: number, commentId: number) {
    try {
      await deleteComment(commentId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, commentCount: p.commentCount - 1, recentComments: p.recentComments.filter((c) => c.id !== commentId) }
            : p
        )
      );
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

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString();
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90">
        <Link href="/feed" className="flex items-center">
          <SocialLogo className="text-zinc-900 dark:text-white" />
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Log out
        </button>
      </header>

      <div className="flex">
        <aside className="sticky top-[57px] flex h-[calc(100vh-57px)] w-60 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <nav className="flex flex-col gap-1 p-3">
            {NAV_CONFIG.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "profile") router.push("/profile");
                  else if (item.id === "explore") router.push("/explore");
                  else if (item.id === "messages") router.push("/messages");
                  else if (item.id === "notifications") router.push("/notifications");
                  else {
                    setSelectedId(item.id);
                    if (item.id === "create") setShowCreate(true);
                  }
                }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-base font-medium transition ${
                  selectedId === item.id
                    ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.id === "notifications" && unreadNotifs > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                    {unreadNotifs > 9 ? "9+" : unreadNotifs}
                  </span>
                )}
              </button>
            ))}
          </nav>
          {currentUser && (
            <div className="mt-auto border-t border-zinc-200 dark:border-zinc-700 p-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
                  {currentUser.avatarUrl ? (
                    <img
                      src={mediaUrl(currentUser.avatarUrl)}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).parentElement!.innerHTML =
                          `<div class="flex h-full w-full items-center justify-center text-xs font-bold text-white">${currentUser.firstName?.[0] ?? "?"}</div>`;
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                      {currentUser.firstName?.[0] ?? "?"}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                    {currentUser.firstName} {currentUser.lastName}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{currentUser.email}</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        <main className="min-w-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-lg pb-8">
            <div className="pt-4 px-4">
              <button
                onClick={() => setShowCreate(true)}
                className="w-full rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 py-3 text-sm font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300 transition"
              >
                + Create a new post
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center pt-12">
                <p className="text-zinc-500">Loading feed...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center pt-16 text-center">
                <p className="text-lg font-medium text-zinc-900 dark:text-white">No posts yet</p>
                <p className="mt-1 text-sm text-zinc-500">Be the first to share something!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 pt-4">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/user/${post.user.id}`} className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
                          {post.user.avatarUrl ? (
                            <img src={mediaUrl(post.user.avatarUrl)} className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                                (e.target as HTMLImageElement).parentElement!.innerHTML =
                                  `<div class="flex h-full w-full items-center justify-center text-xs font-bold text-white">${post.user.firstName?.[0] ?? "?"}</div>`;
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                              {post.user.firstName?.[0] ?? "?"}
                            </div>
                          )}
                        </Link>
                        <div>
                          <Link href={`/user/${post.user.id}`} className="text-sm font-semibold text-zinc-900 hover:underline dark:text-white">
                            {post.user.firstName} {post.user.lastName}
                          </Link>
                          <p className="text-xs text-zinc-500">{formatDate(post.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentUser && currentUser.id !== post.user.id && followState[post.user.id] !== undefined && (
                          <button
                            onClick={() => handleFollow(post.user.id)}
                            className={`group relative text-xs font-semibold ${
                              followState[post.user.id]
                                ? "text-zinc-400"
                                : "text-sky-500 hover:text-sky-600"
                            }`}
                          >
                            {followState[post.user.id] ? (
                              <>
                                <span className="group-hover:hidden">Following</span>
                                <span className="hidden group-hover:inline text-red-500">Unfollow</span>
                              </>
                            ) : "Follow"}
                          </button>
                        )}
                        {currentUser?.id === post.user.id && (
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="text-xs text-zinc-400 hover:text-red-500"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {post.media.length > 0 && (
                      <div className="w-full bg-zinc-100 dark:bg-zinc-700">
                        {post.media.length === 1 ? (
                          post.media[0].type === MediaType.VIDEO ? (
                            <video
                              src={mediaUrl(post.media[0].url)}
                              controls
                              className="w-full max-h-[500px] object-contain"
                            />
                          ) : (
                            <img
                              src={mediaUrl(post.media[0].url)}
                              className="w-full max-h-[500px] object-contain"
                            />
                          )
                        ) : (
                          <div className={`grid gap-0.5 ${post.media.length === 2 ? "grid-cols-2" : post.media.length === 3 ? "grid-cols-2" : "grid-cols-2"}`}>
                            {post.media.slice(0, 4).map((m, i) => (
                              m.type === MediaType.VIDEO ? (
                                <video key={m.id} src={mediaUrl(m.url)} controls className="aspect-square w-full object-cover" />
                              ) : (
                                <img key={m.id} src={mediaUrl(m.url)} className="aspect-square w-full object-cover" />
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="px-4 py-3">
                      <div className="mb-2 flex items-center gap-4">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`transition ${
                            post.likedByMe ? "text-red-500" : "text-zinc-700 dark:text-zinc-300 hover:text-red-500"
                          }`}
                          aria-label="Like"
                        >
                          <svg className="h-6 w-6" viewBox="0 0 24 24" fill={post.likedByMe ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setExpandedComments((p) => ({ ...p, [post.id]: !p[post.id] }))}
                          className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition"
                          aria-label="Comment"
                        >
                          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
                          </svg>
                        </button>
                      </div>

                      {post.likeCount > 0 && (
                        <p className="mb-1 text-sm font-semibold text-zinc-900 dark:text-white">
                          {post.likeCount} {post.likeCount === 1 ? "like" : "likes"}
                        </p>
                      )}

                      {post.content && (
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          <span className="font-semibold">
                            {post.user.firstName} {post.user.lastName}
                          </span>{" "}
                          {post.content}
                        </p>
                      )}

                      {post.commentCount > 2 && !expandedComments[post.id] && (
                        <button
                          onClick={() => setExpandedComments((p) => ({ ...p, [post.id]: true }))}
                          className="mt-1 text-sm text-zinc-500 hover:underline dark:text-zinc-400"
                        >
                          View all {post.commentCount} comments
                        </button>
                      )}

                      {(expandedComments[post.id] ? post.recentComments : post.recentComments.slice(0, 2)).map((c) => (
                        <div key={c.id} className="mt-1 flex items-start justify-between gap-2">
                          {editingCommentId === c.id ? (
                            <div className="flex w-full items-center gap-2">
                              <input
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleEditComment(c.id, editingCommentText);
                                  if (e.key === "Escape") { setEditingCommentId(null); setEditingCommentText(""); }
                                }}
                                className="flex-1 rounded border border-zinc-300 bg-transparent px-2 py-1 text-sm text-zinc-900 dark:border-zinc-600 dark:text-white focus:outline-none"
                                autoFocus
                              />
                              <button onClick={() => handleEditComment(c.id, editingCommentText)}
                                className="text-xs font-semibold text-sky-500 hover:text-sky-600">
                                Save
                              </button>
                              <button onClick={() => { setEditingCommentId(null); setEditingCommentText(""); }}
                                className="text-xs text-zinc-400 hover:text-zinc-600">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                <span className="font-semibold">{c.user.firstName}</span> {c.content}
                              </p>
                              <div className="flex items-center gap-1 shrink-0">
                                {currentUser?.id === c.user.id && c.editable && (
                                  <button
                                    onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.content); }}
                                    className="text-xs text-zinc-400 hover:text-sky-500"
                                  >
                                    Edit
                                  </button>
                                )}
                                {currentUser?.id === c.user.id && (
                                  <button
                                    onClick={() => handleDeleteComment(post.id, c.id)}
                                    className="text-xs text-zinc-400 hover:text-red-500"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))}

                      <div className="mt-2 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-700 pt-2">
                        <input
                          id={`comment-input-${post.id}`}
                          placeholder="Add a comment..."
                          value={commentInputs[post.id] ?? ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddComment(post.id);
                          }}
                          className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
                        />
                        <EmojiPickerButton
                          onSelect={(emoji) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [post.id]: (prev[post.id] ?? "") + emoji,
                            }))
                          }
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentInputs[post.id]?.trim()}
                          className="text-sm font-semibold text-sky-500 hover:text-sky-600 disabled:opacity-40"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <CreatePostModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadFeed}
      />
    </div>
  );
}
