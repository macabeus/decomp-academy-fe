"use client";

import { useEffect } from "react";
import { useAuth } from "./AuthContext";
import { configureAnon, configureAuthed } from "@/lib/progress";

// Bridges auth state into the progress store: signed-out learners stay on
// localStorage; signing in hydrates from the server (migrating local progress
// up on the first transition). Render-transparent.
export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  useEffect(() => {
    if (status === "anon") configureAnon();
    else if (status === "authed") void configureAuthed();
    // "loading" leaves the synchronous local prime in place until auth resolves.
  }, [status]);

  return <>{children}</>;
}
