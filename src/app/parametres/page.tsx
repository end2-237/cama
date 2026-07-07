"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Settings, Wifi, MapPin, Building2, Clock, Plus, Trash2,
  Check, Bell, Globe, Send, CalendarClock, ShieldCheck, AlertTriangle, Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { CycleMode } from "@/lib/supabase";
import {
  requestNotificationPermission, webPermissionState, showLocalNotification,
} from "@/lib/pushNotifications";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const CYCLE_MODES: { id: CycleMode; label: string; color: string; desc: string }[] = [
  { id: "presentiel", label: "Présentiel", color: "#4F46E5", desc: "Cours sur le campus aux horaires fixes." },
  { id: "hybride", label: "Hybride", color: "#D97706", desc: "Mix campus + en ligne selon les séances." },
  { id: "online", label: "En ligne", color: "#059669", desc: "100 % à distance, à votre rythme." },
];

const MODE_ICON = { online: Wifi, hybride: MapPin, presentiel: Building2 } as const;

type SlotRequest = { id: string; day: string; start: string; end: string; ue: string; note: string; status: "propose" | "valide" | "rejete" };

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<CycleMode>("hybride");
  const [deadlineWeeks, setDeadlineWeeks] = useState(12);
  const [myRequests, setMyRequests] = useState<SlotRequest[]>([]);

  const [day, setDay] = useState<string>(DAYS[0]);
  const [start, setStart] = useState("18h00");
  const [end, setEnd] = useState("19h00");
  const [ue, setUe] = useState("");
  const [note, setNote] = useState("");
  const [prefs, setPrefs] = useState({ liveReminder: true, weeklyDigest: true, lowData: true });

  // État d'autorisation des notifications navigateur
  const [notifPerm, setNotifPerm] = useState<"default" | "granted" | "denied" | "unsupported">("default");
  useEffect(() => { setNotifPerm(webPermissionState()); }, []);

  const enableNotifications = async () => {
    const ok = await requestNotificationPermission();
    setNotifPerm(webPermissionState());
    if (ok) {
      await showLocalNotification({
        title: "Notifications activées ✅",
        body: "Vous recevrez désormais les alertes CAMA sur ce site.",
        link: "/dashboard",
      });
    }
  };

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user?.dossier?.mode) setMode(user.dossier.mode as CycleMode);
  }, [user]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>;
  }

  const isStudent = user.role === "etudiant";
  const meta = CYCLE_MODES.find((m) => m.id === mode) ?? CYCLE_MODES[1];
  const canPropose = mode !== "presentiel";

  const addRequest = () => {
    if (!ue.trim()) return;
    setMyRequests((r) => [...r, { id: crypto.randomUUID(), day, start: start.trim(), end: end.trim(), ue: ue.trim(), note: note.trim(), status: "propose" }]);
    setUe(""); setNote("");
  };
  const delRequest = (id: string) => setMyRequests((r) => r.filter((x) => x.id !== id));

  const ST = {
    propose: { label: "En attente de validation", cls: "bg-gold/10 text-gold-dark" },
    valide:  { label: "Validé", cls: "bg-green-50 text-green-600" },
    rejete:  { label: "Refusé", cls: "bg-red-50 text-red-500" },
  } as const;
  const field = "w-full text-sm border border-border px-3 py-2 outline-none focus:border-cama";

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 flex items-center gap-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2 flex-1">
            <Settings className="w-4 h-4 text-cama" />
            <p className="text-sm font-bold text-ink">Mes réglages</p>
          </div>
          <Link href="/dashboard" className="text-xs font-bold text-cama hover:underline">Terminé</Link>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Compte */}
        <section className="bg-white border border-border">
          <div className="px-5 py-3 border-b border-border"><h2 className="text-sm font-bold text-ink">Compte</h2></div>
          <div className="p-5 flex items-center gap-4 flex-wrap">
            <div className={`w-14 h-14 rounded-full ${user.avatarColor} text-white flex items-center justify-center text-lg font-bold flex-shrink-0`}>{user.initials}</div>
            <div className="flex-1 min-w-[180px]">
              <p className="text-base font-bold text-ink">{user.name}</p>
              <p className="text-sm text-muted">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-cama-50 text-cama">{user.roleLabel}</span>
                {user.school && <span className="text-[10px] font-bold px-2 py-0.5 bg-surface text-muted">{user.school}</span>}
                {user.level && <span className="text-[10px] font-bold px-2 py-0.5 bg-gold/10 text-gold-dark">{user.level}</span>}
              </div>
            </div>
          </div>
        </section>

        {isStudent && (
          <>
            {/* Mode d'inscription */}
            <section className="bg-white border border-border">
              <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-cama" />
                <h2 className="text-sm font-bold text-ink">Mode d&apos;inscription</h2>
                <span className="text-[11px] text-muted">— détermine votre emploi du temps</span>
              </div>
              <div className="p-5">
                <div className="grid sm:grid-cols-3 gap-3">
                  {CYCLE_MODES.map((m) => {
                    const Icon = MODE_ICON[m.id];
                    const active = mode === m.id;
                    return (
                      <button key={m.id} onClick={() => setMode(m.id)}
                        className={`text-left p-4 border-2 transition-all ${active ? "border-transparent" : "border-border hover:border-ink/20"}`}
                        style={active ? { borderColor: m.color, background: `${m.color}0d` } : undefined}>
                        <div className="flex items-center justify-between mb-2">
                          <Icon className="w-5 h-5" style={{ color: m.color }} />
                          {active && <Check className="w-4 h-4" style={{ color: m.color }} />}
                        </div>
                        <p className="text-sm font-bold text-ink">{m.label}</p>
                        <p className="text-[11px] text-muted leading-snug mt-0.5">{m.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {mode === "hybride" && (
                  <div className="mt-4 flex items-center gap-3 p-3 bg-gold/5 border border-gold/20 flex-wrap">
                    <Clock className="w-4 h-4 text-gold-dark flex-shrink-0" />
                    <p className="text-xs text-ink flex-1 min-w-[200px]">
                      <strong>Délai de progression en ligne</strong> — vous devez boucler vos cours en ligne dans ce délai.
                    </p>
                    <select value={deadlineWeeks} onChange={(e) => setDeadlineWeeks(Number(e.target.value))}
                      className="text-sm border border-border px-3 py-1.5 outline-none bg-white">
                      {[8, 10, 12, 16].map((w) => <option key={w} value={w}>{w} semaines</option>)}
                    </select>
                  </div>
                )}
              </div>
            </section>

            {/* Proposition de créneaux */}
            <section className="bg-white border border-border">
              <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                <Send className="w-4 h-4 text-cama" />
                <h2 className="text-sm font-bold text-ink">Proposer un créneau</h2>
              </div>

              {canPropose ? (
                <div className="p-5">
                  <div className="flex items-start gap-2 p-3 bg-cama-50/50 border border-cama/15 mb-4">
                    <Info className="w-4 h-4 text-cama flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-ink leading-snug">{meta.desc} Toute proposition est soumise à validation de l&apos;administration.</p>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1 block">Jour</label>
                      <select value={day} onChange={(e) => setDay(e.target.value)} className={`${field} bg-white`}>{DAYS.map((d) => <option key={d}>{d}</option>)}</select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1 block">Début</label>
                      <input value={start} onChange={(e) => setStart(e.target.value)} placeholder="18h00" className={field} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1 block">Fin</label>
                      <input value={end} onChange={(e) => setEnd(e.target.value)} placeholder="19h00" className={field} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1 block">UE / matière</label>
                      <input value={ue} onChange={(e) => setUe(e.target.value)} placeholder="Ex: INF201" className={field} />
                    </div>
                  </div>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Motif / commentaire (optionnel)…" className={`${field} mt-3`} />
                  <button onClick={addRequest} className="btn-primary py-2.5 px-6 text-sm gap-2 mt-3"><Plus className="w-4 h-4" /> Soumettre la proposition</button>
                </div>
              ) : (
                <div className="p-5 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted leading-relaxed">En mode <strong>présentiel</strong>, les horaires sont fixés par l&apos;administration et vous suivez les cours sur le campus — aucune proposition de créneau n&apos;est nécessaire.</p>
                </div>
              )}

              {myRequests.length > 0 && (
                <div className="border-t border-border divide-y divide-border">
                  <p className="px-5 py-2 text-[10px] font-black text-ink uppercase tracking-widest bg-surface">Mes propositions</p>
                  {myRequests.map((r) => {
                    const st = ST[r.status];
                    return (
                      <div key={r.id} className="px-5 py-3 flex items-center gap-3 flex-wrap">
                        <Clock className="w-4 h-4 text-subtle flex-shrink-0" />
                        <div className="flex-1 min-w-[160px]">
                          <p className="text-sm font-semibold text-ink">{r.day} · {r.start}–{r.end} <span className="text-[11px] text-muted font-normal">· {r.ue}</span></p>
                          {r.note && <p className="text-[11px] text-muted leading-snug mt-0.5">{r.note}</p>}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 ${st.cls}`}>{st.label}</span>
                        {r.status === "propose" && (
                          <button onClick={() => delRequest(r.id)} className="p-1.5 text-subtle hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* Préférences */}
        <section className="bg-white border border-border">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Bell className="w-4 h-4 text-cama" />
            <h2 className="text-sm font-bold text-ink">Préférences</h2>
          </div>
          <div className="divide-y divide-border">
            {/* Autorisation des notifications navigateur (site) */}
            <div className="px-5 py-3 flex items-center gap-3">
              <Bell className="w-4 h-4 text-cama flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">Notifications du site</p>
                <p className="text-[11px] text-muted leading-snug">
                  {notifPerm === "granted" ? "Activées — vous recevez les alertes CAMA sur cet appareil."
                    : notifPerm === "denied" ? "Bloquées par le navigateur. Autorisez-les dans les réglages du site."
                    : notifPerm === "unsupported" ? "Non supportées par ce navigateur."
                    : "Recevez les alertes (résultats, messages, lives) même hors de la page."}
                </p>
              </div>
              {notifPerm === "granted" ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-green-700 flex-shrink-0">
                  <Check className="w-3.5 h-3.5" /> Activé
                </span>
              ) : (
                <button onClick={enableNotifications} disabled={notifPerm === "denied" || notifPerm === "unsupported"}
                  className="text-[11px] font-black uppercase tracking-widest bg-cama text-white px-3 py-2 hover:bg-cama-700 transition-colors disabled:opacity-40 flex-shrink-0">
                  Activer
                </button>
              )}
            </div>
            {([
              { k: "liveReminder", icon: Bell, label: "Rappels de live", desc: "Notification avant le démarrage d'une classe virtuelle." },
              { k: "weeklyDigest", icon: CalendarClock, label: "Récapitulatif hebdomadaire", desc: "Un résumé de votre semaine chaque dimanche soir." },
              { k: "lowData", icon: ShieldCheck, label: "Mode économie de données", desc: "Privilégie l'audio et le texte ; affiche le poids avant ouverture." },
            ] as const).map((p) => (
              <div key={p.k} className="px-5 py-3 flex items-center gap-3">
                <p.icon className="w-4 h-4 text-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{p.label}</p>
                  <p className="text-[11px] text-muted leading-snug">{p.desc}</p>
                </div>
                <button onClick={() => setPrefs((s) => ({ ...s, [p.k]: !s[p.k] }))}
                  className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${prefs[p.k] ? "bg-cama" : "bg-border"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${prefs[p.k] ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            ))}
            <div className="px-5 py-3 flex items-center gap-3">
              <Globe className="w-4 h-4 text-muted flex-shrink-0" />
              <p className="text-sm font-semibold text-ink flex-1">Langue</p>
              <select className="text-sm border border-border px-3 py-1.5 outline-none bg-white"><option>Français</option><option>English</option></select>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
