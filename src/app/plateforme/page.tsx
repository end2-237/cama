"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle, Building2, Check, Copy, Layers, Loader2, Plus, Search, ShieldAlert, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORIES_DE_BASE, type DBCategory } from "@/lib/org";

/* ════════════════════════════════════════════════════════════
   Administration de la plateforme CAMA : tous les établissements.
   Réservée à l'équipe CAMA (users.is_platform_admin, migration 036).
   Les droits sont vérifiés par l'API à partir du jeton de session ;
   cette page ne fait qu'afficher ce que l'API accepte de rendre.
════════════════════════════════════════════════════════════ */

type Statut = "trial" | "active" | "suspended";
interface Plan { id: string; name: string; price_fcfa: number | null; max_students: number | null }
interface Etab {
  id: string; slug: string; name: string; subdomain: string; custom_domain: string | null;
  vertical: string; plan_id: string | null; status: Statut; primary_color: string | null;
  created_at: string; etudiants: number; enseignants: number; admins: { email: string; nom: string }[];
}

const FAMILLES: Record<string, string> = {
  academique: "Académique (années, semestres, crédits)",
  langues: "Langues (niveaux A1→C2, modules)",
  pro: "Formation pro (modules, compétences, certifications)",
};
const CLES_TERMS: { k: string; label: string }[] = [
  { k: "platformLabel", label: "Sur-titre (ex. Centre de bureautique)" },
  { k: "programWord", label: "Programme (ex. Formation)" },
  { k: "levelWord", label: "Niveau (ex. Niveau, Classe)" },
  { k: "groupWord", label: "Période (ex. Module, Trimestre)" },
  { k: "unitWord", label: "Unité (ex. Atelier, Matière)" },
  { k: "creditWord", label: "Crédit (ex. Heure, Crédit)" },
];
const STATUTS: Record<Statut, { label: string; classe: string }> = {
  trial: { label: "Essai", classe: "bg-amber-50 text-amber-700 border-amber-200" },
  active: { label: "Actif", classe: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  suspended: { label: "Suspendu", classe: "bg-red-50 text-red-700 border-red-200" },
};
const PRESETS = ["#4F46E5", "#0EA5A4", "#2563EB", "#DB2777", "#F59E0B", "#16A34A", "#7C3AED", "#DC2626"];

async function appel(methode: "GET" | "POST" | "PATCH", corps?: unknown, chemin = "/api/platform/orgs") {
  const { data } = await supabase.auth.getSession();
  const jeton = data.session?.access_token;
  if (!jeton) return { status: 401, data: { error: "Connectez-vous d'abord." } };
  const res = await fetch(chemin, {
    method: methode,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${jeton}` },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

export default function PlateformePage() {
  const [etat, setEtat] = useState<"chargement" | "refus" | "pret">("chargement");
  const [message, setMessage] = useState("");
  const [etabs, setEtabs] = useState<Etab[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>(CATEGORIES_DE_BASE);
  const [catalogue, setCatalogue] = useState(true);
  const [voirCategories, setVoirCategories] = useState(false);
  const [q, setQ] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const r = await appel("GET");
    if (r.status !== 200) {
      setEtat("refus");
      setMessage(r.data.error ?? "Accès refusé.");
      return;
    }
    setEtabs(r.data.etablissements);
    setPlans(r.data.plans);
    // null : migration 037 pas encore passée → les trois catégories historiques.
    setCatalogue(r.data.categories !== null);
    setCategories(r.data.categories ?? CATEGORIES_DE_BASE);
    setEtat("pret");
  }, []);

  useEffect(() => { void charger(); }, [charger]);

  const filtres = useMemo(() => {
    const s = q.trim().toLowerCase();
    return etabs.filter((e) => !s || `${e.name} ${e.subdomain} ${e.admins.map((a) => a.email).join(" ")}`.toLowerCase().includes(s));
  }, [etabs, q]);

  const totaux = useMemo(() => ({
    total: etabs.length,
    actifs: etabs.filter((e) => e.status === "active").length,
    essais: etabs.filter((e) => e.status === "trial").length,
    etudiants: etabs.reduce((n, e) => n + e.etudiants, 0),
  }), [etabs]);

  async function modifier(id: string, maj: { status?: Statut; planId?: string | null; vertical?: string }) {
    setEnCours(id);
    const r = await appel("PATCH", { id, ...maj });
    setEnCours(null);
    if (r.status !== 200) { alert(r.data.error ?? "Modification impossible."); return; }
    setEtabs((l) => l.map((e) => (e.id === id ? {
      ...e, ...(maj.status ? { status: maj.status } : {}), ...(maj.planId !== undefined ? { plan_id: maj.planId } : {}),
      ...(maj.vertical ? { vertical: maj.vertical } : {}),
    } : e)));
  }

  if (etat === "chargement") {
    return <div className="min-h-screen grid place-items-center text-muted"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }
  if (etat === "refus") {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-sm text-center">
          <ShieldAlert className="w-10 h-10 mx-auto text-muted mb-3" />
          <h1 className="text-xl font-semibold text-ink mb-1">Administration de la plateforme</h1>
          <p className="text-sm text-muted mb-5">{message}</p>
          <Link href="/auth/login" className="btn-primary inline-flex px-5 py-2.5 rounded-xl">Se connecter</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-5 py-5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-cama/10 text-cama grid place-items-center"><Building2 className="w-5 h-5" /></span>
            <div>
              <h1 className="text-xl font-semibold text-ink leading-tight">Établissements</h1>
              <p className="text-xs text-muted">Administration de la plateforme CAMA</p>
            </div>
          </div>
          <button onClick={() => setVoirCategories(true)} disabled={!catalogue}
            title={catalogue ? "Catalogue des catégories" : "Passez la migration 037 pour gérer les catégories"}
            className="ml-auto inline-flex items-center gap-2 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-50">
            <Layers className="w-4 h-4" /> Catégories ({categories.length})
          </button>
          <button onClick={() => setOuvert(true)} className="btn-primary px-4 py-2.5 rounded-xl">
            <Plus className="w-4 h-4" /> Nouvel établissement
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6 flex flex-col gap-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Chiffre valeur={totaux.total} quoi="établissements" />
          <Chiffre valeur={totaux.actifs} quoi="actifs" />
          <Chiffre valeur={totaux.essais} quoi="en essai" />
          <Chiffre valeur={totaux.etudiants} quoi="étudiants au total" />
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un établissement, un sous-domaine, un admin…"
            className="w-full bg-white border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-cama" />
        </div>

        <div className="bg-white border border-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Établissement</th>
                <th className="px-4 py-3 font-semibold">Catégorie</th>
                <th className="px-4 py-3 font-semibold">Comptes</th>
                <th className="px-4 py-3 font-semibold">Administrateur</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-8 rounded-full shrink-0" style={{ backgroundColor: e.primary_color ?? "#4F46E5" }} />
                      <div className="min-w-0">
                        <p className="font-semibold text-ink truncate">{e.name}</p>
                        <p className="text-xs text-muted">{e.custom_domain || `${e.subdomain}.cama.app`} · créé le {new Date(e.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select value={e.vertical} disabled={enCours === e.id}
                      onChange={(ev) => {
                        const c = categories.find((x) => x.id === ev.target.value);
                        if (!confirm(`Réorienter « ${e.name} » en « ${c?.label ?? ev.target.value} » ? Son vocabulaire et ses modules suivront la nouvelle catégorie.`)) return;
                        void modifier(e.id, { vertical: ev.target.value });
                      }}
                      className="bg-white border border-border rounded-lg px-2 py-1.5 text-sm max-w-44">
                      {categories.some((c) => c.id === e.vertical) ? null : <option value={e.vertical}>{e.vertical}</option>}
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.label}{c.active ? "" : " (retirée)"}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{e.etudiants} étud. · {e.enseignants} ens.</td>
                  <td className="px-4 py-3 text-muted">
                    {e.admins.length ? e.admins.slice(0, 2).map((a) => <p key={a.email} className="truncate max-w-56">{a.email}</p>) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select value={e.plan_id ?? ""} disabled={enCours === e.id}
                      onChange={(ev) => modifier(e.id, { planId: ev.target.value || null })}
                      className="bg-white border border-border rounded-lg px-2 py-1.5 text-sm">
                      <option value="">—</option>
                      {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={e.status} disabled={enCours === e.id}
                      onChange={(ev) => {
                        const s = ev.target.value as Statut;
                        if (s === "suspended" && !confirm(`Suspendre « ${e.name} » ? Ses utilisateurs perdront l'accès.`)) return;
                        void modifier(e.id, { status: s });
                      }}
                      className={`border rounded-lg px-2 py-1.5 text-sm font-semibold ${STATUTS[e.status].classe}`}>
                      {(Object.keys(STATUTS) as Statut[]).map((s) => <option key={s} value={s}>{STATUTS[s].label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {filtres.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Aucun établissement.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </main>

      {ouvert ? (
        <Creation
          plans={plans}
          categories={categories}
          onFermer={() => setOuvert(false)}
          onCree={() => { void charger(); }}
        />
      ) : null}

      {voirCategories ? (
        <Categories
          categories={categories}
          onFermer={() => setVoirCategories(false)}
          onChange={(c) => setCategories((l) => {
            const i = l.findIndex((x) => x.id === c.id);
            const n = i >= 0 ? l.map((x) => (x.id === c.id ? c : x)) : [...l, c];
            return n.sort((a, b) => a.sort - b.sort);
          })}
        />
      ) : null}
    </div>
  );
}

function Chiffre({ valeur, quoi }: { valeur: number; quoi: string }) {
  return (
    <div className="bg-white border border-border rounded-2xl px-4 py-3.5">
      <p className="text-2xl font-semibold text-ink leading-tight">{valeur}</p>
      <p className="text-xs text-muted">{quoi}</p>
    </div>
  );
}

function Creation({ plans, categories, onFermer, onCree }: { plans: Plan[]; categories: DBCategory[]; onFermer: () => void; onCree: () => void }) {
  const [f, setF] = useState({
    orgName: "", subdomain: "", vertical: "academique", primaryColor: "#4F46E5",
    planId: "", status: "trial" as "trial" | "active",
    adminFirstName: "", adminLastName: "", adminEmail: "", adminPassword: "",
  });
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [fait, setFait] = useState<{ subdomain: string; email: string; motDePasse?: string } | null>(null);
  const [copie, setCopie] = useState(false);

  const maj = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((v) => ({ ...v, [k]: e.target.value }));
  const slug = f.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "");

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    const r = await appel("POST", { ...f, subdomain: slug, planId: f.planId || undefined });
    setEnvoi(false);
    if (r.status !== 200) { setErreur(r.data.error ?? "Création impossible."); return; }
    setFait({ subdomain: r.data.subdomain, email: f.adminEmail.trim().toLowerCase(), motDePasse: r.data.motDePasseProvisoire });
    onCree();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onFermer}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-ink">{fait ? "Établissement créé" : "Nouvel établissement"}</h2>
          <button onClick={onFermer} aria-label="Fermer" className="text-muted hover:text-ink"><X className="w-5 h-5" /></button>
        </div>

        {fait ? (
          <div className="p-5 flex flex-col gap-4">
            <p className="flex items-center gap-2 text-sm text-emerald-700"><Check className="w-4 h-4" /> L&apos;espace et le compte administrateur sont prêts.</p>
            <div className="bg-surface border border-border rounded-xl p-4 text-sm flex flex-col gap-1.5">
              <p><span className="text-muted">Adresse :</span> <b>{fait.subdomain}.cama.app</b></p>
              <p><span className="text-muted">Identifiant :</span> <b>{fait.email}</b></p>
              {fait.motDePasse ? <p><span className="text-muted">Mot de passe provisoire :</span> <b className="font-mono">{fait.motDePasse}</b></p> : null}
            </div>
            {fait.motDePasse ? (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                Ce mot de passe ne s&apos;affichera plus. Transmettez-le à l&apos;administrateur, qui le changera à sa première connexion.
              </p>
            ) : null}
            <button
              onClick={async () => {
                const texte = `Votre espace CAMA est prêt.\nAdresse : https://${fait.subdomain}.cama.app\nIdentifiant : ${fait.email}${fait.motDePasse ? `\nMot de passe provisoire : ${fait.motDePasse}` : ""}`;
                try { await navigator.clipboard.writeText(texte); setCopie(true); } catch { /* copie refusée */ }
              }}
              className="btn-primary justify-center py-2.5 rounded-xl">
              {copie ? <><Check className="w-4 h-4" /> Copié</> : <><Copy className="w-4 h-4" /> Copier les accès</>}
            </button>
          </div>
        ) : (
          <form onSubmit={envoyer} className="p-5 flex flex-col gap-3.5">
            {erreur ? (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {erreur}
              </div>
            ) : null}

            <Champ label="Nom de l'établissement"><input required value={f.orgName} onChange={maj("orgName")} placeholder="Institut Exemple" className="input-auth" /></Champ>
            <Champ label="Adresse de l'espace">
              <div className="flex items-stretch">
                <input required value={f.subdomain} onChange={maj("subdomain")} placeholder="mon-institut" className="input-auth rounded-r-none" />
                <span className="px-3 flex items-center bg-surface border border-l-0 border-border rounded-r-xl text-sm text-muted">.cama.app</span>
              </div>
            </Champ>
            <div className="grid grid-cols-2 gap-3">
              <Champ label="Catégorie">
                <select value={f.vertical} onChange={maj("vertical")} className="input-auth">
                  {categories.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
              </Champ>
              <Champ label="Plan">
                <select value={f.planId} onChange={maj("planId")} className="input-auth">
                  <option value="">Par défaut</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Champ>
            </div>
            <Champ label="Statut de départ">
              <div className="grid grid-cols-2 gap-2">
                {(["trial", "active"] as const).map((s) => (
                  <button type="button" key={s} onClick={() => setF((v) => ({ ...v, status: s }))}
                    className={`border-2 rounded-xl px-3 py-2 text-sm font-semibold ${f.status === s ? "border-cama bg-cama/5 text-ink" : "border-border text-muted"}`}>
                    {STATUTS[s].label}
                  </button>
                ))}
              </div>
            </Champ>
            <Champ label="Couleur de marque">
              <div className="flex items-center gap-2">
                {PRESETS.map((c) => (
                  <button type="button" key={c} onClick={() => setF((v) => ({ ...v, primaryColor: c }))}
                    className="w-7 h-7 rounded-full border-2 grid place-items-center"
                    style={{ backgroundColor: c, borderColor: f.primaryColor === c ? "#111827" : "transparent" }}>
                    {f.primaryColor === c ? <Check className="w-3.5 h-3.5 text-white" /> : null}
                  </button>
                ))}
              </div>
            </Champ>

            <div className="border-t border-border pt-4 flex flex-col gap-3">
              <p className="text-sm font-semibold text-ink">Administrateur de l&apos;établissement</p>
              <div className="grid grid-cols-2 gap-3">
                <input required value={f.adminFirstName} onChange={maj("adminFirstName")} placeholder="Prénom" className="input-auth" />
                <input required value={f.adminLastName} onChange={maj("adminLastName")} placeholder="Nom" className="input-auth" />
              </div>
              <input required type="email" value={f.adminEmail} onChange={maj("adminEmail")} placeholder="admin@mon-institut.cm" className="input-auth" />
              <input type="text" value={f.adminPassword} onChange={maj("adminPassword")} autoComplete="new-password"
                placeholder="Mot de passe (vide = généré automatiquement)" className="input-auth" />
            </div>

            <button type="submit" disabled={envoi} className="btn-primary justify-center py-3 rounded-xl mt-1 disabled:opacity-70">
              {envoi ? <><Loader2 className="w-4 h-4 animate-spin" /> Création…</> : <><Plus className="w-4 h-4" /> Créer l&apos;établissement</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}

/* ── Catalogue des catégories ─────────────────────────────── */

const VIDE = { id: "", label: "", description: "", family: "pro", terms: {} as Record<string, string>, active: true, sort: 200 };

function Categories({ categories, onFermer, onChange }: {
  categories: DBCategory[]; onFermer: () => void; onChange: (c: DBCategory) => void;
}) {
  const [edition, setEdition] = useState<typeof VIDE & { nouvelle: boolean } | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!edition) return;
    setErreur("");
    setEnvoi(true);
    const { nouvelle, ...corps } = edition;
    const r = await appel(nouvelle ? "POST" : "PATCH", corps, "/api/platform/categories");
    setEnvoi(false);
    if (r.status !== 200) { setErreur(r.data.error ?? "Enregistrement impossible."); return; }
    onChange(r.data.categorie);
    setEdition(null);
  }

  async function basculer(c: DBCategory) {
    const r = await appel("PATCH", { id: c.id, active: !c.active }, "/api/platform/categories");
    if (r.status === 200) onChange(r.data.categorie);
    else alert(r.data.error ?? "Modification impossible.");
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onFermer}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-ink">Catégories d&apos;établissements</h2>
            <p className="text-xs text-muted">Chaque catégorie s&apos;appuie sur un modèle de fonctionnement et a son propre vocabulaire.</p>
          </div>
          <button onClick={onFermer} aria-label="Fermer" className="text-muted hover:text-ink"><X className="w-5 h-5" /></button>
        </div>

        {edition ? (
          <form onSubmit={enregistrer} className="p-5 flex flex-col gap-3.5">
            {erreur ? (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {erreur}
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <Champ label="Nom">
                <input required value={edition.label} placeholder="Bureautique" className="input-auth"
                  onChange={(e) => {
                    const label = e.target.value;
                    setEdition((v) => v && ({
                      ...v, label,
                      // Identifiant proposé à partir du nom, à la création seulement.
                      id: v.nouvelle ? label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) : v.id,
                    }));
                  }} />
              </Champ>
              <Champ label="Identifiant">
                <input required value={edition.id} disabled={!edition.nouvelle} className="input-auth font-mono disabled:opacity-60"
                  onChange={(e) => setEdition((v) => v && ({ ...v, id: e.target.value }))} />
              </Champ>
            </div>
            <Champ label="Description (affichée à l'inscription)">
              <input value={edition.description} placeholder="Word, Excel, PowerPoint, Internet" className="input-auth"
                onChange={(e) => setEdition((v) => v && ({ ...v, description: e.target.value }))} />
            </Champ>
            <Champ label="Modèle de fonctionnement">
              <select value={edition.family} className="input-auth" onChange={(e) => setEdition((v) => v && ({ ...v, family: e.target.value }))}>
                {Object.entries(FAMILLES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Champ>
            <div className="border-t border-border pt-3">
              <p className="text-sm font-semibold text-ink mb-2">Vocabulaire <span className="font-normal text-muted">(vide = celui du modèle)</span></p>
              <div className="grid grid-cols-2 gap-3">
                {CLES_TERMS.map(({ k, label }) => (
                  <Champ key={k} label={label}>
                    <input value={edition.terms[k] ?? ""} className="input-auth"
                      onChange={(e) => setEdition((v) => v && ({ ...v, terms: { ...v.terms, [k]: e.target.value } }))} />
                  </Champ>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => setEdition(null)} className="flex-1 border border-border rounded-xl py-2.5 text-sm text-muted">Annuler</button>
              <button type="submit" disabled={envoi} className="flex-1 btn-primary justify-center py-2.5 rounded-xl disabled:opacity-70">
                {envoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Enregistrer
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5 flex flex-col gap-2">
            {categories.map((c) => (
              <div key={c.id} className={`flex items-center gap-3 border border-border rounded-xl px-3.5 py-2.5 ${c.active ? "" : "opacity-60"}`}>
                <div className="min-w-0 grow">
                  <p className="text-sm font-semibold text-ink truncate">{c.label} <span className="font-mono text-[11px] text-muted">{c.id}</span></p>
                  <p className="text-xs text-muted truncate">{FAMILLES[c.family]?.split(" (")[0]} · {c.description || "—"}</p>
                </div>
                <button onClick={() => basculer(c)} className="text-xs border border-border rounded-lg px-2.5 py-1.5 text-muted hover:text-ink">
                  {c.active ? "Retirer" : "Proposer"}
                </button>
                <button onClick={() => setEdition({ ...VIDE, ...c, terms: { ...c.terms }, nouvelle: false })}
                  className="text-xs border border-border rounded-lg px-2.5 py-1.5 text-ink hover:bg-surface">Modifier</button>
              </div>
            ))}
            <button onClick={() => setEdition({ ...VIDE, nouvelle: true })} className="btn-primary justify-center py-2.5 rounded-xl mt-2">
              <Plus className="w-4 h-4" /> Nouvelle catégorie
            </button>
            <p className="text-[11px] text-muted mt-1">« Retirer » cache une catégorie à l&apos;inscription sans toucher aux établissements qui l&apos;utilisent.</p>
          </div>
        )}
      </div>
    </div>
  );
}
