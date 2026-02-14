"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SocialLogo } from "../components/SocialLogo";

const SESSION_KEY = "social_session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_KEY, "1");
    }
    router.push("/feed");
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <button
            type="submit"
            className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-white font-semibold text-zinc-900 transition hover:bg-zinc-200"
          >
            Log in
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-white hover:underline">
            Sign up
          </Link>
        </p>
      </main>
    </div>
  );
}
