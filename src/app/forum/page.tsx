"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, MessagesSquare, Hash, Users, Send, Heart, RefreshCw, Megaphone,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/dashboard/PageShell";
import {
  fetchForum, postForum, fetchCommunity, postCommunity, likeCommunity,
  type DBForumMessage, type DBCommunityMessage,
} from "@/lib/chat";

const BASE_CHANNELS = [
  { id: "general",  label: "Général",  desc: "Discussions ouvertes de la communauté JFN" },
  { id: "entraide", label: "Entraide", desc: "Posez vos questions, aidez les autres" },
  { id: "annonces", label: "Annonces", desc: "Infos importantes des étudiants" },
];

const roleChip = (role: string) => {
  switch (role) {
    case "admin":      return { label: "Administration", cls: "bg-cama/10 text-cama" };
    case "enseignant": return { label: "Enseignant",     cls: "bg-gold/10 text-gold-dark" };
    case "jury":       return { label: "Jury",           cls: "bg-cama/10 text-cama" };
    default:            return { label: "Étudiant",        cls: "bg-surface text-muted" };
  }
};

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function ForumPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"forum" | "communaute">("forum");

  // Canaux (ajoute la filière de l'étudiant si dispo)
  const channels = useMemo(() => {
    const list = [...BASE_CHANNELS];
    const slug = user?.dossier?.parcoursSlug;
    const title = user?.dossier?.parcoursTitle;
    if (slug && title) list.push({ id: `filiere-${slug}`, label: title, desc: `Salon de la filière ${title}` });
    return list;
  }, [user]);

  const [channel, setChannel] = useState("general");
  const [msgs, setMsgs] = useState<DBForumMessage[]>([]);
  const [community, setCommunity] = useState<DBCommunityMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!loading && !user) router.replace("/auth/login"); }, [loading, user, router]);

  const loadForum = async (ch: string) => {
    setLoadingList(true);
    setMsgs(await fetchForum(ch));
    setLoadingList(false);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  };
  const loadCommunity = async () => {
    setLoadingList(true);
    setCommunity(await fetchCommunity());
    setLoadingList(false);
  };

  useEffect(() => { if (user && tab === "forum") loadForum(channel); }, [user, tab, channel]);
  useEffect(() => { if (user && tab === "communaute") loadCommunity(); }, [user, tab]);

  const send = async () => {
    if (!user || !body.trim() || sending) return;
    setSending(true);
    const text = body.trim();
    setBody("");
    if (tab === "forum") {
      const res = await postForum({ channel, user_id: user.id, author_name: user.name, role: user.role, body: text });
      if (res) { setMsgs((m) => [...m, res]); setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 60); }
    } else {
      const res = await postCommunity({ user_id: user.id, author_name: user.name, avatar: user.avatarColor, body: text });
      if (res) setCommunity((c) => [...c, res]);
    }
    setSending(false);
  };

  const onLike = async (m: DBCommunityMessage) => {
    setCommunity((c) => c.map((x) => x.id === m.id ? { ...x, likes: x.likes + 1 } : x));
    await likeCommunity(m.id, m.likes);
  };

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-8 h-8 border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  const activeChannel = channels.find((c) => c.id === channel);

  return (
    <PageShell
      title="Forum & Communauté"
      subtitle="Échangez avec les autres étudiants, l'entraide et les annonces."
      icon={MessagesSquare}
      breadcrumb="Forum"
      maxWidth="max-w-[1200px]"
      actions={
        <button onClick={() => tab === "forum" ? loadForum(channel) : loadCommunity()}
          className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest border border-border px-3 py-2 text-muted hover:text-cama hover:border-cama/40 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Rafraîchir
        </button>
      }
    >
      {/* Onglets */}
      <div className="inline-flex border border-border mb-4">
        {([["forum", "Forum", Hash], ["communaute", "Communauté", Users]] as const).map(([id, label, Ic]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${
              tab === id ? "bg-cama text-white" : "bg-white text-muted hover:text-ink"} ${id === "communaute" ? "border-l border-border" : ""}`}>
            <Ic className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === "forum" ? (
        <div className="grid lg:grid-cols-[240px_1fr] gap-4 items-start">
          {/* Canaux */}
          <div className="bg-white border border-border">
            <p className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted border-b border-border">Salons</p>
            <div className="divide-y divide-border">
              {channels.map((c) => (
                <button key={c.id} onClick={() => setChannel(c.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-surface transition-colors ${channel === c.id ? "bg-cama-50 border-l-2 border-cama" : ""}`}>
                  <p className={`text-[12px] font-bold flex items-center gap-1.5 ${channel === c.id ? "text-cama" : "text-ink"}`}>
                    <Hash className="w-3.5 h-3.5" /> {c.label}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5 leading-tight">{c.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Fil de discussion */}
          <div className="bg-white border border-border flex flex-col" style={{ minHeight: "60vh" }}>
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-black text-ink flex items-center gap-1.5"><Hash className="w-4 h-4 text-cama" />{activeChannel?.label}</p>
              <p className="text-[10px] text-muted">{activeChannel?.desc}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[55vh]">
              {loadingList ? (
                <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-cama mx-auto" /></div>
              ) : msgs.length === 0 ? (
                <div className="py-10 text-center text-[11px] text-muted">
                  <MessagesSquare className="w-6 h-6 mx-auto mb-2 text-subtle" />
                  Aucun message. Lancez la discussion !
                </div>
              ) : msgs.map((m) => {
                const mine = m.user_id === user.id;
                const chip = roleChip(m.role);
                return (
                  <div key={m.id} className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ background: "#4F46E5" }}>
                      {initials(m.author_name)}
                    </div>
                    <div className={`max-w-[75%] ${mine ? "text-right" : ""}`}>
                      <p className="text-[10px] text-muted mb-0.5">
                        <span className="font-bold text-ink">{m.author_name}</span>
                        <span className={`ml-1.5 px-1.5 py-0.5 text-[8px] font-black uppercase ${chip.cls}`}>{chip.label}</span>
                      </p>
                      <div className={`inline-block px-3 py-2 text-[12px] leading-snug ${mine ? "bg-cama text-white" : "bg-surface text-ink border border-border"}`}>
                        {m.body}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            {/* Composer */}
            <div className="border-t border-border p-3 flex items-end gap-2">
              <textarea value={body} onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1} placeholder={`Écrire dans ${activeChannel?.label}…`}
                className="flex-1 resize-none border border-border bg-surface text-[13px] px-3 py-2 focus:outline-none focus:border-cama" />
              <button onClick={send} disabled={!body.trim() || sending}
                className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest bg-cama text-white px-4 py-2.5 hover:bg-cama-700 transition-colors disabled:opacity-50">
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Envoyer
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Mur communautaire */
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-border p-3 mb-4 flex items-end gap-2">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2}
              placeholder="Partagez quelque chose avec la communauté…"
              className="flex-1 resize-none border border-border bg-surface text-[13px] px-3 py-2 focus:outline-none focus:border-cama" />
            <button onClick={send} disabled={!body.trim() || sending}
              className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest bg-cama text-white px-4 py-2.5 hover:bg-cama-700 transition-colors disabled:opacity-50">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Megaphone className="w-3.5 h-3.5" />} Publier
            </button>
          </div>
          {loadingList ? (
            <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-cama mx-auto" /></div>
          ) : community.length === 0 ? (
            <div className="py-10 text-center text-[11px] text-muted">Aucune publication. Soyez le premier !</div>
          ) : (
            <div className="space-y-3">
              {[...community].reverse().map((m) => (
                <div key={m.id} className="bg-white border border-border p-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center text-white text-[10px] font-bold" style={{ background: m.avatar || "#7C3AED" }}>
                      {initials(m.author_name)}
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-ink leading-tight">{m.author_name}</p>
                      <p className="text-[10px] text-muted">{new Date(m.created_at).toLocaleString("fr-FR")}</p>
                    </div>
                  </div>
                  <p className="text-[13px] text-ink leading-relaxed whitespace-pre-wrap">{m.body}</p>
                  <button onClick={() => onLike(m)} className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-muted hover:text-cama transition-colors">
                    <Heart className="w-3.5 h-3.5" /> {m.likes}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
