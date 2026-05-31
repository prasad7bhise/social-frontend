"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { SocialLogo } from "../components/SocialLogo";
import {
  getExplore,
  toggleLike,
  addComment,
  followUser,
  unfollowUser,
  getFollowStatus,
} from "@/lib/api/feedApi";
import { MediaType } from "@/lib/types/enums";
import { fetchCurrentUser } from "@/lib/api/userApi";
import type { PostDTO } from "@/lib/types/feed";
import type { UserInfoDTO } from "@/lib/types/feed";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function mediaUrl(url: string) {
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
}

export default function ExplorePage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserInfoDTO | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [followState, setFollowState] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchCurrentUser().then(setCurrentUser).catch(console.error);
    loadExplore();
  }, [status]);

  async function loadExplore() {
    setLoading(true);
    try {
      const data = await getExplore(0, 30);
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

  async function checkFollow(userId: number) {
    try {
      const following = await getFollowStatus(userId);
      setFollowState((prev) => ({ ...prev, [userId]: following }));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    posts.forEach((p) => {
      if (p.user.id !== currentUser?.id && followState[p.user.id] === undefined) {
        checkFollow(p.user.id);
      }
    });
  }, [posts, currentUser]);

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

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90">
        <Link href="/feed" className="flex items-center gap-3">
          <svg className="h-5 w-5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <SocialLogo className="text-zinc-900 dark:text-white" />
        </Link>
        <button
          onClick={handleLogout}
          className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Log out
        </button>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Explore</h1>

        {posts.length === 0 ? (
          <p className="text-center text-zinc-500 py-12">No posts to explore yet</p>
        ) : (
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {posts.map((post) => (
              <div key={post.id} className="group relative aspect-square overflow-hidden bg-zinc-200 dark:bg-zinc-700 rounded-sm">
                {post.media.length > 0 ? (
                  post.media[0].type === MediaType.VIDEO ? (
                    <video src={mediaUrl(post.media[0].url)} className="h-full w-full object-cover" />
                  ) : (
                    <img src={mediaUrl(post.media[0].url)} className="h-full w-full object-cover" />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-400 text-sm p-2 text-center">
                    {post.content}
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition">
                  <div className="flex items-center gap-6">
                    <span className="flex items-center gap-1.5 text-white font-semibold">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                      {post.likeCount}
                    </span>
                    <span className="flex items-center gap-1.5 text-white font-semibold">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" /></svg>
                      {post.commentCount}
                    </span>
                  </div>
                  {currentUser && currentUser.id !== post.user.id && followState[post.user.id] !== undefined && (
                    <button
                      onClick={() => handleFollow(post.user.id)}
                      className={`group relative text-xs font-semibold px-3 py-1 rounded-full ${
                        followState[post.user.id]
                          ? "bg-white/20 text-white"
                          : "bg-white text-black"
                      }`}
                    >
                      {followState[post.user.id] ? (
                        <>
                          <span className="group-hover:hidden">Following</span>
                          <span className="hidden group-hover:inline text-red-400">Unfollow</span>
                        </>
                      ) : "Follow"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
