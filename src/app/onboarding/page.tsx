"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Upload, FileText, CheckCircle2, XCircle, Clock, Camera,
  RefreshCw, LogOut, ChevronRight, ChevronLeft, ShieldCheck, GraduationCap,
  Send, Info, Hourglass,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  DOC_KINDS, docKindLabel, fetchDocuments, uploadStudentDocument,
  type DBStudentDocument, type DocKind,
} from "@/lib/documents";
import { fetchSettings, saveSettings } from "@/lib/notes";

/* Pièces requises (hors photo — étape dédiée — et hors "autre") */
const REQUIRED_KINDS = DOC_KINDS.filter((k) => k.id !== "autre" && k.id !== "photo");

const STEPS = [
  { n: 1, label: "Bienvenue" },
  { n: 2, label: "Pièces justificatives" },
  { n: 3, label: "Photo d'identité" },
  { n: 4, label: "Soumettre" },
] as const;

function Header() {
  return (
    <header className="bg-white border-b border-border">
      <div className="max-w-[1000px] mx-auto px-4 h-14 flex items-center gap-2">
        <div className="w-8 h-8 bg-cama text-white flex items-center justify-center">
          <GraduationCap className="w-4 h-4" />
        </div>
        <span className="text-[11px] font-black uppercase tracking-widest text-ink">
          Institut JFN <span className="text-muted">·</span> CAMA
        </span>
      </div>
    </header>
  );
}

export default function OnboardingPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [docs, setDocs] = useState<DBStudentDocument[]>([]);
  const [fetching, setFetching] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);

  /* Gardes de route */
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/auth/login"); return; }
    if (user.role !== "etudiant") { router.replace("/dashboard"); return; }
    if (user.dossier?.status === "validee") { router.replace("/dashboard"); return; }
  }, [loading, user, router]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    const [d, s] = await Promise.all([fetchDocuments(user.id), fetchSettings(user.id)]);
    setDocs(d);
    // Soumis si le marqueur existe, OU si toutes les pièces requises + la photo sont déposées
    // (repli robuste tant que la table student_settings n'est pas encore migrée).
    const allDocsReady =
      REQUIRED_KINDS.every((k) => d.some((x) => x.kind === k.id)) && d.some((x) => x.kind === "photo");
    setSubmitted(Boolean(s?.prefs?.onboarding_submitted) || allDocsReady);
    setFetching(false);
  }, [user]);

  useEffect(() => { if (user) refresh(); }, [user, refresh]);

  if (loading || !user || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-cama" />
      </div>
    );
  }

  const status = user.dossier?.status ?? "en_attente";

  /* Écran d'attente : dossier soumis, ou déjà en attente après une première soumission */
  if (submitted && status !== "rejetee") {
    return <WaitingScreen docs={docs} onRefresh={refresh} onLogout={logout} status={status} />;
  }
  if (status === "rejetee") {
    return <RejectedScreen docs={docs} onRefresh={refresh} onLogout={logout} onRedo={() => { setSubmitted(false); setStep(2); }} />;
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />

      {/* Stepper carré */}
      <div className="bg-white border-b border-border">
        <div className="max-w-[1000px] mx-auto px-4 py-4 flex items-stretch gap-0">
          {STEPS.map((s, i) => {
            const state = step > s.n ? "done" : step === s.n ? "active" : "todo";
            return (
              <div key={s.n} className="flex items-center flex-1 min-w-0">
                <div className={`flex items-center gap-2 px-2 py-1.5 border ${
                  state === "active" ? "bg-cama text-white border-cama"
                  : state === "done" ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-surface text-muted border-border"}`}>
                  <span className="w-5 h-5 flex items-center justify-center text-[10px] font-black flex-shrink-0 border border-current">
                    {state === "done" ? <CheckCircle2 className="w-3 h-3" /> : s.n}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest truncate">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border mx-1" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-[1000px] mx-auto px-4 py-6">
          {step === 1 && <StepWelcome user={user} />}
          {step === 2 && <StepDocuments user={user} docs={docs} onUploaded={refresh} />}
          {step === 3 && <StepPhoto user={user} docs={docs} onUploaded={refresh} />}
          {step === 4 && <StepSubmit user={user} docs={docs} onSubmitted={() => { setSubmitted(true); }} />}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border border-border bg-white text-ink px-4 py-2.5 hover:bg-surface disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Précédent
            </button>
            {step < 4 && (
              <button
                onClick={() => setStep((s) => Math.min(4, s + 1))}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-cama text-white px-4 py-2.5 hover:bg-cama-700 transition-colors"
              >
                Suivant <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="mt-8 text-center">
            <button onClick={logout} className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-red-600 inline-flex items-center gap-1.5">
              <LogOut className="w-3 h-3" /> Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Étape 1 — Bienvenue ═══════════════ */
function StepWelcome({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const d = user.dossier;
  const rows: [string, string][] = [
    ["Matricule", d?.matricule ?? "—"],
    ["Filière", d?.parcoursTitle ?? "—"],
    ["École", d?.school ?? "—"],
    ["Niveau", d?.level ?? "—"],
    ["Mode", d?.modeLabel ?? "—"],
    ["Année académique", d?.academicYear ?? "—"],
  ];
  return (
    <div className="bg-white border border-border">
      <div className="px-5 py-4 border-b border-border">
        <p className="text-[10px] font-black uppercase tracking-widest text-cama">Bienvenue, {user.firstName}</p>
        <h1 className="text-xl font-black text-ink mt-1">Finalisons votre inscription</h1>
        <p className="text-[12px] text-muted mt-2 leading-relaxed">
          Votre compte est créé. Pour accéder à la plateforme, vous devez déposer vos pièces
          justificatives et soumettre votre candidature. L&apos;administration examinera ensuite
          votre dossier.
        </p>
      </div>
      <div className="p-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">Récapitulatif du dossier</p>
        <div className="grid sm:grid-cols-2 gap-px bg-border border border-border">
          {rows.map(([k, v]) => (
            <div key={k} className="bg-white px-3 py-2.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted">{k}</p>
              <p className="text-[13px] font-bold text-ink mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Étape 2 — Pièces justificatives ═══════════════ */
function StepDocuments({
  user, docs, onUploaded,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  docs: DBStudentDocument[];
  onUploaded: () => Promise<void> | void;
}) {
  const [busyKind, setBusyKind] = useState<DocKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const upload = async (kind: DocKind, file: File | null) => {
    if (!file) return;
    setBusyKind(kind);
    setError(null);
    const res = await uploadStudentDocument(user.id, kind, file);
    if ("error" in res) setError(res.error);
    else await onUploaded();
    setBusyKind(null);
  };

  const done = REQUIRED_KINDS.filter((k) => docs.some((d) => d.kind === k.id)).length;

  return (
    <div className="bg-white border border-border">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-ink">Pièces justificatives</h2>
          <p className="text-[11px] text-muted mt-0.5">Déposez chaque pièce requise (PDF, JPG, PNG).</p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest bg-cama text-white px-2 py-1">{done}/{REQUIRED_KINDS.length}</span>
      </div>
      {error && <p className="text-[11px] text-red-600 px-5 pt-3">{error}</p>}
      <div className="divide-y divide-border">
        {REQUIRED_KINDS.map((k) => {
          const doc = docs.find((d) => d.kind === k.id);
          const busy = busyKind === k.id;
          return (
            <div key={k.id} className="px-5 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-cama-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-cama" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-ink">{k.label}</p>
                {doc && (
                  <p className="text-[10px] text-muted truncate">
                    {doc.title ?? "Document"} — {new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
              {doc ? <DocBadge status={doc.status} /> : (
                <span className="text-[9px] font-black uppercase tracking-wide px-2 py-1 border bg-surface text-muted border-border flex-shrink-0">Requis</span>
              )}
              <input
                ref={(el) => { inputs.current[k.id] = el; }}
                type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
                onChange={(e) => upload(k.id, e.target.files?.[0] ?? null)}
              />
              <button
                onClick={() => inputs.current[k.id]?.click()}
                disabled={busy}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-cama text-white px-3 py-2 hover:bg-cama-700 disabled:opacity-50 flex-shrink-0 transition-colors"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {doc ? "Remplacer" : "Déposer"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted px-5 py-3 border-t border-border flex items-start gap-1.5">
        <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
        Chaque pièce sera vérifiée par l&apos;administration après soumission de votre dossier.
      </p>
    </div>
  );
}

/* ═══════════════ Étape 3 — Photo d'identité ═══════════════ */
function StepPhoto({
  user, docs, onUploaded,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  docs: DBStudentDocument[];
  onUploaded: () => Promise<void> | void;
}) {
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [shot, setShot] = useState<string | null>(null); // dataURL
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const existing = docs.find((d) => d.kind === "photo");

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  }, []);

  useEffect(() => () => stopCam(), [stopCam]);

  const startCam = async () => {
    setCamError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCamError("Caméra non disponible. Utilisez l'import de fichier ci-dessous.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setCamOn(true);
      setShot(null);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setCamError("Accès à la caméra refusé. Autorisez la caméra ou importez un fichier.");
    }
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 480;
    canvas.height = v.videoHeight || 360;
    canvas.getContext("2d")?.drawImage(v, 0, 0, canvas.width, canvas.height);
    setShot(canvas.toDataURL("image/jpeg", 0.9));
    stopCam();
  };

  const dataUrlToFile = (dataUrl: string): File => {
    const [head, b64] = dataUrl.split(",");
    const mime = head.match(/:(.*?);/)?.[1] ?? "image/jpeg";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new File([arr], `photo-${Date.now()}.jpg`, { type: mime });
  };

  const save = async (file: File) => {
    setUploading(true);
    setError(null);
    const res = await uploadStudentDocument(user.id, "photo", file);
    if ("error" in res) setError(res.error);
    else { setShot(null); await onUploaded(); }
    setUploading(false);
  };

  return (
    <div className="bg-white border border-border">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-ink">Photo d&apos;identité</h2>
          <p className="text-[11px] text-muted mt-0.5">Prenez une photo avec la webcam ou importez un fichier.</p>
        </div>
        {existing && <DocBadge status={existing.status} />}
      </div>

      <div className="p-5 space-y-4">
        {existing && !shot && !camOn && (
          <div className="flex items-center gap-3 border border-green-200 bg-green-50 px-3 py-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={existing.url} alt="Photo déposée" className="w-14 h-14 object-cover border border-border" />
            <p className="text-[11px] font-bold text-green-700">Photo déjà déposée. Vous pouvez la reprendre si besoin.</p>
          </div>
        )}

        <div className="bg-surface border border-border aspect-video max-w-md mx-auto flex items-center justify-center overflow-hidden">
          {shot ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={shot} alt="Aperçu" className="w-full h-full object-cover" />
          ) : camOn ? (
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          ) : (
            <div className="text-center px-4">
              <Camera className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="text-[11px] text-muted">Aucune capture. Démarrez la caméra.</p>
            </div>
          )}
        </div>

        {camError && <p className="text-[11px] text-red-600 text-center">{camError}</p>}
        {error && <p className="text-[11px] text-red-600 text-center">{error}</p>}

        <div className="flex flex-wrap items-center justify-center gap-2">
          {!camOn && !shot && (
            <button onClick={startCam} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-cama text-white px-4 py-2.5 hover:bg-cama-700 transition-colors">
              <Camera className="w-3.5 h-3.5" /> Démarrer la caméra
            </button>
          )}
          {camOn && (
            <>
              <button onClick={capture} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-cama text-white px-4 py-2.5 hover:bg-cama-700 transition-colors">
                <Camera className="w-3.5 h-3.5" /> Capturer
              </button>
              <button onClick={stopCam} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border border-border bg-white text-ink px-4 py-2.5 hover:bg-surface transition-colors">
                Annuler
              </button>
            </>
          )}
          {shot && (
            <>
              <button onClick={() => save(dataUrlToFile(shot))} disabled={uploading} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-cama text-white px-4 py-2.5 hover:bg-cama-700 disabled:opacity-50 transition-colors">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Utiliser cette photo
              </button>
              <button onClick={startCam} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border border-border bg-white text-ink px-4 py-2.5 hover:bg-surface transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Reprendre
              </button>
            </>
          )}
        </div>

        {/* Fallback import fichier */}
        <div className="text-center border-t border-border pt-4">
          <input
            ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) save(f); }}
          />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="text-[10px] font-black uppercase tracking-widest text-cama hover:text-cama-700 inline-flex items-center gap-1.5 disabled:opacity-50">
            <Upload className="w-3.5 h-3.5" /> Pas de caméra ? Importer un fichier
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Étape 4 — Soumettre ═══════════════ */
function StepSubmit({
  user, docs, onSubmitted,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  docs: DBStudentDocument[];
  onSubmitted: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPhoto = docs.some((d) => d.kind === "photo");
  const missing = REQUIRED_KINDS.filter((k) => !docs.some((d) => d.kind === k.id));
  const allReady = missing.length === 0 && hasPhoto;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    // Meilleur effort : on persiste le marqueur si la table existe, mais on ne bloque
    // jamais la soumission dessus (le dossier est de toute façon complet côté pièces).
    try {
      const existing = await fetchSettings(user.id);
      await saveSettings(user.id, {
        prefs: { ...(existing?.prefs ?? {}), onboarding_submitted: true },
      });
    } catch { /* table pas encore migrée : on continue quand même */ }
    onSubmitted();
    setSubmitting(false);
  };

  return (
    <div className="bg-white border border-border">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-black text-ink">Soumettre ma candidature</h2>
        <p className="text-[11px] text-muted mt-0.5">Vérifiez que tout est complet avant de soumettre.</p>
      </div>
      <div className="p-5 space-y-2">
        {REQUIRED_KINDS.map((k) => {
          const ok = docs.some((d) => d.kind === k.id);
          return (
            <div key={k.id} className="flex items-center gap-2 text-[12px]">
              {ok ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
              <span className={ok ? "text-ink" : "text-muted"}>{k.label}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-2 text-[12px]">
          {hasPhoto ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
          <span className={hasPhoto ? "text-ink" : "text-muted"}>Photo d&apos;identité</span>
        </div>
      </div>
      <div className="px-5 pb-5">
        {!allReady && (
          <p className="text-[11px] text-gold-dark bg-gold/10 border border-gold/40 px-3 py-2 mb-3">
            Il manque des pièces. Vous pouvez tout de même soumettre, mais un dossier incomplet
            retardera la validation.
          </p>
        )}
        {error && <p className="text-[11px] text-red-600 mb-3">{error}</p>}
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest bg-cama text-white px-4 py-3 hover:bg-cama-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Soumettre mon dossier
        </button>
      </div>
    </div>
  );
}

/* ═══════════════ Écran d'attente ═══════════════ */
function WaitingScreen({
  docs, onRefresh, onLogout, status,
}: {
  docs: DBStudentDocument[];
  onRefresh: () => Promise<void> | void;
  onLogout: () => Promise<void> | void;
  status: string;
}) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg bg-white border border-border">
          <div className="px-6 py-8 text-center border-b border-border">
            <div className="w-14 h-14 bg-cama-50 border border-cama/30 flex items-center justify-center mx-auto mb-4">
              <Hourglass className="w-6 h-6 text-cama" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-cama">Candidature soumise</p>
            <h1 className="text-xl font-black text-ink mt-1">Dossier en cours de validation</h1>
            <p className="text-[12px] text-muted mt-3 leading-relaxed">
              L&apos;administration de l&apos;Institut JFN examine actuellement votre dossier.
              Vous recevrez l&apos;accès à la plateforme dès que votre inscription sera validée.
              {status === "en_attente" && " Vous pouvez fermer cette page et revenir plus tard."}
            </p>
          </div>

          <div className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">État des pièces</p>
            <div className="divide-y divide-border border border-border">
              {docs.length === 0 ? (
                <p className="text-[11px] text-muted px-3 py-3 text-center">Aucune pièce déposée.</p>
              ) : docs.map((d) => (
                <div key={d.id} className="px-3 py-2 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-cama flex-shrink-0" />
                  <span className="text-[11px] font-bold text-ink flex-1 truncate">{docKindLabel(d.kind)}</span>
                  <DocBadge status={d.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 pb-5 flex items-center gap-2">
            <button onClick={() => onRefresh()} className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-cama text-white px-4 py-2.5 hover:bg-cama-700 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Rafraîchir
            </button>
            <button onClick={() => onLogout()} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border border-border bg-white text-ink px-4 py-2.5 hover:bg-surface transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Déconnexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Écran rejeté ═══════════════ */
function RejectedScreen({
  docs, onRefresh, onLogout, onRedo,
}: {
  docs: DBStudentDocument[];
  onRefresh: () => Promise<void> | void;
  onLogout: () => Promise<void> | void;
  onRedo: () => void;
}) {
  const refused = docs.filter((d) => d.status === "refuse" && d.note_admin);
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg bg-white border border-border">
          <div className="px-6 py-8 text-center border-b border-border">
            <div className="w-14 h-14 bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Dossier à corriger</p>
            <h1 className="text-xl font-black text-ink mt-1">Inscription rejetée</h1>
            <p className="text-[12px] text-muted mt-3 leading-relaxed">
              Votre dossier n&apos;a pas pu être validé en l&apos;état. Corrigez les pièces
              concernées puis soumettez à nouveau votre candidature.
            </p>
          </div>

          {refused.length > 0 && (
            <div className="p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Motifs</p>
              <div className="space-y-2">
                {refused.map((d) => (
                  <div key={d.id} className="border border-red-200 bg-red-50 px-3 py-2">
                    <p className="text-[11px] font-black text-red-700">{docKindLabel(d.kind)}</p>
                    <p className="text-[10px] text-red-700 mt-0.5">{d.note_admin}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-5 py-5 flex items-center gap-2 border-t border-border">
            <button onClick={onRedo} className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-cama text-white px-4 py-2.5 hover:bg-cama-700 transition-colors">
              <ShieldCheck className="w-3.5 h-3.5" /> Redéposer mes pièces
            </button>
            <button onClick={() => onRefresh()} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border border-border bg-white text-ink px-4 py-2.5 hover:bg-surface transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onLogout()} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border border-border bg-white text-ink px-4 py-2.5 hover:bg-surface transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Badge de statut de pièce ═══════════════ */
function DocBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
    depose: { label: "Déposé", cls: "bg-gold/10 text-gold-dark border-gold/40", Icon: Clock },
    valide: { label: "Validé", cls: "bg-green-50 text-green-700 border-green-200", Icon: CheckCircle2 },
    refuse: { label: "Refusé", cls: "bg-red-50 text-red-600 border-red-200", Icon: XCircle },
  };
  const b = map[status] ?? map.depose;
  const { Icon } = b;
  return (
    <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-1 border flex-shrink-0 ${b.cls}`}>
      <Icon className="w-3 h-3" /> {b.label}
    </span>
  );
}
