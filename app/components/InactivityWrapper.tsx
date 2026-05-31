"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export default function InactivityWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    function resetTimer() {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        signOut({ redirect: false });
        window.location.href =
          "http://localhost:8081/realms/social-realm/protocol/openid-connect/logout" +
          `?id_token_hint=${(session as any)?.idToken ?? ""}` +
          "&post_logout_redirect_uri=http://localhost:3000";
      }, TIMEOUT_MS);
    }

    const events = ["mousedown", "keydown", "touchstart", "scroll", "mousemove"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [status, session]);

  return <>{children}</>;
}
