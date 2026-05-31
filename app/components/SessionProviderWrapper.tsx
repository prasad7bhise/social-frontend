"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import InactivityWrapper from "./InactivityWrapper";

interface Props {
  children: ReactNode;
}

export function SessionProviderWrapper({ children }: Props) {
  return (
    <SessionProvider>
      <InactivityWrapper>{children}</InactivityWrapper>
    </SessionProvider>
  );
}

