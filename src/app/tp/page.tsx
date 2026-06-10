"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Terminal, Monitor, Server, Wifi, WifiOff,
  Play, Square, RefreshCw, Copy, CheckCheck, ChevronRight,
  Globe, Lock, Cpu, HardDrive, MemoryStick, Clock,
  AlertTriangle, Info, Zap, BookOpen, Download, ShieldCheck,
  Layers, Search, Bell, HelpCircle, KeyRound, Activity,
} from "lucide-react";

/* ── Types ── */
type VMStatus = "running" | "stopped" | "starting" | "error";
type ConnMode  = "vnc" | "ssh" | "rdp";

interface VM {
  id: string;
  name: string;
  os: string;
  osIcon: string;
  tp: string;
  cpu: number;
  ram: number;
  disk: number;
  status: VMStatus;
  ip: string;
  connModes: ConnMode[];
  desc: string;
}

interface RemoteMachine {
  id: string;
  label: string;
  host: string;
  port: number;
  mode: ConnMode;
  desc: string;
  status: "up" | "down";
}

/* ── Données démo ── */
const VMS: VM[] = [
  {
    id: "vm-linux-1",
    name: "Debian 12 — Réseau",
    os: "Debian GNU/Linux 12",
    osIcon: "🐧",
    tp: "INF301 — TP Réseaux S4",
    cpu: 2, ram: 2, disk: 20,
    status: "running",
    ip: "10.10.1.11",
    connModes: ["vnc", "ssh"],
    desc: "Environnement pré-configuré avec Cisco Packet Tracer, Wireshark et iperf3.",
  },
  {
    id: "vm-win-1",
    name: "Windows Server 2022",
    os: "Windows Server 2022",
    osIcon: "🪟",
    tp: "INF305 — Administration systèmes",
    cpu: 4, ram: 4, disk: 60,
    status: "stopped",
    ip: "10.10.1.22",
    connModes: ["rdp", "vnc"],
    desc: "Active Directory, IIS, PowerShell pré-installés. Snapshot pédagogique fourni.",
  },
  {
    id: "vm-kali",
    name: "Kali Linux 2024.2",
    os: "Kali Linux",
    osIcon: "🐉",
    tp: "INF402 — Sécurité offensive (encadré)",
    cpu: 2, ram: 4, disk: 40,
    status: "stopped",
    ip: "10.10.1.33",
    connModes: ["vnc", "ssh"],
    desc: "Accessible uniquement pendant les séances TP encadrées. Toutes actions sont journalisées.",
  },
  {
    id: "vm-ubuntu-web",
    name: "Ubuntu 22.04 LTS — Web",
    os: "Ubuntu 22.04 LTS",
    osIcon: "🟠",
    tp: "INF202 — Développement web",
    cpu: 2, ram: 2, disk: 15,
    status: "running",
    ip: "10.10.1.44",
    connModes: ["vnc", "ssh"],
    desc: "Stack LAMP pré-installée, Node.js 20, VS Code Server accessible via navigateur.",
  },
];

const REMOTE_MACHINES: RemoteMachine[] = [
  { id: "rm-cisco-1", label: "Routeur Cisco ISR 4331", host: "cisco-lab1.jfn.cm", port: 22, mode: "ssh", status: "up",   desc: "Lab Cisco pour TP routage dynamique OSPF/BGP" },
  { id: "rm-nas",     label: "NAS de stockage TP",     host: "nas.jfn.cm",        port: 22, mode: "ssh", status: "up",   desc: "Dépôt de rendus, rapports et captures Wireshark" },
  { id: "rm-esxi",    label: "Hyperviseur ESXi TP",    host: "esxi.jfn.cm",       port: 443, mode: "vnc", status: "down", desc: "En maintenance — reprise estimée 12 juin" },
];

const STATUS_STYLE: Record<VMStatus, string> = {
  running:  "bg-green-500",
  stopped:  "bg-border",
  starting: "bg-gold animate-pulse",
  error:    "bg-red-500",
};
const STATUS_LABEL: Record<VMStatus, string> = {
  running:  "En ligne",
  stopped:  "Arrêtée",
  starting: "Démarrage…",
  error:    "Erreur",
};
const CONN_COLOR: Record<ConnMode, string> = {
  vnc: "bg-purple-100 text-purple-700",
  ssh: "bg-green-50 text-green-700",
  rdp: "bg-blue-50 text-blue-700",
};

export default function TPPage() {
  const [vmStates, setVmStates]   = useState<Record<string, VMStatus>>(
    Object.fromEntries(VMS.map((v) => [v.id, v.status]))
  );
  const [copiedId, setCopiedId]   = useState<string | null>(null);
  const [activeVM, setActiveVM]   = useState<VM | null>(null);
  const [activeMode, setActiveMode] = useState<ConnMode>("vnc");
  const [activeTab, setActiveTab]   = useState<"vm" | "remote">("vm");

  const toggleVM = (id: string) => {
    setVmStates((prev) => {
      const s = prev[id];
      if (s === "running") return { ...prev, [id]: "stopped" };
      if (s === "stopped") {
        setTimeout(() => setVmStates((p) => ({ ...p, [id]: "running" })), 2000);
        return { ...prev, [id]: "starting" };
      }
      return prev;
    });
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="min-h-screen bg-surface">

      {/* Top bar */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-12">

          {/* Retour + identité */}
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:block">Dashboard</span>
          </Link>
          <div className="w-px h-5 bg-border flex-shrink-0" />
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 bg-ink flex items-center justify-center">
              <Terminal className="w-3.5 h-3.5 text-green-400" />
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-[11px] font-black text-ink leading-none">TP Labs</p>
              <p className="text-[9px] text-subtle leading-none">Institut JFN</p>
            </div>
          </div>
          <div className="w-px h-5 bg-border flex-shrink-0 hidden md:block" />

          {/* Onglets principaux */}
          <nav className="hidden md:flex items-center h-12">
            {([
              { id: "vm",     icon: Monitor,  label: "Machines virtuelles" },
              { id: "remote", icon: Server,   label: "Machines distantes" },
            ] as const).map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 h-full text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === t.id
                    ? "border-cama text-cama"
                    : "border-transparent text-muted hover:text-ink"
                }`}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </nav>

          {/* Recherche */}
          <div className="hidden lg:flex flex-1 max-w-[220px] items-center gap-2 bg-surface px-3 py-1.5 border border-border focus-within:border-cama transition-colors ml-1">
            <Search className="w-3.5 h-3.5 text-subtle flex-shrink-0" />
            <input type="text" placeholder="Chercher une VM..."
              className="bg-transparent text-xs text-ink placeholder-subtle outline-none w-full" />
          </div>

          <div className="flex-1" />

          {/* Statut hyperviseur */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 border border-green-200 bg-green-50">
            <Activity className="w-3 h-3 text-green-600" />
            <span className="text-[10px] font-bold text-green-700">Hyperviseur actif</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          </div>

          {/* Icônes actions */}
          <div className="flex items-center gap-0.5 ml-1">
            <button title="Mes crédits TP"
              className="flex items-center gap-1 px-2 py-1.5 text-muted hover:text-cama hover:bg-surface transition-colors text-[10px] font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden lg:block">Crédits</span>
            </button>
            <button title="Clé SSH enregistrée"
              className="p-1.5 text-muted hover:text-cama hover:bg-surface transition-colors">
              <KeyRound className="w-4 h-4" />
            </button>
            <button title="Notifications" className="relative p-1.5 text-muted hover:text-cama hover:bg-surface transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
            <Link href="/guide" title="Aide connexion"
              className="p-1.5 text-muted hover:text-cama hover:bg-surface transition-colors">
              <HelpCircle className="w-4 h-4" />
            </Link>
          </div>

          {/* Onglets mobile */}
          <div className="flex md:hidden gap-px border border-border overflow-hidden ml-1">
            {(["vm", "remote"] as const).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 text-[10px] font-bold transition-colors ${
                  activeTab === t ? "bg-cama text-white" : "bg-white text-muted"
                }`}>
                {t === "vm" ? "VMs" : "Dist."}
              </button>
            ))}
          </div>

        </div>
      </header>

      <div className="max-w-[1200px] mx-auto grid lg:grid-cols-[1fr_340px] gap-0 items-start border-x border-border bg-white">

        {/* ══ COLONNE PRINCIPALE ══ */}
        <div className="border-r border-border min-h-[calc(100vh-48px)]">

          {/* Info banner */}
          <div className="flex items-start gap-3 p-3 bg-cama/5 border-b border-border">
            <Info className="w-4 h-4 text-cama flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-ink leading-relaxed">
              Les VMs sont des environnements isolés fournis par l&apos;Institut JFN. Elles sont réinitialisées après chaque séance TP.
              <strong> Sauvegardez vos travaux</strong> sur le NAS ou votre espace CAMA avant de fermer.
            </p>
          </div>

          {/* ── VMs ── */}
          {activeTab === "vm" && (
            <div className="divide-y divide-border">
              {VMS.map((vm) => {
                const st = vmStates[vm.id];
                return (
                  <div key={vm.id} className={`p-4 transition-colors ${activeVM?.id === vm.id ? "bg-cama/5" : "hover:bg-surface"}`}>
                    <div className="flex items-start gap-3">
                      {/* OS icon + statut */}
                      <div className="w-10 h-10 bg-ink flex items-center justify-center text-xl flex-shrink-0">
                        {vm.osIcon}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-sm font-bold text-ink">{vm.name}</p>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 ${
                            st === "running" ? "bg-green-50 text-green-700" :
                            st === "starting" ? "bg-gold/10 text-gold-dark" :
                            st === "error"   ? "bg-red-50 text-red-600" :
                            "bg-surface text-subtle"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLE[st]}`} />
                            {STATUS_LABEL[st]}
                          </span>
                        </div>
                        <p className="text-[10px] text-cama font-bold">{vm.tp}</p>
                        <p className="text-[11px] text-muted mt-1 leading-relaxed">{vm.desc}</p>
                        {/* Specs */}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-[10px] text-subtle"><Cpu className="w-3 h-3" />{vm.cpu} vCPU</span>
                          <span className="flex items-center gap-1 text-[10px] text-subtle"><MemoryStick className="w-3 h-3" />{vm.ram} Go RAM</span>
                          <span className="flex items-center gap-1 text-[10px] text-subtle"><HardDrive className="w-3 h-3" />{vm.disk} Go</span>
                          <span className="flex items-center gap-1 text-[10px] text-subtle"><Globe className="w-3 h-3" />{vm.ip}</span>
                        </div>
                        {/* Modes de connexion */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {vm.connModes.map((m) => (
                            <span key={m} className={`text-[9px] font-bold px-1.5 py-0.5 ${CONN_COLOR[m]}`}>{m.toUpperCase()}</span>
                          ))}
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => toggleVM(vm.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold transition-colors ${
                            st === "running"
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : st === "starting"
                              ? "bg-gold/10 text-gold-dark cursor-wait"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                          disabled={st === "starting"}>
                          {st === "running" ? <><Square className="w-3 h-3" /> Arrêter</> :
                           st === "starting" ? <><RefreshCw className="w-3 h-3 animate-spin" /> Démarrage</> :
                           <><Play className="w-3 h-3" /> Démarrer</>}
                        </button>
                        {st === "running" && (
                          <button
                            onClick={() => { setActiveVM(vm); setActiveMode(vm.connModes[0]); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-cama text-white hover:bg-cama-600 transition-colors">
                            <Monitor className="w-3 h-3" /> Se connecter
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Machines distantes ── */}
          {activeTab === "remote" && (
            <div className="divide-y divide-border">
              {REMOTE_MACHINES.map((rm) => (
                <div key={rm.id} className="p-4 hover:bg-surface transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${rm.status === "up" ? "bg-ink" : "bg-border"}`}>
                      <Server className={`w-5 h-5 ${rm.status === "up" ? "text-white" : "text-subtle"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-ink">{rm.label}</p>
                        {rm.status === "up"
                          ? <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-green-50 text-green-700"><Wifi className="w-2.5 h-2.5" /> Accessible</span>
                          : <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-red-50 text-red-600"><WifiOff className="w-2.5 h-2.5" /> Hors ligne</span>}
                      </div>
                      <p className="text-[11px] text-muted leading-relaxed">{rm.desc}</p>
                      {/* Commande de connexion */}
                      {rm.status === "up" && rm.mode === "ssh" && (
                        <div className="flex items-center gap-2 mt-2 bg-ink px-3 py-1.5 w-fit">
                          <code className="text-[10px] text-green-400 font-mono">{`ssh etudiant@${rm.host} -p ${rm.port}`}</code>
                          <button onClick={() => copyText(`ssh etudiant@${rm.host} -p ${rm.port}`, rm.id)}
                            className="text-white/50 hover:text-white transition-colors flex-shrink-0">
                            {copiedId === rm.id ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      )}
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 ${CONN_COLOR[rm.mode]}`}>{rm.mode.toUpperCase()}</span>
                  </div>
                </div>
              ))}
              {/* Avertissement */}
              <div className="flex items-start gap-2.5 p-4 bg-gold/5">
                <AlertTriangle className="w-4 h-4 text-gold-dark flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted leading-relaxed">
                  Connexion aux équipements réseaux autorisée uniquement pendant les créneaux TP encadrés.
                  Toute intrusion non autorisée est journalisée et transmise au jury d&apos;intégrité académique.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ══ SIDEBAR DROITE STICKY ══ */}
        <aside className="lg:sticky lg:top-12 lg:h-[calc(100vh-48px)] lg:overflow-y-auto divide-y divide-border">

          {/* Panneau connexion VNC/SSH/RDP */}
          <div className="bg-white">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-ink">
              <Terminal className="w-4 h-4 text-green-400" />
              <p className="text-xs font-bold text-white">Connexion rapide</p>
            </div>

            {activeVM ? (
              <div className="p-4">
                <p className="text-xs font-bold text-ink mb-1">{activeVM.name}</p>
                <p className="text-[10px] text-muted mb-3 flex items-center gap-1"><Globe className="w-3 h-3" /> {activeVM.ip}</p>
                {/* Sélecteur de mode */}
                <div className="flex gap-px mb-3 border border-border overflow-hidden">
                  {activeVM.connModes.map((m) => (
                    <button key={m} onClick={() => setActiveMode(m)}
                      className={`flex-1 py-1.5 text-[10px] font-bold transition-colors ${activeMode === m ? "bg-cama text-white" : "bg-white text-muted hover:text-ink"}`}>
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Commande selon mode */}
                {activeMode === "ssh" && (
                  <div>
                    <p className="text-[9px] text-subtle uppercase tracking-widest mb-1.5">Commande SSH</p>
                    <div className="flex items-center gap-2 bg-ink px-3 py-2">
                      <code className="text-[10px] text-green-400 font-mono flex-1 break-all">{`ssh etudiant@${activeVM.ip}`}</code>
                      <button onClick={() => copyText(`ssh etudiant@${activeVM.ip}`, "cmd-ssh")}
                        className="text-white/50 hover:text-white transition-colors flex-shrink-0">
                        {copiedId === "cmd-ssh" ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[9px] text-subtle mt-1.5">Mot de passe : <code className="font-mono">etudiant123</code> (modifiable)</p>
                  </div>
                )}
                {activeMode === "vnc" && (
                  <div>
                    <p className="text-[9px] text-subtle uppercase tracking-widest mb-1.5">Adresse VNC</p>
                    <div className="flex items-center gap-2 bg-ink px-3 py-2">
                      <code className="text-[10px] text-green-400 font-mono flex-1">{`${activeVM.ip}:5900`}</code>
                      <button onClick={() => copyText(`${activeVM.ip}:5900`, "cmd-vnc")}
                        className="text-white/50 hover:text-white transition-colors flex-shrink-0">
                        {copiedId === "cmd-vnc" ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button className="w-full flex items-center justify-center gap-1.5 mt-2 py-2 bg-cama text-white text-xs font-bold hover:bg-cama-600 transition-colors">
                      <Monitor className="w-3.5 h-3.5" /> Ouvrir dans le navigateur
                    </button>
                  </div>
                )}
                {activeMode === "rdp" && (
                  <div>
                    <p className="text-[9px] text-subtle uppercase tracking-widest mb-1.5">Adresse RDP</p>
                    <div className="flex items-center gap-2 bg-ink px-3 py-2">
                      <code className="text-[10px] text-green-400 font-mono flex-1">{`${activeVM.ip}:3389`}</code>
                      <button onClick={() => copyText(`${activeVM.ip}:3389`, "cmd-rdp")}
                        className="text-white/50 hover:text-white transition-colors flex-shrink-0">
                        {copiedId === "cmd-rdp" ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <a href={`rdp://full%20address=s:${activeVM.ip}:3389`}
                      className="w-full flex items-center justify-center gap-1.5 mt-2 py-2 bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
                      <Download className="w-3.5 h-3.5" /> Télécharger le fichier .rdp
                    </a>
                  </div>
                )}

                <button onClick={() => setActiveVM(null)} className="w-full mt-3 text-[10px] text-subtle hover:text-ink transition-colors text-center">
                  ← Fermer
                </button>
              </div>
            ) : (
              <div className="p-4 text-center">
                <Monitor className="w-8 h-8 text-border mx-auto mb-2" />
                <p className="text-xs text-muted">Démarrez une VM et cliquez sur<br /><strong>Se connecter</strong> pour voir les options.</p>
              </div>
            )}
          </div>

          {/* Crédits TP */}
          <div className="bg-white px-4 py-3">
            <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-3 flex items-center gap-1"><Clock className="w-3 h-3" /> Mes crédits TP</p>
            <div className="space-y-2">
              {[
                { label: "Heures consommées", value: "12h / 40h", pct: 30 },
                { label: "Sessions actives",   value: "1 / 2 max", pct: 50 },
                { label: "Stockage utilisé",   value: "8 Go / 20 Go", pct: 40 },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-muted font-semibold">{r.label}</span>
                    <span className="text-ink font-bold">{r.value}</span>
                  </div>
                  <div className="h-1 bg-surface">
                    <div className="h-full bg-cama transition-all" style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sécurité */}
          <div className="bg-white px-4 py-3">
            <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2 flex items-center gap-1"><Lock className="w-3 h-3" /> Sécurité &amp; Accès</p>
            <div className="space-y-1.5">
              {[
                { icon: Lock, text: "Tunnel VPN JFN activé", ok: true },
                { icon: ShieldCheck, text: "Clé SSH enregistrée", ok: true },
                { icon: Zap, text: "Authentification 2FA", ok: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <s.icon className={`w-3.5 h-3.5 flex-shrink-0 ${s.ok ? "text-green-600" : "text-subtle"}`} />
                  <p className={`text-[10px] font-semibold ${s.ok ? "text-ink" : "text-subtle"}`}>{s.text}</p>
                  {!s.ok && <span className="text-[9px] font-bold text-gold-dark ml-auto">Activer</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Ressources */}
          <div className="bg-white px-4 py-3">
            <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Ressources TP</p>
            <div className="space-y-0.5">
              {[
                { label: "Guide de connexion VNC/SSH", href: "/guide" },
                { label: "Énoncés & Sujets TP S4",     href: "#" },
                { label: "Politique d'utilisation VMs", href: "#" },
                { label: "Support technique",           href: "#" },
              ].map((l) => (
                <Link key={l.label} href={l.href}
                  className="flex items-center gap-1.5 py-1.5 text-[11px] text-muted hover:text-cama transition-colors group">
                  <ChevronRight className="w-3 h-3 flex-shrink-0 group-hover:text-cama" /> {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Sessions actives */}
          <div className="bg-white px-4 py-3">
            <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2 flex items-center gap-1"><Activity className="w-3 h-3" /> Sessions actives</p>
            <div className="space-y-2">
              {Object.entries(vmStates).filter(([, s]) => s === "running").map(([id]) => {
                const vm = VMS.find((v) => v.id === id)!;
                return (
                  <div key={id} className="flex items-center gap-2.5 border border-green-200 bg-green-50/50 p-2">
                    <span className="text-base flex-shrink-0">{vm.osIcon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-ink truncate">{vm.name}</p>
                      <p className="text-[9px] text-green-700 font-mono">{vm.ip} · connectée</p>
                    </div>
                    <button onClick={() => toggleVM(id)} title="Arrêter"
                      className="p-1 text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                      <Square className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
              {Object.values(vmStates).every((s) => s !== "running") && (
                <p className="text-[10px] text-subtle text-center py-1">Aucune session active.</p>
              )}
            </div>
          </div>

          {/* Prochaines séances TP */}
          <div className="bg-white px-4 py-3">
            <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2 flex items-center gap-1"><Clock className="w-3 h-3" /> Prochaines séances TP</p>
            <div className="space-y-2">
              {[
                { date: "Jeu. 12 juin · 8h",  label: "TP Réseaux — OSPF",   room: "Lab B2 + distanciel", color: "border-cama" },
                { date: "Ven. 13 juin · 14h", label: "TP Web — API REST",   room: "100% distanciel",     color: "border-gold" },
                { date: "Mar. 17 juin · 10h", label: "TP AD & PowerShell",  room: "Lab B1 + distanciel", color: "border-purple-400" },
              ].map((s, i) => (
                <div key={i} className={`border-l-2 ${s.color} pl-2.5`}>
                  <p className="text-[9px] text-subtle font-bold">{s.date}</p>
                  <p className="text-[11px] font-bold text-ink leading-tight">{s.label}</p>
                  <p className="text-[9px] text-muted">{s.room}</p>
                </div>
              ))}
            </div>
            <Link href="/calendrier" className="text-[9px] font-bold text-cama hover:underline mt-2 inline-flex items-center gap-0.5">
              Calendrier complet <ChevronRight className="w-2.5 h-2.5" />
            </Link>
          </div>

          {/* Journal d'activité */}
          <div className="bg-ink px-4 py-3">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1"><Terminal className="w-3 h-3" /> Journal d&apos;activité</p>
            <div className="font-mono text-[9px] space-y-1 leading-relaxed">
              <p className="text-green-400">[13:02] vm-linux-1 démarrée (snapshot TP4)</p>
              <p className="text-white/60">[13:03] Connexion SSH depuis 154.72.x.x</p>
              <p className="text-white/60">[13:18] Sauvegarde auto → NAS /rendus/INF301</p>
              <p className="text-gold">[13:40] Quota stockage à 40 % — pensez à nettoyer</p>
              <p className="text-white/60">[14:05] vm-ubuntu-web : VS Code Server ouvert</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
