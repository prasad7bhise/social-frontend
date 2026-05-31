import { getSession } from "next-auth/react";
import type { UserInfoDTO } from "@/lib/types/feed";

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
  return res.json();
}

export async function getProfile(): Promise<UserInfoDTO> {
  return authFetch("/api/profile");
}

export async function getUserProfile(userId: number): Promise<UserInfoDTO> {
  return authFetch(`/api/profile/${userId}`);
}

export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<UserInfoDTO> {
  return authFetch("/api/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getFollowCounts(userId: number): Promise<{
  followers: number;
  following: number;
}> {
  return authFetch(`/api/follow/${userId}/counts`);
}

export async function followUser(userId: number): Promise<void> {
  await authFetch(`/api/follow/${userId}`, { method: "POST" });
}

export async function unfollowUser(userId: number): Promise<void> {
  await authFetch(`/api/follow/${userId}`, { method: "DELETE" });
}

export async function searchUsers(query: string): Promise<UserInfoDTO[]> {
  return authFetch(`/api/profile/search?q=${encodeURIComponent(query)}`);
}

export async function getMessageSuggestions(): Promise<UserInfoDTO[]> {
  return authFetch("/api/follow/suggestions");
}

export async function getFollowStatus(userId: number): Promise<boolean> {
  const res = await authFetch(`/api/follow/${userId}/status`);
  return (res as any).following;
}

export async function uploadAvatar(
  file: File
): Promise<{ url: string; filename: string }> {
  const session = await getSession();
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session?.accessToken}` },
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}
