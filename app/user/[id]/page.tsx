"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SocialLogo } from "../../components/SocialLogo";
import { getProfile, getUserProfile, getFollowCounts, followUser, unfollowUser, getFollowStatus } from "@/lib/api/profileApi";
import type { UserInfoDTO } from "@/lib/types/feed";
import { getFeed } from "@/lib/api/feedApi";
import type { PostDTO } from "@/lib/types/feed";
import { mediaUrl } from "@/lib/api/mediaUrl";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });
  const userId = Number(params.id);
  const [profile, setProfile] = useState<UserInfoDTO | null>(null);
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !userId) return;
    (async () => {
      try {
        const [userProfile, counts, followingStatus] = await Promise.all([
          getUserProfile(userId),
          getFollowCounts(userId),
          getFollowStatus(userId),
        ]);
        setProfile(userProfile);
        setFollowers(counts.followers);
        setFollowing(counts.following);
        setIsFollowing(followingStatus);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
    getProfile().then((p) => setCurrentUserId(p.id)).catch(() => {});
  }, [status, userId]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const feed = await getFeed(0, 50);
        setPosts(feed.filter((p) => p.user.id === profile.id));
      } catch (err) {
        console.error(err);
      }
    })();
  }, [profile]);

  async function handleFollow() {
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        setFollowers((f) => Math.max(0, f - 1));
      } else {
        await followUser(userId);
        setIsFollowing(true);
        setFollowers((f) => f + 1);
      }
    } catch (err) {
      console.error(err);
    }
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
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {profile && (
          <>
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
                  {profile.avatarUrl ? (
                    <img src={mediaUrl(profile.avatarUrl)} className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).parentElement!.innerHTML =
                          `<div class="flex h-full w-full items-center justify-center text-2xl font-bold text-white">${profile.firstName?.[0] ?? "?"}</div>`;
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                      {profile.firstName?.[0] ?? "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <p className="text-sm text-zinc-500">{profile.email}</p>
                  {profile.bio && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{profile.bio}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {currentUserId !== profile.id && (
                    <button
                      onClick={() => router.push(`/messages?userId=${userId}`)}
                      className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      Message
                    </button>
                  )}
                  {isFollowing !== null && (
                    <button
                      onClick={handleFollow}
                      className={`group relative rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        isFollowing
                          ? "border border-zinc-200 dark:border-zinc-600"
                          : "bg-sky-500 text-white hover:bg-sky-600"
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <span className="group-hover:hidden">Following</span>
                          <span className="hidden group-hover:inline text-red-500">Unfollow</span>
                        </>
                      ) : "Follow"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-8 rounded-2xl border border-zinc-200 bg-white py-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
              <div className="text-center">
                <div className="text-lg font-bold text-zinc-900 dark:text-white">{profile.postCount ?? 0}</div>
                <div className="text-xs text-zinc-500">Posts</div>
              </div>
              <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
              <div className="text-center">
                <div className="text-lg font-bold text-zinc-900 dark:text-white">{followers}</div>
                <div className="text-xs text-zinc-500">Followers</div>
              </div>
              <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
              <div className="text-center">
                <div className="text-lg font-bold text-zinc-900 dark:text-white">{following}</div>
                <div className="text-xs text-zinc-500">Following</div>
              </div>
            </div>

            <h2 className="mt-8 mb-4 text-lg font-bold text-zinc-900 dark:text-white">Posts</h2>

            {posts.length === 0 ? (
              <div className="flex flex-col items-center pt-8 text-center">
                <p className="text-sm text-zinc-500">No posts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 sm:gap-2">
                {posts.map((post) => (
                  <div key={post.id} className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-700">
                    {post.media?.[0] && (
                      <img src={mediaUrl(post.media[0].url)} className="h-full w-full object-cover" alt="" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/50 opacity-0 transition group-hover:opacity-100">
                      <span className="flex items-center gap-1 text-sm font-bold text-white">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                        {post.likeCount}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-bold text-white">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" /></svg>
                        {post.commentCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
