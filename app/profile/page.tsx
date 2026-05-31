"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { SocialLogo } from "../components/SocialLogo";
import { getProfile, updateProfile, uploadAvatar, getFollowCounts } from "@/lib/api/profileApi";
import { getExplore } from "@/lib/api/feedApi";
import type { UserInfoDTO, PostDTO } from "@/lib/types/feed";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function mediaUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });
  const [profile, setProfile] = useState<UserInfoDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadProfile();
  }, [status]);

  async function loadProfile() {
    try {
      const data = await getProfile();
      setProfile(data);
      setFirstName(data.firstName ?? "");
      setLastName(data.lastName ?? "");
      setEmail(data.email ?? "");
      setBio(data.bio ?? "");
      const counts = await getFollowCounts(data.id);
      setFollowers(counts.followers);
      setFollowing(counts.following);
      const explore = await getExplore(0, 50);
      setPosts(explore.filter((p) => p.user.id === data.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setSaveError("");
    try {
      const updated = await updateProfile({ firstName, lastName, email, bio });
      setProfile(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingAvatar(true);
    try {
      const { url } = await uploadAvatar(file);
      const updated = await updateProfile({ avatarUrl: url, bio, firstName, lastName, email });
      setProfile(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingAvatar(false);
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

      <main className="mx-auto max-w-2xl px-4 py-8">
        {profile && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="relative shrink-0">
                <div className="h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
                  {profile.avatarUrl ? (
                    <img
                      src={mediaUrl(profile.avatarUrl)}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).parentElement!.innerHTML =
                          `<div class="flex h-full w-full items-center justify-center text-3xl font-bold text-white">${profile.firstName?.[0] ?? "?"}</div>`;
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                      {profile.firstName?.[0] ?? "?"}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 rounded-full bg-sky-500 p-1.5 text-white shadow hover:bg-sky-600 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
              </div>

              <div className="flex-1 w-full text-center sm:text-left">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-sm text-zinc-500">{profile.email}</p>

                <div className="mt-4">
                  {editing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-zinc-500 mb-1">First name</label>
                          <input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 bg-transparent p-2.5 text-sm text-zinc-900 focus:outline-none dark:border-zinc-600 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-500 mb-1">Last name</label>
                          <input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 bg-transparent p-2.5 text-sm text-zinc-900 focus:outline-none dark:border-zinc-600 dark:text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Email</label>
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                          className="w-full rounded-lg border border-zinc-200 bg-transparent p-2.5 text-sm text-zinc-900 focus:outline-none dark:border-zinc-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Bio</label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={3}
                          className="w-full resize-none rounded-lg border border-zinc-200 bg-transparent p-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none dark:border-zinc-600 dark:text-white"
                        />
                      </div>
                      {saveError && (
                        <p className="text-xs text-red-500">{saveError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="rounded-lg bg-sky-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => {
                            setEditing(false);
                            setSaveError("");
                            setFirstName(profile.firstName ?? "");
                            setLastName(profile.lastName ?? "");
                            setEmail(profile.email ?? "");
                            setBio(profile.bio ?? "");
                          }}
                          className="rounded-lg border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {profile.bio && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-300">{profile.bio}</p>
                      )}
                      <button
                        onClick={() => setEditing(true)}
                        className="rounded-lg border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-700"
                      >
                        Edit profile
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {profile && (
        <div className="mt-6 flex items-center justify-center gap-8 rounded-2xl border border-zinc-200 bg-white py-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <div className="text-center">
            <div className="text-lg font-bold text-zinc-900 dark:text-white">{profile.postCount}</div>
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
        )}

        {posts.length > 0 && (
          <>
            <h2 className="mt-8 mb-4 text-lg font-bold text-zinc-900 dark:text-white">Posts</h2>
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
          </>
        )}

        <div className="mt-6 text-center">
          <Link href="/feed" className="text-sm font-medium text-sky-500 hover:text-sky-600">
            ← Back to feed
          </Link>
        </div>
      </main>
    </div>
  );
}
