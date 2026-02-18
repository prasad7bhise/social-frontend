"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { SocialLogo } from "../components/SocialLogo";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/feed");
    }
  }, [status, router]);

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      await signIn("keycloak", { callbackUrl: "/feed" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Log in failed");
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Checking session...</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950">
      <div className="absolute inset-0">
        <div className="absolute -left-1/4 top-0 h-[60%] w-[60%] rounded-full bg-violet-600/40 blur-[120px]" />
        <div className="absolute -right-1/4 bottom-0 h-[50%] w-[50%] rounded-full bg-fuchsia-600/35 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[40%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/25 blur-[80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,#0a0a0a_100%)]" />
      </div>

      <main className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 px-8 py-10 shadow-2xl backdrop-blur-xl sm:max-w-md">
        <div className="mb-6 flex justify-center">
          <SocialLogo className="text-white" />
        </div>
        <h1 className="mb-6 text-center text-xl font-semibold text-white">
          Log in to Social
        </h1>
        <div className="flex flex-col gap-4">
          {error && (
            <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-white font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? "Redirecting..." : "Continue with Keycloak"}
          </button>
          <p className="mt-4 text-center text-xs text-zinc-400">
            You will be redirected to your organization&apos;s Keycloak login page.
          </p>
        </div>
      </main>
    </div>
  );
}
