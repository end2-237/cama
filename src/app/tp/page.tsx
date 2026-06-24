"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft, Play, Loader2, Terminal, RotateCcw, FileCode2, Server,
  CheckCircle2, AlertCircle, ChevronDown, Cpu, Plus, Trash2, X,
  ExternalLink, Maximize2, Wifi, Code2, BookOpen, Copy, Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchRuntimes, executeCode, versionFor, LANGS, type Runtime } from "@/lib/piston";
import { fetchMachines, addMachine, deleteMachine } from "@/lib/tp";
import type { DBRemoteMachine } from "@/lib/supabase";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-sm text-white/50">Chargement de l&apos;éditeur…</div>,
});

const EMPTY_MACHINE: Partial<DBRemoteMachine> = {
  name: "", os: "Ubuntu 22.04", kind: "ttyd", web_url: "", description: "", status: "unknown",
};

export default function TPPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<"remote" | "sandbox">("remote");

  const canManage = user?.role === "admin" || user?.role === "enseignant";

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e]">
      <header className="flex items-center gap-3 px-4 h-12 bg-[#252526] border-b border-black/30 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <div className="w-px h-5 bg-white/15" />
        <span className="text-sm font-bold text-white flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-cama" /> TP — Travaux pratiques
        </span>
        <div className="flex gap-0.5 ml-3 bg-[#3c3c3c] rounded-lg p-0.5">
          <button onClick={() => setMode("remote")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              mode === "remote" ? "bg-cama text-white" : "text-white/60 hover:text-white"}`}>
            <Server className="w-3.5 h-3.5" /> Machine distante
          </button>
          <button onClick={() => setMode("sandbox")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              mode === "sandbox" ? "bg-cama text-white" : "text-white/60 hover:text-white"}`}>
            <Code2 className="w-3.5 h-3.5" /> Bac à sable
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        {mode === "remote" ? <RemoteMode canManage={canManage} userId={user?.id ?? null} /> : <SandboxMode />}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MODE 1 — Machine Linux distante (terminal web embarqué)
════════════════════════════════════════════════════════════ */
function RemoteMode({ canManage, userId }: { canManage: boolean; userId: string | null }) {
  const [machines, setMachines] = useState<DBRemoteMachine[]>([]);
  const [selected, setSelected] = useState<DBRemoteMachine | null>(null);
  const [loading, setLoading]   = useState(true);
  const [addOpen, setAddOpen]   = useState(false);
  const [form, setForm]         = useState<Partial<DBRemoteMachine>>(EMPTY_MACHINE);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const reload = async () => {
    setLoading(true);
    const m = await fetchMachines();
    setMachines(m);
    setSelected((s) => s ?? m[0] ?? null);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const save = async () => {
    if (!form.name || !form.web_url) { setErr("Nom et URL du terminal obligatoires."); return; }
    if (!/^https:\/\//.test(form.web_url)) { setErr("L'URL doit être en HTTPS."); return; }
    setSaving(true);
    const { error } = await addMachine({ ...form, added_by: userId });
    setSaving(false);
    if (error) setErr(error.message);
    else { setAddOpen(false); setForm(EMPTY_MACHINE); setErr(null); reload(); }
  };

  const del = async (id: string) => {
    if (!confirm("Supprimer cette machine ?")) return;
    await deleteMachine(id);
    setSelected((s) => s?.id === id ? null : s);
    reload();
  };

  return (
    <div className="h-full grid lg:grid-cols-[300px_1fr]">
      {/* Liste machines */}
      <aside className="bg-[#252526] border-r border-black/30 flex flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b border-black/30 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-4 h-4 text-cama" /> Machines
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setGuideOpen(true)} title="Guide d'installation"
              className="text-white/60 hover:text-cama transition-colors">
              <BookOpen className="w-4 h-4" />
            </button>
            {canManage && (
              <button onClick={() => { setAddOpen(true); setErr(null); }} title="Ajouter une machine"
                className="text-white/60 hover:text-cama transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-cama mx-auto" /></div>
        ) : machines.length === 0 ? (
          <div className="p-4 text-xs text-white/50 leading-relaxed">
            Aucune machine enregistrée.
            {canManage && <> Cliquez sur <strong className="text-white">+</strong> pour en ajouter une.</>}
          </div>
        ) : (
          <div className="divide-y divide-black/20">
            {machines.map((m) => (
              <button key={m.id} onClick={() => setSelected(m)}
                className={`w-full text-left p-3 hover:bg-white/5 transition-colors flex items-center gap-2 ${
                  selected?.id === m.id ? "bg-white/10" : ""}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  m.status === "up" ? "bg-green-500" : m.status === "down" ? "bg-red-500" : "bg-white/30"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{m.name}</p>
                  <p className="text-[11px] text-white/50 truncate">{m.os} · {m.kind}</p>
                </div>
                {canManage && (
                  <span onClick={(e) => { e.stopPropagation(); del(m.id); }}
                    className="text-white/30 hover:text-red-400 transition-colors cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Aide setup */}
        <button onClick={() => setGuideOpen(true)}
          className="mt-auto p-3 border-t border-black/30 text-[10px] text-white/40 leading-relaxed text-left hover:bg-white/5 transition-colors">
          <p className="font-bold text-white/60 mb-1 flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> Connecter un vrai PC Linux</p>
          <p>Un seul script installe le terminal web + le tunnel HTTPS sur votre VPS ou VM. <span className="text-cama font-bold">Voir le guide →</span></p>
        </button>
      </aside>

      {/* Terminal embarqué */}
      <div className="flex flex-col min-h-0 bg-black">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-white/50 text-sm">
            Sélectionnez une machine pour vous y connecter.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-4 h-10 bg-[#252526] border-b border-black/30 flex-shrink-0">
              <Wifi className={`w-3.5 h-3.5 ${selected.status === "up" ? "text-green-500" : "text-white/40"}`} />
              <span className="text-xs font-bold text-white">{selected.name}</span>
              <span className="text-[11px] text-white/50">· {selected.os}</span>
              <div className="flex-1" />
              <a href={selected.web_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-white/60 hover:text-white transition-colors">
                <Maximize2 className="w-3.5 h-3.5" /> Plein écran
              </a>
              <a href={selected.web_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-white/60 hover:text-white transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Nouvel onglet
              </a>
            </div>
            <iframe
              key={selected.id}
              src={selected.web_url}
              title={selected.name}
              className="flex-1 w-full bg-black"
              allow="clipboard-read; clipboard-write"
            />
            <div className="px-4 py-1.5 bg-[#252526] border-t border-black/30 text-[10px] text-white/40 flex-shrink-0">
              Si le terminal reste noir, la machine bloque peut-être l&apos;intégration (X-Frame-Options). Utilisez « Nouvel onglet ».
            </div>
          </>
        )}
      </div>

      {/* Modal ajout machine */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-ink">Ajouter une machine distante</h2>
              <button onClick={() => setAddOpen(false)} className="text-muted hover:text-ink"><X className="w-5 h-5" /></button>
            </div>
            {err && <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3"><AlertCircle className="w-4 h-4" /> {err}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Nom *</label>
                <input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Serveur TP Réseau" className="input-auth text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">OS</label>
                  <input value={form.os ?? ""} onChange={(e) => setForm((f) => ({ ...f, os: e.target.value }))}
                    placeholder="Ubuntu 22.04" className="input-auth text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Type de terminal</label>
                  <select value={form.kind ?? "ttyd"} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as DBRemoteMachine["kind"] }))}
                    className="input-auth text-sm bg-white">
                    <option value="ttyd">ttyd</option>
                    <option value="wetty">wetty</option>
                    <option value="guacamole">Guacamole</option>
                    <option value="vnc">noVNC</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">URL du terminal web (HTTPS) *</label>
                <input value={form.web_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, web_url: e.target.value }))}
                  placeholder="https://machine.trycloudflare.com" className="input-auth text-sm" />
                <p className="text-[10px] text-muted mt-1">Doit servir un terminal web (ttyd/wetty/Guacamole) et autoriser l&apos;intégration iframe.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Description</label>
                <input value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="TP configuration réseau Cisco" className="input-auth text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setAddOpen(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-semibold text-muted">Annuler</button>
              <button onClick={save} disabled={saving}
                className="flex-1 bg-cama text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-cama-700 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {guideOpen && <SetupGuide onClose={() => setGuideOpen(false)} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Guide d'installation — connecter une vraie machine Linux
════════════════════════════════════════════════════════════ */
const SETUP_BRANCH = "claude/happy-fermat-dBByg";
const ONE_LINER = `curl -fsSL https://raw.githubusercontent.com/end2-237/cama/${SETUP_BRANCH}/scripts/cama-tp-setup.sh | sudo bash`;

function CopyLine({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group">
      <pre className="bg-black rounded-lg p-3 pr-10 text-[12px] text-green-300 font-mono overflow-x-auto whitespace-pre-wrap break-all">{cmd}</pre>
      <button onClick={() => { navigator.clipboard.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="absolute top-2 right-2 text-white/40 hover:text-white transition-colors" title="Copier">
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

function SetupGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#252526] border-b border-white/10 px-6 py-4 flex items-center gap-2 z-10">
          <BookOpen className="w-5 h-5 text-cama" />
          <h2 className="text-base font-bold text-white">Connecter une vraie machine Linux</h2>
          <button onClick={onClose} className="ml-auto text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5 text-sm text-white/80 leading-relaxed">
          <p>CAMA embarque le terminal web de votre machine (VPS, VM, serveur de TP) dans un iframe.
            Un seul script installe <strong className="text-white">ttyd</strong> (terminal web) +
            <strong className="text-white"> cloudflared</strong> (tunnel HTTPS gratuit, sans nom de domaine).</p>

          <div>
            <p className="text-xs font-bold text-cama uppercase tracking-wider mb-2">1 · Sur la machine (en root)</p>
            <p className="mb-2">Connectez-vous en SSH (ex. votre VPS) puis lancez :</p>
            <CopyLine cmd="ssh root@187.127.226.96" />
            <div className="h-2" />
            <CopyLine cmd={ONE_LINER} />
            <p className="text-[12px] text-white/50 mt-2">Compatible Ubuntu 18 → 24 et Debian (architectures x86_64 / arm64).
              Le script crée des services systemd (démarrage auto) et affiche à la fin l&apos;URL HTTPS + un login/mot de passe.</p>
          </div>

          <div>
            <p className="text-xs font-bold text-cama uppercase tracking-wider mb-2">2 · Personnaliser (optionnel)</p>
            <p className="mb-2">Imposez vos identifiants ou un accès lecture seule :</p>
            <CopyLine cmd={`TP_USER=jfn TP_PASS=monMotDePasse TP_WRITABLE=1 sudo -E bash -c "$(curl -fsSL https://raw.githubusercontent.com/end2-237/cama/${SETUP_BRANCH}/scripts/cama-tp-setup.sh)"`} />
            <p className="text-[12px] text-white/50 mt-2">
              <code className="text-white/70">TP_WRITABLE=0</code> = terminal en lecture seule (démo non interactive).
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-cama uppercase tracking-wider mb-2">3 · Dans CAMA</p>
            <p>Cliquez sur <strong className="text-white">«+»</strong>, collez l&apos;URL <code className="text-white/70">https://…trycloudflare.com</code>,
              choisissez le type <strong className="text-white">ttyd</strong>, enregistrez.
              Le terminal s&apos;ouvre dans CAMA et demande le login/mot de passe affichés par le script.</p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-[12px] text-amber-200/90">
            <p className="font-bold mb-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Sécurité</p>
            <p>Le terminal donne un shell réel sur la machine. Gardez le mot de passe, n&apos;utilisez pas un compte root critique pour des TP publics,
              et arrêtez le service après la séance : <code className="text-amber-100">systemctl disable --now cama-ttyd cama-tunnel</code>.</p>
          </div>

          <div className="text-[12px] text-white/50">
            <p className="font-bold text-white/70 mb-1">Vérifier / dépanner sur la machine :</p>
            <CopyLine cmd="systemctl status cama-ttyd cama-tunnel && tail -n 20 /var/log/cama-tunnel.log" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MODE 2 — Bac à sable : éditeur Monaco + exécution Piston
════════════════════════════════════════════════════════════ */
const ENONCE = `## TP — Premiers pas

Implémentez la fonction somme(a, b) qui retourne la somme de deux nombres,
puis affichez le résultat de somme(2, 3) (doit afficher 5).

Choisissez un langage, écrivez votre solution, puis cliquez sur Exécuter.`;

function SandboxMode() {
  const [runtimes, setRuntimes] = useState<Runtime[]>([]);
  const [langId, setLangId]     = useState(LANGS[0].id);
  const [code, setCode]         = useState(LANGS[0].template);
  const [stdin, setStdin]       = useState("");
  const [output, setOutput]     = useState("");
  const [status, setStatus]     = useState<"idle" | "running" | "ok" | "error">("idle");
  const [rtErr, setRtErr]       = useState<string | null>(null);
  const edited = useRef<Set<string>>(new Set());

  const lang = LANGS.find((l) => l.id === langId)!;

  useEffect(() => { fetchRuntimes().then(setRuntimes).catch((e) => setRtErr(e.message)); }, []);

  const changeLang = (id: string) => {
    setLangId(id);
    if (!edited.current.has(id)) setCode(LANGS.find((x) => x.id === id)!.template);
  };
  const onChange = (v?: string) => { setCode(v ?? ""); edited.current.add(langId); };
  const reset = () => { setCode(lang.template); edited.current.delete(langId); setOutput(""); setStatus("idle"); };

  const run = async () => {
    setStatus("running"); setOutput("");
    try {
      const version = versionFor(runtimes, lang.id);
      if (!version) throw new Error("Langage indisponible.");
      const res = await executeCode({ language: lang.id, version, content: code, stdin, filename: lang.filename });
      setOutput(res.output || res.stdout || res.stderr || "(aucune sortie)");
      setStatus(res.code === 0 && !res.stderr ? "ok" : "error");
    } catch (e) {
      setOutput(e instanceof Error ? e.message : "Erreur"); setStatus("error");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-4 h-10 bg-[#252526] border-b border-black/30 flex-shrink-0">
        <div className="relative">
          <select value={langId} onChange={(e) => changeLang(e.target.value)}
            className="appearance-none bg-[#3c3c3c] text-white text-xs font-semibold rounded-lg pl-3 pr-8 py-1.5 outline-none border border-white/10 focus:border-cama cursor-pointer">
            {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-white/50 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <button onClick={reset} className="flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white border border-white/10 rounded-lg px-2.5 py-1.5">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
        <button onClick={run} disabled={status === "running" || runtimes.length === 0}
          className="flex items-center gap-1.5 text-xs font-bold bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50">
          {status === "running" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Exécuter
        </button>
      </div>

      {rtErr && <div className="bg-red-900/40 text-red-200 text-xs px-4 py-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {rtErr}</div>}

      <div className="flex-1 min-h-0 grid lg:grid-cols-[280px_1fr_1fr]">
        <aside className="hidden lg:flex flex-col bg-[#252526] border-r border-black/30 overflow-y-auto">
          <div className="px-4 py-3 border-b border-black/30 flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-cama" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Énoncé</span>
          </div>
          <div className="p-4 text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap">{ENONCE}</div>
        </aside>

        <div className="min-h-0 border-r border-black/30">
          <MonacoEditor height="100%" theme="vs-dark" language={lang.monaco} value={code} onChange={onChange}
            options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, tabSize: 2, automaticLayout: true, padding: { top: 12 } }} />
        </div>

        <div className="flex flex-col min-h-0 bg-[#1e1e1e]">
          <div className="px-4 py-2 border-b border-black/30 flex items-center gap-2 flex-shrink-0">
            <Terminal className="w-4 h-4 text-white/70" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Console</span>
            {status === "ok" && <span className="ml-auto text-[11px] text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Exécuté</span>}
            {status === "error" && <span className="ml-auto text-[11px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Erreur</span>}
          </div>
          <pre className="flex-1 min-h-0 overflow-auto p-4 text-[13px] font-mono text-white/90 whitespace-pre-wrap">
{status === "idle" ? "▶ La sortie de votre programme apparaîtra ici."
 : status === "running" ? "Exécution en cours…" : output}
          </pre>
          <div className="border-t border-black/30 flex-shrink-0">
            <div className="px-4 py-1.5 text-[10px] font-bold text-white/50 uppercase tracking-wider">Entrée standard (stdin)</div>
            <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={3}
              placeholder="Données passées via stdin…"
              className="w-full bg-[#252526] text-white/90 text-[13px] font-mono px-4 py-2 outline-none resize-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
