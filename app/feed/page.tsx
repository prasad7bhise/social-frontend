"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession, getSession } from "next-auth/react";
import { SocialLogo } from "../components/SocialLogo";

const iconClass = "h-6 w-6 shrink-0";

const NAV_CONFIG = [
  {
    id: "feed",
    label: "Feed",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
      </svg>
    ),
  },
  {
    id: "explore",
    label: "Explore",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
    ),
  },
  {
    id: "create",
    label: "Create",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
      </svg>
    ),
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
      </svg>
    ),
  },
  {
    id: "messages",
    label: "Messages",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    ),
  },
] as const;

const MOCK_POSTS = [
  {
    id: "1",
    username: "alex_travels",
    avatar: null,
    image: null,
    caption: "Sunset at the beach. Best way to end the day.",
    likes: 124,
    comments: 8,
  },
  {
    id: "2",
    username: "jordan_food",
    avatar: null,
    image: null,
    caption: "Homemade pasta night!",
    likes: 89,
    comments: 12,
  },
  {
    id: "3",
    username: "sam_codes",
    avatar: null,
    image: null,
    caption: "Shipped a new feature today. Coffee fueled.",
    likes: 56,
    comments: 3,
  },
];

export default function FeedPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [selectedId, setSelectedId] = useState<(typeof NAV_CONFIG)[number]["id"]>("feed");

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogout() {
    // 1️⃣ Clear NextAuth session
  const session = await getSession() as any;
  await signOut({ redirect: false });

  // 2️⃣ Logout from Keycloak
  const logoutUrl =
  "http://localhost:8081/realms/social-realm/protocol/openid-connect/logout" +
  `?id_token_hint=${session?.idToken}` +
  `&post_logout_redirect_uri=http://localhost:3000`;

window.location.href = logoutUrl;
  }

  useEffect(() => {
    if (!mounted) return;
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [mounted, status, router]);

  useEffect(() => {
    if (!mounted) return;
    if (status !== "authenticated") return;
    if (!session?.accessToken) return;

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

    const fetchPosts = async () => {
      try {
        await fetch(`${API_BASE_URL}/api/test`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
      } catch {
        // Backend may not be ready yet; ignore errors for now.
      }
    };

    void fetchPosts();
  }, [mounted, status, session]);

  if (!mounted || status === "loading") {
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
                onClick={() => setSelectedId(item.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-base font-medium transition ${
                  selectedId === item.id
                    ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 overflow-auto">
          {selectedId === "feed" ? (
            <div className="mx-auto max-w-lg pb-8">
              <div className="flex flex-col gap-6 pt-4">
                {MOCK_POSTS.map((post) => (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500" />
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {post.username}
                      </span>
                    </div>
                    <div className="aspect-square w-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-600 dark:to-zinc-700 flex items-center justify-center">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Image
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <div className="mb-2 flex gap-4">
                        <button
                          type="button"
                          className="text-zinc-700 hover:text-red-500 dark:text-zinc-300 dark:hover:text-red-400"
                          aria-label="Like"
                        >
                          Like
                        </button>
                        <button
                          type="button"
                          className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                          aria-label="Comment"
                        >
                          Comment
                        </button>
                      </div>
                      {post.likes > 0 && (
                        <p className="mb-1 text-sm font-medium text-zinc-900 dark:text-white">
                          {post.likes} likes
                        </p>
                      )}
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">
                        <span className="font-semibold">{post.username}</span>{" "}
                        {post.caption}
                      </p>
                      {post.comments > 0 && (
                        <button
                          type="button"
                          className="mt-1 text-sm text-zinc-500 hover:underline dark:text-zinc-400"
                        >
                          View all {post.comments} comments
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg font-medium text-zinc-900 dark:text-white">
                {NAV_CONFIG.find((n) => n.id === selectedId)?.label} – Coming soon
              </p>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                This section will be available in a future update.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
