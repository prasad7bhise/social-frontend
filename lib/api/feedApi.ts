import { getSession } from "next-auth/react";
import type {
  PostDTO,
  CommentDTO,
  CreatePostRequest,
  CreateCommentRequest,
} from "@/lib/types/feed";

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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response;
}

export async function getFeed(
  page = 0,
  size = 10
): Promise<import("@/lib/types/feed").PostDTO[]> {
  const res = await authFetch(`/api/feed?page=${page}&size=${size}`);
  const body = await res.json();
  return body.content ?? body;
}

export async function getPost(id: number): Promise<PostDTO> {
  const res = await authFetch(`/api/posts/${id}`);
  return res.json();
}

export async function createPost(
  data: CreatePostRequest
): Promise<PostDTO> {
  const res = await authFetch("/api/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deletePost(id: number): Promise<void> {
  await authFetch(`/api/posts/${id}`, { method: "DELETE" });
}

export async function toggleLike(id: number): Promise<void> {
  await authFetch(`/api/posts/${id}/like`, { method: "POST" });
}

export async function addComment(
  postId: number,
  data: CreateCommentRequest
): Promise<CommentDTO> {
  const res = await authFetch(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteComment(id: number): Promise<void> {
  await authFetch(`/api/comments/${id}`, { method: "DELETE" });
}

export async function getExplore(
  page = 0,
  size = 20
): Promise<import("@/lib/types/feed").PostDTO[]> {
  const res = await authFetch(`/api/explore?page=${page}&size=${size}`);
  const body = await res.json();
  return body.content ?? body;
}

export async function followUser(userId: number): Promise<void> {
  await authFetch(`/api/follow/${userId}`, { method: "POST" });
}

export async function unfollowUser(userId: number): Promise<void> {
  await authFetch(`/api/follow/${userId}`, { method: "DELETE" });
}

export async function getFollowStatus(userId: number): Promise<boolean> {
  const res = await authFetch(`/api/follow/${userId}/status`);
  const data = await res.json();
  return data.following;
}

export async function updateComment(
  commentId: number,
  content: string
): Promise<CommentDTO> {
  const res = await authFetch(`/api/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
  return res.json();
}

export async function uploadFile(
  file: File
): Promise<{ url: string; filename: string }> {
  const session = await getSession();
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session?.accessToken}`,
    },
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}
