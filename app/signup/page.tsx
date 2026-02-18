"use client";

import Link from "next/link";
import { SocialLogo } from "../components/SocialLogo";

export default function SignUpPage() {
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
        <h1 className="mb-4 text-center text-xl font-semibold text-white">
          Accounts managed with Keycloak
        </h1>
        <p className="mb-4 text-center text-sm text-zinc-300">
          New accounts are created and managed through your organization&apos;s Keycloak
          identity provider.
        </p>
        <p className="mb-6 text-center text-sm text-zinc-400">
          To get started, go to the login page and sign in with Keycloak.
        </p>
        <div className="flex justify-center">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
          >
            Go to login
          </Link>
        </div>
      </main>
    </div>
  );
}
