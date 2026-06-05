"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { SocialLogo } from "../components/SocialLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(searchParams.get("registered") === "true");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/feed");
    }
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        username: email,
        password,
        remember: remember ? "true" : "false",
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/feed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleKeycloakLogin() {
    setError("");
    setLoading(true);
    try {
      await signIn("keycloak", { callbackUrl: "/feed" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
        <div className="absolute top-10 left-10 h-20 w-20 rounded-full border border-white/10 animate-pulse" />
        <div className="absolute bottom-20 right-16 h-32 w-32 rounded-full border border-white/5 animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/3 right-10 h-4 w-4 rounded-full bg-white/10 animate-ping" />
        <div className="absolute bottom-1/3 left-12 h-3 w-3 rounded-full bg-violet-400/20 animate-ping" style={{ animationDelay: "0.5s" }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <main className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 px-8 py-10 shadow-2xl backdrop-blur-xl sm:max-w-md">
        <div className="mb-6 flex justify-center">
          <SocialLogo className="text-white" />
        </div>
        <h1 className="mb-6 text-center text-xl font-semibold text-white">
          Log in to Social
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {success && (
            <p className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-300">
              Account created! Sign in with your new credentials.
            </p>
          )}
          {error && (
            <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-zinc-400 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-zinc-400 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
                tabIndex={-1}
              >
                {showPassword ? EyeOffIcon() : EyeIcon()}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-white/20 bg-white/5 accent-violet-500"
            />
            Remember me
          </label>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-white font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Log in"}
          </button>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-zinc-500">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleKeycloakLogin}
          disabled={loading}
          className="mt-1 flex h-11 w-full items-center justify-center rounded-xl border border-white/20 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          Continue with Keycloak SSO
        </button>

        <p className="mt-4 text-center text-xs text-zinc-500">
          No account?{" "}
          <Link href="/signup" className="text-violet-400 hover:text-violet-300">
            Sign up
          </Link>
        </p>
      </main>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Loading...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
