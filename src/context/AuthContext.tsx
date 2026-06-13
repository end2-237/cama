"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { DBUser, DBInscription, UserRole, CycleMode } from "@/lib/supabase";

// Dossier académique de l'étudiant (issu de la table inscriptions)
export interface Dossier {
  matricule:     string;
  parcoursSlug:  string;
  parcoursTitle: string;
  school:        string;
  cycleType:     string;
  level:         string;
  mode:          CycleMode;
  modeLabel:     string;
  campus:        string;
  academicYear:  string;
  semester:      number;
  totalEcts:     number;
  status:        DBInscription["status"];
  statusLabel:   string;
  enrolledAt:    string;
}

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
  phone:       string;
  studentCard: string;
  initials:    string;
  dossier:     Dossier | null;
}

const MODE_LABELS: Record<CycleMode, string> = {
  presentiel: "Présentiel",
  hybride:    "Hybride",
  online:     "En ligne",
};

const STATUS_LABELS: Record<DBInscription["status"], string> = {
  en_attente: "Inscription en attente de validation",
  validee:    "Inscription validée",
  rejetee:    "Inscription rejetée",
};

function toDossier(db: DBInscription): Dossier {
  return {
    matricule:     db.matricule,
    parcoursSlug:  db.parcours_slug,
    parcoursTitle: db.parcours_title,
    school:        db.school,
    cycleType:     db.cycle_type,
    level:         db.level,
    mode:          db.mode,
    modeLabel:     MODE_LABELS[db.mode] ?? db.mode,
    campus:        db.campus,
    academicYear:  db.academic_year,
    semester:      db.semester,
    totalEcts:     db.total_ects,
    status:        db.status,
    statusLabel:   STATUS_LABELS[db.status] ?? db.status,
    enrolledAt:    db.enrolled_at,
  };
}

const ROLE_LABELS: Record<UserRole, string> = {
  etudiant:   "Étudiant",
  enseignant: "Enseignant",
  admin:      "Administrateur",
  jury:       "Jury",
};

function toAppUser(db: DBUser, dossier: DBInscription | null): AppUser {
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
    phone:       db.phone ? `${db.phone_prefix ?? "+237"} ${db.phone}` : "",
    studentCard: db.student_card ?? "",
    initials:    `${db.first_name[0]}${db.last_name[0]}`.toUpperCase(),
    dossier:     dossier ? toDossier(dossier) : null,
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
    const [{ data: profile }, { data: inscription }] = await Promise.all([
      supabase.from("users").select("*").eq("id", userId).single(),
      supabase.from("inscriptions").select("*").eq("user_id", userId)
        .order("enrolled_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (profile) {
      setUser(toAppUser(profile as DBUser, (inscription as DBInscription) ?? null));
    }
  }

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
