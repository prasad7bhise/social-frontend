"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SocialLogo } from "../components/SocialLogo";
import { registerUser } from "@/lib/api/authApi";

export default function SignUpPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const allFilled = firstName && lastName && email && password && confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!allFilled) {
      setError("All fields are required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await registerUser({ firstName, lastName, email, password });
      router.push("/login?registered=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950">
      <div className="absolute inset-0">
        <div className="absolute -left-1/4 top-0 h-[60%] w-[60%] rounded-full bg-violet-600/40 blur-[120px]" />
        <div className="absolute -right-1/4 bottom-0 h-[50%] w-[50%] rounded-full bg-fuchsia-600/35 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[40%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/25 blur-[80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,#0a0a0a_100%)]" />
        <div className="absolute top-16 right-8 h-24 w-24 rounded-full border border-white/5 animate-pulse" />
        <div className="absolute bottom-12 left-12 h-16 w-16 rounded-full border border-violet-400/10 animate-pulse" style={{ animationDelay: "0.8s" }} />
        <div className="absolute top-1/4 left-10 h-3 w-3 rounded-full bg-white/15 animate-ping" />
        <div className="absolute bottom-1/3 right-20 h-2 w-2 rounded-full bg-fuchsia-400/20 animate-ping" style={{ animationDelay: "0.3s" }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <main className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 px-8 py-10 shadow-2xl backdrop-blur-xl sm:max-w-md">
        <div className="mb-6 flex justify-center">
          <SocialLogo className="text-white" />
        </div>
        <h1 className="mb-6 text-center text-xl font-semibold text-white">Create your account</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300">{error}</p>
          )}

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="firstName" className="text-xs font-medium text-zinc-400">First name</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-violet-500/50 focus:bg-white/10"
                placeholder="John"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="lastName" className="text-xs font-medium text-zinc-400">Last name</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-violet-500/50 focus:bg-white/10"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-zinc-400">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-violet-500/50 focus:bg-white/10"
              placeholder="john@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-zinc-400">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 pr-10 text-sm text-white outline-none transition focus:border-violet-500/50 focus:bg-white/10"
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
                tabIndex={-1}
              >
                {showPassword ? EyeOffIcon() : EyeIcon()}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-medium text-zinc-400">Confirm password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 pr-10 text-sm text-white outline-none transition focus:border-violet-500/50 focus:bg-white/10"
                placeholder="Repeat your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
                tabIndex={-1}
              >
                {showConfirmPassword ? EyeOffIcon() : EyeIcon()}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !allFilled}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-white font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300">Log in</Link>
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
