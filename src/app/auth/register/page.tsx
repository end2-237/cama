"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Globe, ChevronRight, Check, AlertCircle, Loader2 } from "lucide-react";
import AuthPanel from "@/components/auth/AuthPanel";
import { supabase } from "@/lib/supabase";
import { PARCOURS, CYCLES } from "@/lib/parcours";

const niveaux = ["L1", "L2", "L3", "M1", "M2"];

// Filières réelles du catalogue, groupées par école
const PARCOURS_BY_SCHOOL = PARCOURS.reduce<Record<string, typeof PARCOURS>>((acc, p) => {
  (acc[p.school] ??= []).push(p);
  return acc;
}, {});

// Palette d'avatars attribuée aléatoirement à l'inscription
const AVATAR_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

// Année académique + semestre courants (rentrée en septembre)
function currentAcademicYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const start = now.getMonth() >= 8 ? y : y - 1; // mois 8 = septembre
  return `${start}–${start + 1}`;
}

function generateMatricule(): string {
  const year = new Date().getFullYear();
  const n = Math.floor(1000 + Math.random() * 9000);
  return `JFN-${year}-${n}`;
}

export default function RegisterPage() {
  const router = useRouter();

  const [showPwd,   setShowPwd]   = useState(false);
  const [step,      setStep]      = useState<1|2>(1);
  const [accepted,  setAccepted]  = useState(false);

  // L'auto-inscription est réservée aux étudiants ; les enseignants sont créés par l'administration.
  const role = "etudiant" as const;

  // Données du formulaire — tout est capté et persisté
  const [firstName,   setFirstName]   = useState("");
  const [lastName,    setLastName]    = useState("");
  const [email,       setEmail]       = useState("");
  const [pwd,         setPwd]         = useState("");
  const [parcoursSlug, setParcoursSlug] = useState("");
  const [mode,        setMode]        = useState<"presentiel"|"hybride"|"online">("hybride");
  const [niveau,      setNiveau]      = useState("");
  const [studentCard, setStudentCard] = useState("");
  const [phone,       setPhone]       = useState("");

  const parcours = PARCOURS.find((p) => p.slug === parcoursSlug);

  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  // Validation étape 1 avant de continuer
  const canContinue = firstName.trim() && lastName.trim() && email.trim() && pwd.length >= 8;

  const goToStep2 = () => {
    setError("");
    if (!firstName.trim() || !lastName.trim()) { setError("Renseignez votre prénom et nom."); return; }
    if (!email.trim())                          { setError("Renseignez votre email."); return; }
    if (pwd.length < 8)                         { setError("Le mot de passe doit faire au moins 8 caractères."); return; }
    setStep(2);
  };

  const handleRegister = async () => {
    setError("");
    if (!parcours)  { setError("Sélectionnez votre filière."); return; }
    if (role === "etudiant" && !niveau) { setError("Sélectionnez votre niveau."); return; }
    if (!accepted)  { setError("Vous devez accepter les conditions d'utilisation."); return; }

    setLoading(true);

    // 0. Ne jamais rester connecté sous un autre compte (ex: admin) en créant une inscription
    await supabase.auth.signOut();

    // 1. Création du compte Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: pwd,
      options: {
        data: { first_name: firstName, last_name: lastName, role },
      },
    });

    if (authError || !authData.user) {
      setLoading(false);
      setError(
        authError?.message?.includes("already")
          ? "Un compte existe déjà avec cet email."
          : "Erreur lors de la création du compte. Réessayez."
      );
      return;
    }

    const userId = authData.user.id;
    const matricule = studentCard.trim() || generateMatricule();

    // 2. Profil complet dans public.users
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const { error: profileError } = await supabase.from("users").insert({
      id:           userId,
      email,
      first_name:   firstName,
      last_name:    lastName,
      role,
      avatar_color: avatarColor,
      school:       parcours.school,
      level:        role === "etudiant" ? niveau : null,
      student_card: role === "etudiant" ? matricule : null,
      phone:        phone || null,
      phone_prefix: "+237",
    });

    if (profileError) {
      setLoading(false);
      setError("Compte créé mais erreur d'enregistrement du profil. Contactez l'administration.");
      return;
    }

    // 3. Dossier académique (inscription) — uniquement pour les étudiants
    if (role === "etudiant") {
      const { error: dossierError } = await supabase.from("inscriptions").insert({
        user_id:        userId,
        matricule,
        parcours_slug:  parcours.slug,
        parcours_title: parcours.title,
        school:         parcours.school,
        cycle_type:     parcours.cycleType,
        level:          niveau,
        mode,
        campus:         "Yaoundé",
        academic_year:  currentAcademicYear(),
        semester:       1,
        total_ects:     parcours.totalEcts,
        status:         "en_attente",
      });

      if (dossierError) {
        setLoading(false);
        setError("Compte créé mais erreur d'ouverture du dossier académique. Contactez l'administration.");
        return;
      }
    }

    setLoading(false);

    // 3. Si la session est active (confirmation email désactivée) → onboarding
    if (authData.session) {
      router.push("/onboarding");
    } else {
      router.push("/auth/login?registered=1");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[42%_58%]">

      {/* Panel gauche */}
      <div className="hidden lg:block">
        <AuthPanel />
      </div>

      {/* Panel droit */}
      <div className="flex flex-col min-h-screen bg-white animate-fade-in">

        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border animate-fade-up">
          <button
            onClick={() => step === 2 ? setStep(1) : undefined}
            className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors"
          >
            {step === 2 ? (
              <><ArrowLeft className="w-4 h-4" /> Étape précédente</>
            ) : (
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </Link>
            )}
          </button>
          <button className="flex items-center gap-1.5 text-sm text-muted hover:text-ink border border-border rounded-full px-3 py-1.5 hover:border-cama/30 active:scale-95 transition-all">
            <Globe className="w-3.5 h-3.5" />
            Français
          </button>
        </div>

        {/* Stepper */}
        <div className="px-8 pt-6 animate-fade-up delay-100">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-8">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step > s
                      ? "bg-green-500 text-white scale-110 shadow-md shadow-green-200"
                      : step === s
                      ? "bg-cama text-white animate-pulse-ring"
                      : "bg-border text-subtle"
                  }`}>
                    {step > s ? <Check className="w-4 h-4" /> : s}
                  </div>
                  <span className={`text-xs font-medium transition-colors duration-300 ${step >= s ? "text-cama" : "text-subtle"}`}>
                    {s === 1 ? "Informations" : "Profil académique"}
                  </span>
                  {s < 2 && (
                    <ChevronRight className={`w-3 h-3 transition-colors duration-300 ${step === 2 ? "text-cama" : "text-subtle"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-start justify-center px-8 pb-10">
          <div className="w-full max-w-md">

            {/* ── Étape 1 ── */}
            {step === 1 ? (
              <div className="animate-scale-in">
                <h1 className="text-3xl font-light text-ink mb-1">Créer un compte</h1>
                <p className="text-muted text-sm mb-7">
                  Vous pourrez accéder à vos cours dès l&apos;inscription validée.
                </p>

                {/* Google */}
                <button className="w-full flex items-center justify-center gap-3 border border-border rounded-xl py-3 text-sm font-medium text-ink hover:bg-surface hover:border-cama/30 hover:scale-[1.01] active:scale-95 transition-all duration-200 mb-4">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  S&apos;inscrire avec Google
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-subtle">Ou créer un compte</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Champs */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Prénom</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => { setFirstName(e.target.value); setError(""); }}
                        placeholder="Jean-Paul"
                        className="input-auth"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Nom</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => { setLastName(e.target.value); setError(""); }}
                        placeholder="Mbarga"
                        className="input-auth"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="votre@email.cm"
                      className="input-auth"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Mot de passe</label>
                    <div className="relative">
                      <input
                        type={showPwd ? "text" : "password"}
                        value={pwd}
                        onChange={(e) => { setPwd(e.target.value); setError(""); }}
                        placeholder="Min. 8 caractères"
                        className="input-auth pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle hover:text-cama transition-colors"
                      >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 animate-fade-up">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  onClick={goToStep2}
                  disabled={!canContinue}
                  className="w-full btn-primary py-3.5 text-base rounded-xl justify-center shadow-lg shadow-cama/20 hover:shadow-cama/40 hover:scale-[1.01] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                >
                  Continuer
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            ) : (
              /* ── Étape 2 ── */
              <div className="animate-scale-in">
                <h1 className="text-3xl font-light text-ink mb-1">Profil académique</h1>
                <p className="text-muted text-sm mb-7">
                  Ces informations permettent de vous affecter à la bonne filière.
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Filière</label>
                    <select
                      value={parcoursSlug}
                      onChange={(e) => { setParcoursSlug(e.target.value); setError(""); }}
                      className="input-auth bg-white cursor-pointer"
                    >
                      <option value="">Sélectionner une filière</option>
                      {Object.entries(PARCOURS_BY_SCHOOL).map(([school, list]) => (
                        <optgroup key={school} label={school}>
                          {list.map((p) => (
                            <option key={p.slug} value={p.slug}>{p.title}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {parcours && (
                      <p className="text-[11px] text-muted mt-1">
                        {parcours.school} · {parcours.diplome}
                      </p>
                    )}
                  </div>

                  {role === "etudiant" && (
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Mode d&apos;inscription</label>
                      <div className="grid grid-cols-3 gap-2">
                        {CYCLES.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { setMode(c.id); setError(""); }}
                            className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all duration-200 ${
                              mode === c.id
                                ? "border-cama bg-cama text-white scale-105 shadow-md shadow-cama/25"
                                : "border-border text-muted hover:border-cama hover:text-cama hover:scale-105"
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {role === "etudiant" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1.5">Niveau</label>
                        <div className="grid grid-cols-5 gap-2">
                          {niveaux.map((n) => (
                            <button
                              key={n}
                              onClick={() => { setNiveau(n); setError(""); }}
                              className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all duration-200 ${
                                niveau === n
                                  ? "border-cama bg-cama text-white scale-105 shadow-md shadow-cama/25"
                                  : "border-border text-muted hover:border-cama hover:text-cama hover:scale-105"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1.5">
                          Matricule <span className="text-subtle font-normal">(optionnel — généré sinon)</span>
                        </label>
                        <input
                          type="text"
                          value={studentCard}
                          onChange={(e) => setStudentCard(e.target.value)}
                          placeholder="JFN-2025-XXXX"
                          className="input-auth"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Téléphone (optionnel)</label>
                    <div className="flex gap-2">
                      <div className="border border-border rounded-xl px-3 py-3 flex items-center gap-1.5 text-sm text-muted flex-shrink-0 bg-surface">
                        🇨🇲 +237
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="6XX XXX XXX"
                        className="input-auth flex-1"
                      />
                    </div>
                  </div>

                  {/* Conditions */}
                  <label
                    className="flex items-start gap-3 cursor-pointer group"
                    onClick={() => { setAccepted(!accepted); setError(""); }}
                  >
                    <div className={`w-5 h-5 rounded border-2 mt-0.5 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                      accepted
                        ? "bg-cama border-cama scale-105"
                        : "border-border group-hover:border-cama"
                    }`}>
                      {accepted && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      J&apos;accepte les{" "}
                      <a href="#" className="text-cama underline">conditions d&apos;utilisation</a>{" "}
                      et la{" "}
                      <a href="#" className="text-cama underline">politique de confidentialité</a>{" "}
                      de la plateforme CAMA.
                    </p>
                  </label>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 animate-fade-up">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full btn-primary py-3.5 text-base rounded-xl justify-center shadow-lg shadow-cama/20 hover:shadow-cama/40 hover:scale-[1.01] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Création…</>
                  ) : "Créer mon compte"}
                </button>
              </div>
            )}

            <p className="text-center text-sm text-muted mt-6">
              Déjà inscrit ?{" "}
              <Link href="/auth/login" className="text-cama font-bold hover:underline hover:text-cama-700 transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
