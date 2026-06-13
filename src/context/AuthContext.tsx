"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { DBUser, UserRole } from "@/lib/supabase";

// Shape exposée dans l'app (compatible avec l'ancien AuthContext)
export interface AppUser {
  id:          string;
  email:       string;
  name:        string;
  firstName:   string;
  lastName:    string;
  role:        UserRole;
  roleLabel:   string;
  avatarColor: string;
  school:      string;
  level:       string;
  initials:    string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  etudiant:   "Étudiant",
  enseignant: "Enseignant",
  admin:      "Administrateur",
  jury:       "Jury",
};

function toAppUser(db: DBUser): AppUser {
  return {
    id:          db.id,
    email:       db.email,
    name:        `${db.first_name} ${db.last_name}`,
    firstName:   db.first_name,
    lastName:    db.last_name,
    role:        db.role,
    roleLabel:   ROLE_LABELS[db.role],
    avatarColor: db.avatar_color,
    school:      db.school ?? "",
    level:       db.level  ?? "",
    initials:    `${db.first_name[0]}${db.last_name[0]}`.toUpperCase(),
  };
}

interface AuthCtx {
  user:    AppUser | null;
  loading: boolean;
  logout:  () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, loading: true, logout: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupère la session active au démarrage
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Écoute les changements d'auth (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setUser(toAppUser(data as DBUser));
  }

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
