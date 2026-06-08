"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, loadSession, saveSession, clearSession } from "@/lib/auth";

interface AuthCtx {
  user:    User | null;
  loading: boolean;
  setUser: (u: User) => void;
  logout:  () => void;
}

const Ctx = createContext<AuthCtx>({ user: null, loading: true, setUser: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUserState] = useState<User | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setUserState(loadSession());
    setLoading(false);
  }, []);

  const setUser = (u: User) => {
    saveSession(u);
    setUserState(u);
  };

  const logout = () => {
    clearSession();
    setUserState(null);
  };

  return <Ctx.Provider value={{ user, loading, setUser, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
