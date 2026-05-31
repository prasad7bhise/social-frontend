import Link from "next/link";
import { SocialLogo } from "./components/SocialLogo";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950">
      <div className="absolute inset-0">
        <div className="absolute -left-1/4 top-0 h-[60%] w-[60%] rounded-full bg-violet-600/40 blur-[120px]" />
        <div className="absolute -right-1/4 bottom-0 h-[50%] w-[50%] rounded-full bg-fuchsia-600/35 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[40%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/25 blur-[80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,#0a0a0a_100%)]" />
        <div className="absolute top-8 left-8 h-16 w-16 rounded-full border border-white/10 animate-pulse" />
        <div className="absolute bottom-16 right-10 h-28 w-28 rounded-full border border-white/5 animate-pulse" style={{ animationDelay: "1.2s" }} />
        <div className="absolute top-2/3 left-16 h-2 w-2 rounded-full bg-white/10 animate-ping" />
        <div className="absolute top-1/3 right-12 h-3 w-3 rounded-full bg-violet-400/15 animate-ping" style={{ animationDelay: "0.7s" }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <main className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8 rounded-2xl border border-white/10 bg-white/5 px-8 py-10 shadow-2xl backdrop-blur-xl sm:max-w-md">
        <SocialLogo className="text-white" />
        <p className="text-center text-sm text-zinc-400">
          Share moments with friends
        </p>
        <div className="flex w-full flex-col gap-3">
          <Link
            href="/signup"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-white font-semibold text-zinc-900 transition hover:bg-zinc-200"
          >
            Sign up
          </Link>
          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center rounded-xl border border-white/20 font-medium text-white transition hover:bg-white/10"
          >
            Log in
          </Link>
        </div>
      </main>
    </div>
  );
}
