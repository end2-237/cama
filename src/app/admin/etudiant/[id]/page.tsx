"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Printer, UserX, GraduationCap, BookOpen,
  Award, ClipboardCheck, Activity, ShieldAlert, FolderOpen,
  CheckCircle2, XCircle, ExternalLink, FileText, X, Paperclip,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type {
  DBUser, DBInscription, DBProgramCourse, DBChapterProgress,
  DBExamAttempt, DBExam,
} from "@/lib/supabase";
import { fetchUsers, fetchInscriptions, setInscriptionStatus } from "@/lib/admin";
import { fetchStudentProgram, fetchProgress, fetchChapters } from "@/lib/program";
import { fetchAttemptsForStudent, fetchDeliberations, fetchExamsForCourses, type DelibWithMeta } from "@/lib/exams";
import { fetchNativeProgress, type DBNativeProgress } from "@/lib/tracking";
import { fetchDocuments, reviewDocument, docKindLabel, type DBStudentDocument } from "@/lib/documents";
import { logAudit } from "@/lib/governance";
import { fetchYears, fetchSemesters, type DBAcademicYear, type DBSemester } from "@/lib/academic";
import {
  buildTranscript, fetchTranscriptsForStudent, DECISION_LABEL,
  type DBTranscript,
} from "@/lib/bulletins";

// ── Libellés & badges ──────────────────────────────────────────
const INSCR_BADGE: Record<DBInscription["status"], { label: string; cls: string }> = {
  en_attente: { label: "En attente",  cls: "bg-gold-light text-gold-dark border-gold/40" },
  validee:    { label: "Validée",     cls: "bg-green-50 text-green-700 border-green-200" },
  rejetee:    { label: "Rejetée",     cls: "bg-red-50 text-red-600 border-red-200" },
};
const MODE_LABEL: Record<string, string> = {
  presentiel: "Présentiel", hybride: "Hybride", online: "En ligne",
};
const DELIB_BADGE: Record<string, { label: string; cls: string }> = {
  en_delib: { label: "En délibération", cls: "bg-gold-light text-gold-dark" },
  valide:   { label: "Validée",         cls: "bg-green-50 text-green-700" },
  rejete:   { label: "Rejetée",         cls: "bg-red-50 text-red-600" },
};
const DOC_BADGE: Record<string, { label: string; cls: string }> = {
  depose: { label: "Déposé", cls: "bg-gold-light text-gold-dark border-gold/40" },
  valide: { label: "Validé", cls: "bg-green-50 text-green-700 border-green-200" },
  refuse: { label: "Refusé", cls: "bg-red-50 text-red-600 border-red-200" },
};
const ATTEMPT_BADGE: Record<string, { label: string; cls: string }> = {
  encours: { label: "En cours", cls: "bg-cama-50 text-cama-700" },
  soumis:  { label: "Soumis",   cls: "bg-gold-light text-gold-dark" },
  corrige: { label: "Corrigé",  cls: "bg-green-50 text-green-700" },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
function note20(a: DBExamAttempt): number | null {
  if (a.score == null || !a.score_max) return null;
  return Math.round((a.score / a.score_max) * 20 * 10) / 10;
}
function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?|$)/i.test(url);
}

// ── Petits composants de mise en page « document » ─────────────
function Section({ icon: Icon, title, children }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; children: React.ReactNode;
}) {
  return (
    <section className="mt-8 print:mt-6">
      <div className="flex items-center gap-2 border-b-2 border-cama/20 pb-2 mb-4">
        <Icon className="w-4 h-4 text-cama" />
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-1.5 border-b border-border/60">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-subtle">{label}</dt>
      <dd className="text-sm text-ink mt-0.5">{value || "—"}</dd>
    </div>
  );
}

interface CourseRow extends DBProgramCourse { progression: number }

export default function FicheEtudiantPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const studentId = params.id;

  const [fetching, setFetching] = useState(true);
  const [student, setStudent]   = useState<DBUser | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [inscr, setInscr]       = useState<DBInscription | null>(null);
  const [courses, setCourses]   = useState<CourseRow[]>([]);
  const [delibs, setDelibs]     = useState<DelibWithMeta[]>([]);
  const [attempts, setAttempts] = useState<DBExamAttempt[]>([]);
  const [exams, setExams]       = useState<DBExam[]>([]);
  const [native, setNative]     = useState<DBNativeProgress[]>([]);
  const [progress, setProgress] = useState<DBChapterProgress[]>([]);
  const [documents, setDocuments] = useState<DBStudentDocument[]>([]);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [showDossier, setShowDossier] = useState(false);
  const [candAction, setCandAction] = useState(false);

  // Bulletins
  const [years, setYears]           = useState<DBAcademicYear[]>([]);
  const [semesters, setSemesters]   = useState<DBSemester[]>([]);
  const [transcripts, setTranscripts] = useState<DBTranscript[]>([]);
  const [selYear, setSelYear]       = useState<string>("");
  const [selSem, setSelSem]         = useState<number>(1);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState<string | null>(null);

  // Garde admin
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (loading || !user || user.role !== "admin" || !studentId) return;
    let alive = true;
    (async () => {
      setFetching(true);
      const [users, inscriptions] = await Promise.all([fetchUsers(), fetchInscriptions()]);
      const u = users.find((x) => x.id === studentId) ?? null;
      if (!alive) return;
      if (!u) { setNotFound(true); setFetching(false); return; }
      setStudent(u);

      const ins = inscriptions.find((i) => i.user_id === studentId) ?? null;
      setInscr(ins);

      const [prog, delibsAll, atts, nat, docs, yrs, sems, trs] = await Promise.all([
        fetchProgress(studentId),
        fetchDeliberations(),
        fetchAttemptsForStudent(studentId),
        fetchNativeProgress(studentId),
        fetchDocuments(studentId),
        fetchYears(),
        fetchSemesters(),
        fetchTranscriptsForStudent(studentId),
      ]);
      if (!alive) return;
      setProgress(prog);
      setDocuments(docs);
      setYears(yrs);
      setSemesters(sems);
      setTranscripts(trs);
      if (yrs.length) setSelYear((y) => y || (yrs.find((x) => x.is_current)?.label ?? yrs[0].label));
      setDelibs(delibsAll.filter((d) => d.student_id === studentId));
      setAttempts(atts);
      setNative(nat);

      // Parcours académique + progression par matière
      if (ins) {
        const cs = await fetchStudentProgram(ins.parcours_slug, ins.level);
        const doneIds = new Set(prog.map((p) => p.chapter_id));
        const rows: CourseRow[] = await Promise.all(cs.map(async (c) => {
          const chapters = await fetchChapters(c.id);
          const done = chapters.filter((ch) => doneIds.has(ch.id)).length;
          const progression = chapters.length ? Math.round((done / chapters.length) * 100) : 0;
          return { ...c, progression };
        }));
        if (!alive) return;
        setCourses(rows);
        const ex = await fetchExamsForCourses(cs.map((c) => c.id));
        if (!alive) return;
        setExams(ex);
      }
      setFetching(false);
    })();
    return () => { alive = false; };
  }, [loading, user, studentId]);

  const handleReview = async (docId: string, status: "valide" | "refuse") => {
    if (!user || reviewing) return;
    let note: string | null = null;
    if (status === "refuse") {
      note = window.prompt("Motif du refus (note transmise à l'étudiant) :");
      if (note === null) return; // annulé
    }
    setReviewing(docId);
    await reviewDocument(docId, status, note, user.id);
    const doc = documents.find((d) => d.id === docId);
    await logAudit({
      actorId: user.id,
      actorName: user.name,
      action: "document.review",
      entity: `document:${docId}`,
      detail: `Pièce « ${doc ? docKindLabel(doc.kind) : docId} » de ${student?.first_name ?? ""} ${student?.last_name ?? ""} : ${status === "valide" ? "validée" : "refusée"}${note ? ` — ${note}` : ""}`,
      severity: status === "refuse" ? "warn" : "info",
    });
    setDocuments((ds) => ds.map((d) => d.id === docId
      ? { ...d, status, note_admin: note, reviewed_by: user.id, reviewed_at: new Date().toISOString() }
      : d));
    setReviewing(null);
  };

  const handleValidateCandidature = async () => {
    if (!user || !inscr || candAction) return;
    if (!window.confirm("Valider la candidature de cet étudiant ? L'inscription passera à « Validée » et les pièces déposées seront validées.")) return;
    setCandAction(true);
    await setInscriptionStatus(inscr.id, "validee");
    const toValidate = documents.filter((d) => d.status === "depose");
    await Promise.all(toValidate.map((d) => reviewDocument(d.id, "valide", null, user.id)));
    await logAudit({
      actorId: user.id,
      actorName: user.name,
      action: "candidature.valider",
      entity: `inscription:${inscr.id}`,
      detail: `Candidature de ${student?.first_name ?? ""} ${student?.last_name ?? ""} (${inscr.matricule}) validée — ${toValidate.length} pièce(s) validée(s).`,
      severity: "warn",
    });
    setInscr((p) => (p ? { ...p, status: "validee" } : p));
    setDocuments((ds) => ds.map((d) => d.status === "depose"
      ? { ...d, status: "valide", reviewed_by: user.id, reviewed_at: new Date().toISOString() }
      : d));
    setCandAction(false);
  };

  const handleRejectCandidature = async () => {
    if (!user || !inscr || candAction) return;
    const motif = window.prompt("Motif du rejet de la candidature (transmis à l'étudiant) :");
    if (motif === null) return;
    setCandAction(true);
    await setInscriptionStatus(inscr.id, "rejetee");
    await logAudit({
      actorId: user.id,
      actorName: user.name,
      action: "candidature.rejeter",
      entity: `inscription:${inscr.id}`,
      detail: `Candidature de ${student?.first_name ?? ""} ${student?.last_name ?? ""} (${inscr.matricule}) rejetée${motif ? ` — ${motif}` : ""}.`,
      severity: "warn",
    });
    setInscr((p) => (p ? { ...p, status: "rejetee" } : p));
    setCandAction(false);
  };

  const handleGenerate = async () => {
    if (!user || !inscr || generating) return;
    const year = selYear || inscr.academic_year;
    if (!year) { setGenError("Aucune année académique définie."); return; }
    setGenerating(true);
    setGenError(null);
    const { transcript, error } = await buildTranscript(studentId, year, selSem, inscr.parcours_slug, user.id);
    if (error || !transcript) {
      setGenError(error ?? "Échec de la génération du relevé.");
    } else {
      await logAudit({
        actorId: user.id,
        actorName: user.name,
        action: "transcript.generate",
        entity: `transcript:${transcript.id}`,
        detail: `Relevé ${year} S${selSem} généré pour ${student?.first_name ?? ""} ${student?.last_name ?? ""} — moyenne ${transcript.average ?? "—"}, décision ${transcript.decision}`,
      });
      setTranscripts((ts) => [transcript, ...ts.filter((t) => t.id !== transcript.id)]);
    }
    setGenerating(false);
  };

  const examTitle = useMemo(() => {
    const m = new Map(exams.map((e) => [e.id, e.title]));
    return (examId: string) => m.get(examId) ?? "Examen";
  }, [exams]);

  // ── Synthèse ─────────────────────────────────────────────────
  const ectsValides = delibs.filter((d) => d.status === "valide").reduce((a, d) => a + d.credits, 0);
  const notesArr    = delibs.map((d) => d.note).filter((n): n is number => n != null);
  const moyenne     = notesArr.length ? Math.round((notesArr.reduce((a, n) => a + n, 0) / notesArr.length) * 100) / 100 : null;
  const progGlobale = courses.length ? Math.round(courses.reduce((a, c) => a + c.progression, 0) / courses.length) : 0;
  const chapVus     = progress.length;
  const natifMoyen  = native.length ? Math.round(native.reduce((a, n) => a + n.pct, 0) / native.length) : 0;
  const alertsTotal = attempts.reduce((a, x) => a + (x.alerts?.length ?? 0), 0);
  const totalEcts   = inscr?.total_ects ?? 0;

  // ── États d'attente / erreurs ────────────────────────────────
  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Loader2 className="w-8 h-8 text-cama animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface text-center px-6">
      <UserX className="w-12 h-12 text-subtle" />
      <p className="text-lg font-semibold text-ink">Étudiant introuvable</p>
      <p className="text-sm text-muted">Aucun compte ne correspond à cet identifiant.</p>
      <Link href="/admin/utilisateurs" className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-cama hover:underline">
        <ArrowLeft className="w-4 h-4" /> Retour aux utilisateurs
      </Link>
    </div>
  );

  if (fetching || !student) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Loader2 className="w-8 h-8 text-cama animate-spin" />
    </div>
  );

  const initials = `${student.first_name[0] ?? ""}${student.last_name[0] ?? ""}`.toUpperCase();
  const badge = inscr ? INSCR_BADGE[inscr.status] : null;

  return (
    <div className="min-h-screen bg-surface py-8 px-4 print:bg-white print:py-0">
      {/* Barre d'actions (masquée à l'impression) */}
      <div className="max-w-[900px] mx-auto mb-4 flex items-center justify-between print:hidden">
        <Link href="/admin/utilisateurs" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-cama">
          <ArrowLeft className="w-4 h-4" /> Utilisateurs
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDossier(true)}
            className="inline-flex items-center gap-2 border-2 border-cama px-4 py-2 text-sm font-semibold text-cama hover:bg-cama-50 transition-colors"
          >
            <FolderOpen className="w-4 h-4" /> Voir le dossier de candidature (A4)
          </button>
          {inscr?.status === "en_attente" && (
            <button
              onClick={handleValidateCandidature}
              disabled={candAction}
              className="inline-flex items-center gap-2 bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {candAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Valider la candidature
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-cama px-4 py-2 text-sm font-semibold text-white shadow-md shadow-cama/25 hover:bg-cama-700 transition-colors"
          >
            <Printer className="w-4 h-4" /> Imprimer / PDF
          </button>
        </div>
      </div>

      {/* Document A4 */}
      <article className="max-w-[900px] mx-auto bg-white rounded-2xl shadow-sm border border-border print:shadow-none print:border-0 print:rounded-none overflow-hidden">
        {/* En-tête institutionnel */}
        <header className="bg-gradient-to-r from-cama-900 to-cama text-white px-8 py-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-white to-gold" />
            <div className="leading-tight">
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-white/70">Institut JFN</span>
              <span className="block text-lg font-bold leading-none tracking-tight">
                CA<span className="text-gold">MA</span>
              </span>
            </div>
            <span className="ml-auto text-[11px] font-medium uppercase tracking-widest text-white/70">
              Fiche étudiant
            </span>
          </div>

          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-4 ring-white/20 shrink-0"
              style={{ backgroundColor: student.avatar_color || "#4F46E5" }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight truncate">
                {student.first_name} {student.last_name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
                {student.student_card && <span>N° {student.student_card}</span>}
                <span className="truncate">{student.email}</span>
                {student.phone && <span>{student.phone_prefix ?? "+237"} {student.phone}</span>}
              </div>
              {inscr && (
                <div className="mt-2 text-sm text-white/85">
                  {inscr.parcours_title} · {inscr.level}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="px-8 pb-10">
          {/* 1 — Identité & inscription */}
          <Section icon={GraduationCap} title="Identité & inscription">
            {inscr ? (
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-8">
                <Field label="Matricule" value={inscr.matricule} />
                <Field label="Filière" value={inscr.parcours_title} />
                <Field label="École" value={inscr.school} />
                <Field label="Cycle" value={inscr.cycle_type} />
                <Field label="Niveau" value={inscr.level} />
                <Field label="Mode" value={MODE_LABEL[inscr.mode] ?? inscr.mode} />
                <Field label="Campus" value={inscr.campus} />
                <Field label="Année académique" value={inscr.academic_year} />
                <Field label="Semestre" value={`S${inscr.semester}`} />
                <Field
                  label="Statut inscription"
                  value={badge && (
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  )}
                />
                <Field label="Date d'inscription" value={fmtDate(inscr.enrolled_at)} />
                <Field label="Total ECTS visé" value={`${inscr.total_ects} ECTS`} />
              </dl>
            ) : (
              <p className="text-sm text-muted italic">Aucune inscription enregistrée pour cet étudiant.</p>
            )}
          </Section>

          {/* 2 — Parcours académique */}
          <Section icon={BookOpen} title="Parcours académique">
            {courses.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wider text-subtle border-b border-border">
                      <th className="py-2 pr-3">Code</th>
                      <th className="py-2 pr-3">Matière</th>
                      <th className="py-2 pr-3 text-center">ECTS</th>
                      <th className="py-2 pl-3 w-40">Progression</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((c) => (
                      <tr key={c.id} className="border-b border-border/50">
                        <td className="py-2 pr-3 font-mono text-xs text-muted">{c.code}</td>
                        <td className="py-2 pr-3 text-ink">{c.title}</td>
                        <td className="py-2 pr-3 text-center">{c.ects}</td>
                        <td className="py-2 pl-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                              <div className="h-full rounded-full bg-cama" style={{ width: `${c.progression}%` }} />
                            </div>
                            <span className="text-xs text-muted tabular-nums w-9 text-right">{c.progression}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted italic">Aucune matière au programme.</p>
            )}
          </Section>

          {/* 3 — Résultats & délibérations */}
          <Section icon={Award} title="Résultats & délibérations">
            {delibs.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wider text-subtle border-b border-border">
                      <th className="py-2 pr-3">UE</th>
                      <th className="py-2 pr-3 text-center">Note /20</th>
                      <th className="py-2 pr-3 text-center">Crédits</th>
                      <th className="py-2 pr-3">Statut jury</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delibs.map((d) => {
                      const db = DELIB_BADGE[d.status];
                      return (
                        <tr key={d.id} className="border-b border-border/50">
                          <td className="py-2 pr-3 text-ink">
                            {d.course ? <><span className="font-mono text-xs text-muted">{d.course.code}</span> — {d.course.title}</> : "—"}
                          </td>
                          <td className="py-2 pr-3 text-center tabular-nums">{d.note != null ? d.note : "—"}</td>
                          <td className="py-2 pr-3 text-center tabular-nums">{d.credits}</td>
                          <td className="py-2 pr-3">
                            {db && <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${db.cls}`}>{db.label}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-cama/20 font-semibold text-ink">
                      <td className="py-2 pr-3">Total</td>
                      <td className="py-2 pr-3 text-center tabular-nums">{moyenne != null ? `${moyenne}` : "—"}</td>
                      <td className="py-2 pr-3 text-center tabular-nums">{ectsValides}</td>
                      <td className="py-2 pr-3 text-xs text-muted">ECTS validés</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted italic">Aucune délibération enregistrée.</p>
            )}
          </Section>

          {/* 4 — Examens passés */}
          <Section icon={ClipboardCheck} title="Examens passés">
            {attempts.length ? (
              <ul className="divide-y divide-border/60">
                {attempts.map((a) => {
                  const n = note20(a);
                  const ab = ATTEMPT_BADGE[a.status];
                  const nb = a.alerts?.length ?? 0;
                  return (
                    <li key={a.id} className="flex items-center gap-3 py-2.5">
                      <span className="flex-1 text-sm text-ink truncate">{examTitle(a.exam_id)}</span>
                      <span className="text-sm tabular-nums text-muted w-16 text-right">{n != null ? `${n}/20` : "—"}</span>
                      {ab && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ab.cls}`}>{ab.label}</span>}
                      {nb > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                          <ShieldAlert className="w-3 h-3" /> {nb}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted italic">Aucun examen passé.</p>
            )}
          </Section>

          {/* 5 — Dossier administratif */}
          <Section icon={FolderOpen} title="Dossier administratif">
            {documents.length ? (
              <ul className="divide-y divide-border/60">
                {documents.map((d) => {
                  const db = DOC_BADGE[d.status] ?? DOC_BADGE.depose;
                  return (
                    <li key={d.id} className="py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-ink truncate">{docKindLabel(d.kind)}</p>
                          <p className="text-xs text-muted truncate">
                            {d.title ?? "Document"}{d.size_mo != null ? ` · ${d.size_mo} Mo` : ""} · déposé le {fmtDate(d.uploaded_at)}
                          </p>
                        </div>
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${db.cls}`}>
                          {db.label}
                        </span>
                        <a href={d.url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-cama hover:underline print:hidden">
                          <ExternalLink className="w-3.5 h-3.5" /> Ouvrir
                        </a>
                        {d.status === "depose" && (
                          <div className="flex items-center gap-1.5 print:hidden">
                            <button
                              onClick={() => handleReview(d.id, "valide")}
                              disabled={reviewing === d.id}
                              className="inline-flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valider
                            </button>
                            <button
                              onClick={() => handleReview(d.id, "refuse")}
                              disabled={reviewing === d.id}
                              className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Refuser
                            </button>
                          </div>
                        )}
                      </div>
                      {d.note_admin && (
                        <p className="mt-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 inline-block">
                          Note : {d.note_admin}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted italic">Aucune pièce justificative déposée.</p>
            )}
          </Section>

          {/* 5bis — Bulletins */}
          <Section icon={FileText} title="Bulletins">
            {inscr ? (
              <>
                <div className="flex flex-wrap items-end gap-3 mb-4 print:hidden">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-subtle mb-1">Année académique</label>
                    <select
                      value={selYear}
                      onChange={(e) => setSelYear(e.target.value)}
                      className="border border-border bg-white text-sm text-ink px-2 py-1.5 focus:outline-none focus:border-cama"
                    >
                      {years.length === 0 && inscr.academic_year && (
                        <option value={inscr.academic_year}>{inscr.academic_year}</option>
                      )}
                      {years.map((y) => <option key={y.id} value={y.label}>{y.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-subtle mb-1">Semestre</label>
                    <select
                      value={selSem}
                      onChange={(e) => setSelSem(Number(e.target.value))}
                      className="border border-border bg-white text-sm text-ink px-2 py-1.5 focus:outline-none focus:border-cama"
                    >
                      {(semesters.length
                        ? Array.from(new Set(semesters.map((s) => s.number))).sort((a, b) => a - b)
                        : [1, 2, 3, 4, 5, 6]
                      ).map((n) => <option key={n} value={n}>Semestre {n}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="inline-flex items-center gap-2 bg-cama px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-cama-700 transition-colors disabled:opacity-50"
                  >
                    {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                    Générer le relevé
                  </button>
                </div>
                {genError && <p className="text-xs text-red-600 mb-3 print:hidden">{genError}</p>}
                {transcripts.length ? (
                  <ul className="divide-y divide-border/60">
                    {transcripts.map((t) => (
                      <li key={t.id} className="flex items-center gap-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-ink">{t.academic_year} — Semestre {t.semester}</p>
                          <p className="text-xs text-muted">
                            Moyenne {t.average != null ? `${t.average}/20` : "—"}
                            {t.mention ? ` · Mention ${t.mention}` : ""} · {t.ects_earned}/{t.ects_total} ECTS
                            · généré le {fmtDate(t.generated_at)}
                          </p>
                        </div>
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          t.decision === "admis" ? "bg-green-50 text-green-700 border-green-200"
                          : t.decision === "rattrapage" ? "bg-gold-light text-gold-dark border-gold/40"
                          : "bg-red-50 text-red-600 border-red-200"}`}>
                          {DECISION_LABEL[t.decision ?? ""] ?? "—"}
                        </span>
                        <button
                          onClick={() => window.print()}
                          className="inline-flex items-center gap-1 text-xs font-medium text-cama hover:underline print:hidden"
                          title="Imprimer la fiche (bulletins inclus)"
                        >
                          <Printer className="w-3.5 h-3.5" /> Imprimer
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted italic">Aucun bulletin généré pour cet étudiant.</p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted italic">Génération impossible : aucune inscription enregistrée.</p>
            )}
          </Section>

          {/* 6 — Assiduité & engagement */}
          <Section icon={Activity} title="Assiduité & engagement">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-surface/60 p-4 text-center">
                <div className="text-2xl font-bold text-cama tabular-nums">{chapVus}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-subtle">Chapitres consultés</div>
              </div>
              <div className="rounded-xl border border-border bg-surface/60 p-4 text-center">
                <div className="text-2xl font-bold text-cama tabular-nums">{natifMoyen}%</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-subtle">Ancrage natif moyen</div>
              </div>
              <div className="rounded-xl border border-border bg-surface/60 p-4 text-center">
                <div className={`text-2xl font-bold tabular-nums ${alertsTotal ? "text-red-600" : "text-green-600"}`}>{alertsTotal}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-subtle">Alertes d'intégrité</div>
              </div>
            </div>
          </Section>

          {/* 6 — Synthèse */}
          <Section icon={Award} title="Synthèse">
            <div className="flex justify-end">
              <div className="w-full md:w-80 rounded-xl border-2 border-cama/20 bg-cama-50/40 p-5">
                <dl className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted">ECTS validés</dt>
                    <dd className="font-bold text-ink tabular-nums">{ectsValides} / {totalEcts}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted">Moyenne générale</dt>
                    <dd className="font-bold text-ink tabular-nums">{moyenne != null ? `${moyenne} / 20` : "—"}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted">Progression globale</dt>
                    <dd className="font-bold text-ink tabular-nums">{progGlobale}%</dd>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-cama/20">
                    <dt className="text-muted">Statut</dt>
                    <dd>
                      {badge
                        ? <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                        : <span className="text-muted">—</span>}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </Section>

          <footer className="mt-10 pt-4 border-t border-border text-center text-[11px] text-subtle">
            Document généré le {fmtDate(new Date().toISOString())} · CAMA — Institut JFN · Confidentiel
          </footer>
        </div>
      </article>

      {/* ══ Vue A4 — Dossier de candidature ══ */}
      {showDossier && (
        <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto print:bg-white print:static print:overflow-visible">
          {/* Barre d'actions */}
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 bg-cama-900 px-4 py-3 print:hidden">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-gold" /> Dossier de candidature — {student.first_name} {student.last_name}
            </span>
            <div className="flex items-center gap-2">
              {inscr?.status === "en_attente" && (
                <>
                  <button
                    onClick={handleValidateCandidature}
                    disabled={candAction}
                    className="inline-flex items-center gap-2 bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {candAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Valider la candidature
                  </button>
                  <button
                    onClick={handleRejectCandidature}
                    disabled={candAction}
                    className="inline-flex items-center gap-2 border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Rejeter
                  </button>
                </>
              )}
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 bg-white px-3 py-2 text-sm font-semibold text-cama hover:bg-cama-50 transition-colors"
              >
                <Printer className="w-4 h-4" /> Imprimer
              </button>
              <button
                onClick={() => setShowDossier(false)}
                className="inline-flex items-center gap-2 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" /> Fermer
              </button>
            </div>
          </div>

          {/* Feuille A4 (flux normal, PAS de sticky) */}
          <div className="py-6 print:py-0">
            <div className="max-w-[210mm] mx-auto bg-white text-black p-[15mm] shadow-2xl print:shadow-none">
              {/* En-tête */}
              <header className="border-b-2 border-black pb-4 mb-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold uppercase tracking-tight leading-tight">Institut JFN — Dossier d'inscription étudiant</h1>
                    <p className="text-xs mt-1 uppercase tracking-widest text-black/60">Plateforme CAMA · Document officiel</p>
                  </div>
                  <div className="text-right text-xs leading-relaxed shrink-0">
                    <p><span className="font-semibold">Matricule :</span> {inscr?.matricule ?? "—"}</p>
                    <p><span className="font-semibold">Statut :</span> {inscr ? INSCR_BADGE[inscr.status].label : "—"}</p>
                    <p><span className="font-semibold">Édité le :</span> {fmtDate(new Date().toISOString())}</p>
                  </div>
                </div>
              </header>

              {/* Informations personnelles */}
              <section className="mb-8">
                <h2 className="text-sm font-bold uppercase tracking-wide border-b border-black/40 pb-1 mb-3">Informations personnelles</h2>
                <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <A4Field label="Nom" value={student.last_name} />
                  <A4Field label="Prénom" value={student.first_name} />
                  <A4Field label="Email" value={student.email} />
                  <A4Field label="Téléphone" value={student.phone ? `${student.phone_prefix ?? "+237"} ${student.phone}` : null} />
                  <A4Field label="N° carte étudiant" value={student.student_card} />
                  <A4Field label="Nationalité" value={null} />
                  <A4Field label="Filière" value={inscr?.parcours_title ?? student.school} />
                  <A4Field label="École" value={inscr?.school ?? student.school} />
                  <A4Field label="Niveau" value={inscr?.level ?? student.level} />
                  <A4Field label="Cycle" value={inscr?.cycle_type} />
                  <A4Field label="Mode" value={inscr ? (MODE_LABEL[inscr.mode] ?? inscr.mode) : null} />
                  <A4Field label="Campus" value={inscr?.campus} />
                  <A4Field label="Année académique" value={inscr?.academic_year} />
                  <A4Field label="Semestre" value={inscr ? `S${inscr.semester}` : null} />
                </dl>
              </section>

              {/* Pièces justificatives */}
              <section className="mb-8">
                <h2 className="text-sm font-bold uppercase tracking-wide border-b border-black/40 pb-1 mb-3 flex items-center gap-2">
                  <Paperclip className="w-3.5 h-3.5" /> Pièces justificatives ({documents.length})
                </h2>
                {documents.length ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {documents.map((d) => {
                      const db = DOC_BADGE[d.status] ?? DOC_BADGE.depose;
                      return (
                        <a
                          key={d.id}
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block border border-black/30 bg-white p-2 no-underline hover:border-black transition-colors"
                          title="Ouvrir la pièce dans un nouvel onglet"
                        >
                          <div className="h-28 flex items-center justify-center overflow-hidden bg-black/5 border border-black/10">
                            {isImageUrl(d.url) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={d.url} alt={docKindLabel(d.kind)} className="max-h-full max-w-full object-contain" />
                            ) : (
                              <div className="flex flex-col items-center text-black/50">
                                <FileText className="w-8 h-8" />
                                <span className="mt-1 text-[10px] uppercase tracking-wide">Fichier</span>
                              </div>
                            )}
                          </div>
                          <p className="mt-2 text-xs font-semibold text-black truncate">{docKindLabel(d.kind)}</p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-[10px] text-black/50 truncate">{d.title ?? "Document"}</span>
                            <span className={`inline-block border px-1.5 py-0.5 text-[9px] font-semibold ${db.cls}`}>{db.label}</span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm italic text-black/50">Aucune pièce justificative déposée.</p>
                )}
              </section>

              {/* Pied de page — vérification */}
              <footer className="mt-12 pt-6 border-t-2 border-black grid grid-cols-2 gap-8 text-sm">
                <div>
                  <p className="mb-8">Vu et vérifié par :</p>
                  <div className="border-b border-black" />
                </div>
                <div>
                  <p className="mb-8">Date :</p>
                  <div className="border-b border-black" />
                </div>
              </footer>
              <p className="mt-6 text-center text-[10px] text-black/40">CAMA — Institut JFN · Document confidentiel réservé à l'administration</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function A4Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-black/50">{label}</dt>
      <dd className="text-sm text-black">{value || "—"}</dd>
    </div>
  );
}
