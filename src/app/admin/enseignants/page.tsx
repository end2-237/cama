"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, GraduationCap, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/dashboard/PageShell";
import { fetchUsers } from "@/lib/admin";
import { logAudit } from "@/lib/governance";
import type { DBUser } from "@/lib/supabase";

export default function AdminEnseignantsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [teachers, setTeachers] = useState<DBUser[]>([]);
  const [fetching, setFetching] = useState(true);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [school, setSchool] = useState("");
  const [phone, setPhone] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, router]);

  const reload = async () => {
    const all = await fetchUsers();
    setTeachers(all.filter((u) => u.role === "enseignant"));
    setFetching(false);
  };
  useEffect(() => { if (user) reload(); }, [user]);

  const submit = async () => {
    setError(""); setSuccess("");
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      setError("Email, prénom et nom sont obligatoires.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/create-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          school: school.trim() || undefined,
          phone: phone.trim() || undefined,
          requesterId: user!.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Erreur lors de la création.");
        setSaving(false);
        return;
      }
      await logAudit({
        actorId: user!.id, actorName: user!.name, action: "enseignant.creer",
        entity: `user:${data.id}`, detail: `Compte enseignant créé : ${firstName} ${lastName} (${email})`,
        severity: "warn",
      });
      setSuccess("Enseignant ajouté — il pourra se connecter par code email.");
      setEmail(""); setFirstName(""); setLastName(""); setSchool(""); setPhone("");
      await reload();
    } catch {
      setError("Erreur réseau. Réessayez.");
    }
    setSaving(false);
  };

  if (loading || fetching || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-surface"><Loader2 className="w-6 h-6 animate-spin text-cama" /></div>
  );

  const withSchool = teachers.filter((t) => t.school).length;

  return (
    <PageShell
      title="Enseignants"
      subtitle="Ajoutez les comptes enseignants — connexion par code email, sans mot de passe."
      icon={GraduationCap}
      breadcrumb="Enseignants"
      maxWidth="max-w-[1100px]"
      stats={[
        { label: "Enseignants",     value: teachers.length, accent: "cama" },
        { label: "Avec école",      value: withSchool,      accent: "ink" },
      ]}
    >
      <div className="space-y-4">
        {/* Ajouter un enseignant */}
        <div className="bg-white border border-border p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">Ajouter un enseignant</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Email</label>
              <input value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} type="email" placeholder="prof@jfn.cm"
                className="w-full text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">École / Filière <span className="text-subtle normal-case font-normal">(optionnel)</span></label>
              <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="ex. École de génie logiciel"
                className="w-full text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Prénom</label>
              <input value={firstName} onChange={(e) => { setFirstName(e.target.value); setError(""); }} placeholder="Amina"
                className="w-full text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Nom</label>
              <input value={lastName} onChange={(e) => { setLastName(e.target.value); setError(""); }} placeholder="Bello"
                className="w-full text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Téléphone <span className="text-subtle normal-case font-normal">(optionnel)</span></label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="6XX XXX XXX"
                className="w-full text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-100 px-3 py-2 mt-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-700 text-xs bg-green-50 border border-green-100 px-3 py-2 mt-3">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
            </div>
          )}

          <div className="mt-3">
            <button onClick={submit} disabled={saving}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white bg-cama px-3 py-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Ajouter l&apos;enseignant
            </button>
          </div>
          <p className="text-[10px] text-subtle mt-2">L&apos;enseignant se connecte par code reçu par email — aucun mot de passe à communiquer.</p>
        </div>

        {/* Liste des enseignants */}
        <div className="bg-white border border-border">
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Enseignants ({teachers.length})</p>
          </div>
          {teachers.length === 0 ? (
            <p className="p-6 text-center text-xs text-muted">Aucun enseignant enregistré.</p>
          ) : (
            <div className="divide-y divide-border">
              {teachers.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-8 h-8 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                    style={{ backgroundColor: t.avatar_color || "#6366f1" }}>
                    {(t.first_name?.[0] ?? "") + (t.last_name?.[0] ?? "")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-ink truncate">{t.first_name} {t.last_name}</p>
                    <p className="text-[10px] text-muted truncate">{t.email}</p>
                  </div>
                  <span className="text-[10px] text-muted truncate max-w-[40%] text-right">{t.school ?? "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
