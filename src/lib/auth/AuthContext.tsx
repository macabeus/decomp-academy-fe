"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "./api";
import { getIdToken, logout } from "./cognito";

export interface AuthUser {
  sub: string;
  email: string;
}

type Status = "loading" | "anon" | "authed";

interface AuthValue {
  status: Status;
  user: AuthUser | null;
  refresh: () => Promise<void>;
  signOut: () => void;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  const refresh = useCallback(async () => {
    const token = await getIdToken();
    if (!token) {
      setUser(null);
      setStatus("anon");
      return;
    }
    try {
      const me = await api<AuthUser>("/me");
      setUser(me);
      setStatus("authed");
    } catch {
      // Token present but rejected (revoked/expired refresh) — treat as anon.
      setUser(null);
      setStatus("anon");
    }
  }, []);

  const signOut = useCallback(() => {
    logout();
    setUser(null);
    setStatus("anon");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Ctx.Provider value={{ status, user, refresh, signOut }}>{children}</Ctx.Provider>
  );
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within <AuthProvider>");
  return v;
}
