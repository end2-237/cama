"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Mail, Search, X, Send, PenSquare, Loader2, ShieldCheck,
  GraduationCap, UserCog, MessageSquare, Inbox,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/dashboard/PageShell";
import type { DBUser } from "@/lib/supabase";
import { fetchUsers, fetchInscriptions, type InscriptionWithUser } from "@/lib/admin";
import { fetchProgram } from "@/lib/program";
import type { DBProgramCourse } from "@/lib/supabase";
import {
  sendMessage, fetchInbox, fetchSent, fetchThread, markRead, countUnread,
  userName, levelMeta, type DBMessage,
} from "@/lib/governance";

/* ── Helpers ── */
function relTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "À l'instant";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  if (s < 604800) return `${Math.floor(s / 86400)} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
function fullTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}
function isAdminUser(u: Pick<DBUser, "role" | "admin_level">): boolean {
  return u.role === "admin" || !!u.admin_level;
}
/** Chip de rôle / niveau administratif. */
function roleChip(u: DBUser): { label: string; cls: string } {
  if (u.admin_level) {
    const m = levelMeta(u.admin_level);
    return { label: m?.label ?? u.admin_level, cls: "bg-cama/10 text-cama" };
  }
  switch (u.role) {
    case "admin":      return { label: "Administration", cls: "bg-cama/10 text-cama" };
    case "enseignant": return { label: "Enseignant",     cls: "bg-gold/10 text-gold-dark" };
    case "jury":       return { label: "Jury",           cls: "bg-purple-50 text-purple-600" };
    default:           return { label: "Étudiant",       cls: "bg-green-50 text-green-600" };
  }
}

interface Conversation {
  otherId: string;
  other: DBUser | undefined;
  last: DBMessage;
  unread: number;
}

export default function MessageriePage() {
  const { user, loading } = useAuth();

  const [users, setUsers]     = useState<DBUser[]>([]);
  const [inbox, setInbox]     = useState<DBMessage[]>([]);
  const [sent, setSent]       = useState<DBMessage[]>([]);
  const [unread, setUnread]   = useState(0);
  const [fetching, setFetching] = useState(true);

  // Relations pédagogiques (pour filtrer les destinataires)
  const [program, setProgram] = useState<DBProgramCourse[]>([]);
  const [inscr, setInscr]     = useState<InscriptionWithUser[]>([]);

  // Fil sélectionné
  const [activeId, setActiveId]   = useState<string | null>(null);
  const [thread, setThread]       = useState<DBMessage[]>([]);
  const [threadSubject, setThreadSubject] = useState<string>("");
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft]         = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [sending, setSending]     = useState(false);

  // Modal destinataires
  const [picker, setPicker] = useState(false);
  const [pickQ, setPickQ]   = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const usersById = useMemo(() => {
    const m = new Map<string, DBUser>();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  /* ── Chargement initial ── */
  const reloadMessages = async (uid: string) => {
    const [ib, st, un] = await Promise.all([fetchInbox(uid), fetchSent(uid), countUnread(uid)]);
    setInbox(ib); setSent(st); setUnread(un);
  };

  useEffect(() => {
    if (loading || !user) return;
    const uid = user.id;
    let cancelled = false;
    (async () => {
      setFetching(true);
      const [us, pr, ins] = await Promise.all([fetchUsers(), fetchProgram(), fetchInscriptions()]);
      if (cancelled) return;
      setUsers(us); setProgram(pr); setInscr(ins);
      await reloadMessages(uid);
      if (cancelled) return;
      setFetching(false);
    })();
    // Rafraîchit l'inbox périodiquement (simple polling)
    const t = setInterval(() => { if (!cancelled) reloadMessages(uid); }, 20000);
    return () => { cancelled = true; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  /* ── Conversations (regroupées par autre utilisateur) ── */
  const conversations = useMemo<Conversation[]>(() => {
    if (!user) return [];
    const byOther = new Map<string, DBMessage[]>();
    [...inbox, ...sent].forEach((m) => {
      const otherId = m.from_user_id === user.id ? m.to_user_id : m.from_user_id;
      const arr = byOther.get(otherId) ?? [];
      arr.push(m);
      byOther.set(otherId, arr);
    });
    const convs: Conversation[] = [];
    byOther.forEach((msgs, otherId) => {
      msgs.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
      const last = msgs[msgs.length - 1];
      const unreadN = msgs.filter((m) => m.to_user_id === user.id && !m.read_at).length;
      convs.push({ otherId, other: usersById.get(otherId), last, unread: unreadN });
    });
    convs.sort((a, b) => +new Date(b.last.created_at) - +new Date(a.last.created_at));
    return convs;
  }, [inbox, sent, user, usersById]);

  /* ── Destinataires autorisés selon le rôle ── */
  const recipients = useMemo<DBUser[]>(() => {
    if (!user) return [];
    const me = usersById.get(user.id);
    const others = users.filter((u) => u.id !== user.id);

    // Administration / coordination : peut écrire à tout le monde
    if (me && isAdminUser(me)) return others;

    const admins = others.filter(isAdminUser);

    if (user.role === "enseignant") {
      // Filières enseignées → étudiants inscrits dans ces filières
      const mySlugs = new Set(
        program.filter((c) => c.teacher_id === user.id).map((c) => c.parcours_slug),
      );
      const myStudentIds = new Set(
        inscr.filter((i) => mySlugs.has(i.parcours_slug)).map((i) => i.user_id),
      );
      const students = others.filter((u) => u.role === "etudiant" && myStudentIds.has(u.id));
      return dedupe([...admins, ...students]);
    }

    if (user.role === "etudiant") {
      // Enseignants des cours de ma filière
      const slug = user.dossier?.parcoursSlug ?? null;
      const teacherIds = new Set(
        program
          .filter((c) => slug && c.parcours_slug === slug && c.teacher_id)
          .map((c) => c.teacher_id as string),
      );
      const teachers = others.filter((u) => u.role === "enseignant" && teacherIds.has(u.id));
      return dedupe([...teachers, ...admins]);
    }

    // Jury ou autre : administration uniquement
    return admins;
  }, [user, users, usersById, program, inscr]);

  const filteredRecipients = useMemo(() => {
    const s = pickQ.trim().toLowerCase();
    if (!s) return recipients;
    return recipients.filter((u) =>
      `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(s));
  }, [recipients, pickQ]);

  const groupedRecipients = useMemo(() => {
    const groups: { key: string; label: string; users: DBUser[] }[] = [
      { key: "admin",   label: "Administration", users: [] },
      { key: "teacher", label: "Enseignants",    users: [] },
      { key: "student", label: "Étudiants",      users: [] },
    ];
    filteredRecipients.forEach((u) => {
      if (isAdminUser(u)) groups[0].users.push(u);
      else if (u.role === "enseignant") groups[1].users.push(u);
      else groups[2].users.push(u);
    });
    return groups.filter((g) => g.users.length > 0);
  }, [filteredRecipients]);

  /* ── Ouverture d'un fil ── */
  const openThread = async (otherId: string) => {
    if (!user) return;
    setActiveId(otherId);
    setPicker(false);
    setDraft(""); setNewSubject("");
    setLoadingThread(true);
    const msgs = await fetchThread(user.id, otherId);
    setThread(msgs);
    const subj = msgs.find((m) => m.subject)?.subject ?? "";
    setThreadSubject(subj);
    setLoadingThread(false);
    // Marque comme lus les messages entrants non lus
    const unreadMsgs = msgs.filter((m) => m.to_user_id === user.id && !m.read_at);
    if (unreadMsgs.length > 0) {
      await Promise.all(unreadMsgs.map((m) => markRead(m.id)));
      await reloadMessages(user.id);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  /* ── Envoi ── */
  const onSend = async () => {
    if (!user || !activeId || !draft.trim() || sending) return;
    setSending(true);
    const isNew = thread.length === 0;
    await sendMessage(user.id, activeId, draft, isNew ? newSubject : undefined);
    setDraft(""); setNewSubject("");
    const msgs = await fetchThread(user.id, activeId);
    setThread(msgs);
    setThreadSubject(msgs.find((m) => m.subject)?.subject ?? "");
    await reloadMessages(user.id);
    setSending(false);
  };

  const activeUser = activeId ? usersById.get(activeId) : undefined;

  /* ── Rendu ── */
  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  return (
    <PageShell
      title="Messagerie"
      subtitle="Échangez avec l'administration, vos enseignants et vos étudiants."
      icon={Mail}
      breadcrumb="Messagerie"
      context={unread > 0 ? `${unread} non lu${unread > 1 ? "s" : ""}` : "Boîte à jour"}
      maxWidth="max-w-[1200px]"
      actions={
        <button onClick={() => { setPicker(true); setPickQ(""); }}
          className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest bg-cama text-white px-4 py-2.5 hover:bg-cama-700 transition-colors">
          <PenSquare className="w-3.5 h-3.5" /> Nouveau message
        </button>
      }
      stats={[
        { label: "Conversations", value: conversations.length, accent: "cama" },
        { label: "Non lus", value: unread, accent: unread ? "gold" : "green" },
        { label: "Reçus", value: inbox.length, accent: "ink" },
        { label: "Envoyés", value: sent.length, accent: "ink" },
      ]}
    >
      {/* Corps 2-panneaux */}
      <main className="flex-1">
        <div className="bg-white border border-border rounded-xl overflow-hidden flex h-[calc(100vh-104px)]">
          {/* ── Panneau gauche : conversations ── */}
          <aside className="w-[320px] flex-shrink-0 border-r border-border flex flex-col">
            <div className="p-3 border-b border-border">
              <button onClick={() => { setPicker(true); setPickQ(""); }}
                className="w-full flex items-center justify-center gap-2 bg-cama text-white text-xs font-bold rounded-lg py-2 hover:bg-cama-700 transition-colors">
                <PenSquare className="w-4 h-4" /> Nouveau message
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {fetching ? (
                <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin text-cama mx-auto" /></div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted">
                  <Inbox className="w-6 h-6 mx-auto mb-2 text-subtle" />
                  Aucune conversation.
                </div>
              ) : (
                conversations.map((c) => {
                  const chip = c.other ? roleChip(c.other) : null;
                  const mine = c.last.from_user_id === user.id;
                  const active = c.otherId === activeId;
                  return (
                    <button key={c.otherId} onClick={() => openThread(c.otherId)}
                      className={`w-full text-left px-3 py-2.5 border-b border-border/70 flex gap-2.5 transition-colors ${
                        active ? "bg-cama/5" : "hover:bg-surface"}`}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                        style={{ background: c.other?.avatar_color || "#6366f1" }}>
                        {c.other ? `${c.other.first_name[0] ?? "?"}${c.other.last_name[0] ?? ""}` : "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-ink truncate flex-1">
                            {c.other ? userName(c.other) : "Utilisateur inconnu"}
                          </p>
                          <span className="text-[10px] text-subtle flex-shrink-0">{relTime(c.last.created_at)}</span>
                          {c.unread > 0 && <span className="w-2 h-2 rounded-full bg-cama flex-shrink-0" />}
                        </div>
                        {chip && (
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${chip.cls}`}>
                            {chip.label}
                          </span>
                        )}
                        <p className={`text-[11px] truncate mt-0.5 ${c.unread > 0 ? "text-ink font-medium" : "text-muted"}`}>
                          {mine && <span className="text-subtle">Vous : </span>}{c.last.body}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* ── Panneau droit : fil ── */}
          <section className="flex-1 flex flex-col min-w-0">
            {!activeId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <MessageSquare className="w-10 h-10 text-subtle mb-3" />
                <p className="text-sm font-bold text-ink">Sélectionnez une conversation</p>
                <p className="text-xs text-muted mt-1">ou démarrez un nouveau message.</p>
              </div>
            ) : (
              <>
                {/* En-tête du fil */}
                <div className="px-4 py-2.5 border-b border-border flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ background: activeUser?.avatar_color || "#6366f1" }}>
                    {activeUser ? `${activeUser.first_name[0] ?? "?"}${activeUser.last_name[0] ?? ""}` : "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink truncate">
                      {activeUser ? userName(activeUser) : "Utilisateur"}
                    </p>
                    {activeUser && (
                      <p className="text-[11px] text-muted truncate">
                        {roleChip(activeUser).label}{activeUser.email && ` · ${activeUser.email}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-surface/40">
                  {loadingThread ? (
                    <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin text-cama mx-auto" /></div>
                  ) : (
                    <>
                      {threadSubject && (
                        <p className="text-center text-[11px] font-bold text-muted mb-2">
                          Objet : {threadSubject}
                        </p>
                      )}
                      {thread.length === 0 ? (
                        <p className="text-center text-xs text-muted py-8">
                          Démarrez la conversation ci-dessous.
                        </p>
                      ) : (
                        thread.map((m) => {
                          const mine = m.from_user_id === user.id;
                          return (
                            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                                mine ? "bg-cama text-white rounded-br-sm"
                                     : "bg-white border border-border text-ink rounded-bl-sm"}`}>
                                <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                                <p className={`text-[9px] mt-1 ${mine ? "text-white/60" : "text-subtle"}`}>
                                  {fullTime(m.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={bottomRef} />
                    </>
                  )}
                </div>

                {/* Composer */}
                <div className="border-t border-border p-3 bg-white">
                  {thread.length === 0 && (
                    <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="Objet (facultatif)"
                      className="w-full mb-2 border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-cama" />
                  )}
                  <div className="flex items-end gap-2">
                    <textarea value={draft} onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSend(); } }}
                      rows={2} placeholder="Écrivez votre message…"
                      className="flex-1 resize-none border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-cama" />
                    <button onClick={onSend} disabled={!draft.trim() || sending}
                      className="flex items-center gap-1.5 bg-cama text-white text-xs font-bold rounded-lg px-4 py-2.5 hover:bg-cama-700 disabled:opacity-40 transition-colors">
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Envoyer
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {/* ── Modal destinataires ── */}
      {picker && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
          onClick={() => setPicker(false)}>
          <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-bold text-ink flex items-center gap-1.5">
                <PenSquare className="w-4 h-4 text-cama" /> Nouveau message
              </span>
              <button onClick={() => setPicker(false)} className="text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 focus-within:border-cama">
                <Search className="w-3.5 h-3.5 text-subtle" />
                <input autoFocus value={pickQ} onChange={(e) => setPickQ(e.target.value)}
                  placeholder="Rechercher un destinataire…"
                  className="bg-transparent text-xs outline-none w-full" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {groupedRecipients.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted">Aucun destinataire disponible.</p>
              ) : (
                groupedRecipients.map((g) => (
                  <div key={g.key}>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wide text-subtle flex items-center gap-1.5">
                      {g.key === "admin" ? <ShieldCheck className="w-3 h-3" />
                        : g.key === "teacher" ? <UserCog className="w-3 h-3" />
                        : <GraduationCap className="w-3 h-3" />}
                      {g.label}
                    </p>
                    {g.users.map((u) => {
                      const chip = roleChip(u);
                      return (
                        <button key={u.id} onClick={() => openThread(u.id)}
                          className="w-full text-left px-4 py-2 flex items-center gap-2.5 hover:bg-surface transition-colors">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ background: u.avatar_color || "#6366f1" }}>
                            {`${u.first_name[0] ?? "?"}${u.last_name[0] ?? ""}`}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-ink truncate">{userName(u)}</p>
                            <p className="text-[11px] text-muted truncate">{u.email}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${chip.cls}`}>
                            {chip.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

/* Déduplique une liste d'utilisateurs par id. */
function dedupe(list: DBUser[]): DBUser[] {
  const seen = new Set<string>();
  return list.filter((u) => (seen.has(u.id) ? false : (seen.add(u.id), true)));
}
