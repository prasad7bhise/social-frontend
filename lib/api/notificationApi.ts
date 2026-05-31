import { getSession } from "next-auth/react";
import type { NotificationDTO } from "@/lib/types/messaging";

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

export async function getNotifications(
  page = 0,
  size = 20
): Promise<{ content: NotificationDTO[] }> {
  const res = await authFetch(
    `/api/notifications?page=${page}&size=${size}`
  );
  return res.json();
}

export async function getUnreadCount(): Promise<number> {
  const res = await authFetch("/api/notifications/unread-count");
  const data = await res.json();
  return data.count;
}

export async function markNotificationRead(id: number): Promise<void> {
  await authFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await authFetch("/api/notifications/read-all", { method: "PATCH" });
}
