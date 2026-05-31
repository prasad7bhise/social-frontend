"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { signOut, useSession } from "next-auth/react";
import { SocialLogo } from "../components/SocialLogo";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api/notificationApi";
import { NotificationType } from "@/lib/types/enums";
import type { NotificationDTO } from "@/lib/types/messaging";

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
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

const ICONS: Record<NotificationType, ReactNode> = {
  [NotificationType.LIKE]: (
    <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ),
  [NotificationType.COMMENT]: (
    <svg className="h-5 w-5 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </svg>
  ),
  [NotificationType.FOLLOW]: (
    <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  ),
  [NotificationType.MESSAGE_REQUEST]: (
    <svg className="h-5 w-5 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    </svg>
  ),
  [NotificationType.MESSAGE_ACCEPTED]: (
    <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
    </svg>
  ),
  [NotificationType.MESSAGE]: (
    <svg className="h-5 w-5 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    </svg>
  ),
};

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadNotifications();
  }, [status]);

  async function loadNotifications() {
    try {
      const data = await getNotifications();
      setNotifications(data.content ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  }

  function getNotificationLink(n: NotificationDTO): string {
    switch (n.type) {
      case NotificationType.LIKE:
      case NotificationType.COMMENT:
        return "/feed";
      case NotificationType.FOLLOW:
        return `/user/${n.actor.id}`;
      case NotificationType.MESSAGE:
      case NotificationType.MESSAGE_REQUEST:
        return "/messages";
      case NotificationType.MESSAGE_ACCEPTED:
        return `/messages?convId=${n.referenceId}`;
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
        <Link href="/feed" className="flex items-center gap-3">
          <svg className="h-5 w-5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <SocialLogo className="text-zinc-900 dark:text-white" />
        </Link>
        <div className="flex items-center gap-3">
          {notifications.some((n) => !n.read) && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm font-semibold text-sky-500 hover:text-sky-600"
            >
              Mark all as read
            </button>
          )}
          <button
            onClick={handleLogout}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-white">Notifications</h1>

        {loading ? (
          <p className="text-center text-zinc-500">Loading...</p>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center pt-12 text-center">
            <svg className="h-12 w-12 text-zinc-300 dark:text-zinc-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
            <p className="mt-4 text-lg font-medium text-zinc-900 dark:text-white">No notifications yet</p>
            <p className="mt-1 text-sm text-zinc-500">When someone likes, comments, or follows you, it will show up here.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((n) => (
              <div
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={async () => {
                  if (!n.read) {
                    try {
                      await markNotificationRead(n.id);
                      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
                    } catch {}
                  }
                  router.push(getNotificationLink(n));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    (e.currentTarget as HTMLElement).click();
                  }
                }}
                className={`flex cursor-pointer items-start gap-4 rounded-xl px-4 py-3 transition ${
                  n.read
                    ? "bg-white dark:bg-zinc-800"
                    : "bg-sky-50 dark:bg-sky-900/20"
                } hover:bg-zinc-50 dark:hover:bg-zinc-700`}
              >
                <div className="mt-1 shrink-0">{ICONS[n.type]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {n.actor.avatarUrl ? (
                      <img src={mediaUrl(n.actor.avatarUrl)} className="h-6 w-6 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white">
                        {n.actor.firstName?.[0] ?? "?"}
                      </div>
                    )}
                    <p className="text-sm text-zinc-900 dark:text-white">
                      <span className="font-semibold">{n.actor.firstName}</span> {n.content}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400">{formatTime(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
