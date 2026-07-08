"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Globe, AlertCircle, Loader2, Mail, GraduationCap } from "lucide-react";
import AuthPanel from "@/components/auth/AuthPanel";
import { supabase } from "@/lib/supabase";

type Mode = "password" | "teacher";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("password");

  // ── Flux mot de passe (Étudiant / Admin) ──
  const [email,   setEmail]   = useState("");
  const [pwd,     setPwd]     = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password: pwd });
    setLoading(false);
    if (authError) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    router.push("/dashboard");
  };

  // ── Flux enseignant (OTP par email) ──
  const [otpStep,  setOtpStep]  = useState<1 | 2>(1);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpErr,   setOtpErr]   = useState("");
  const [otpMsg,   setOtpMsg]   = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  // Code reçu par e-mail : jusqu'à 8 cases (validé dès 6 chiffres)
  const CODE_LEN = 8;
  const [code, setCode] = useState<string[]>(Array(CODE_LEN).fill(""));
  const cellRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    setCode((prev) => { const next = [...prev]; next[i] = digit; return next; });
    setOtpErr("");
    if (digit && i < CODE_LEN - 1) cellRefs.current[i + 1]?.focus();
  };
  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) cellRefs.current[i - 1]?.focus();
  };
  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LEN).split("");
    if (!digits.length) return;
    const next = Array(CODE_LEN).fill("");
    digits.forEach((dgt, idx) => { next[idx] = dgt; });
    setCode(next); setOtpErr("");
    cellRefs.current[Math.min(digits.length, CODE_LEN - 1)]?.focus();
  };

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setOtpErr(""); setOtpMsg("");
    const mail = otpEmail.trim().toLowerCase();
    if (!mail) { setOtpErr("Saisissez votre email."); return; }
    setOtpLoading(true);

    // 1. Vérifie (AJAX) qu'un compte ENSEIGNANT existe pour cet email avant d'envoyer quoi que ce soit
    const { data: acct } = await supabase
      .from("users").select("id, role").ilike("email", mail).maybeSingle();
    if (!acct || acct.role !== "enseignant") {
      setOtpLoading(false);
      setOtpErr("Aucun compte enseignant n'est associé à cet email. Contactez l'administration.");
      return;
    }

    // 2. Envoie le code (jamais de création de compte via ce canal)
    let { error: err } = await supabase.auth.signInWithOtp({
      email: mail,
      options: { shouldCreateUser: false },
    });

    // 2 bis. Échec 422 « signups not allowed » : le profil existe mais le compte
    // Auth est peut-être absent. On tente une réparation serveur, puis on renvoie.
    if (err && (err.status === 422 || /signup|not allowed/i.test(err.message || ""))) {
      try {
        const res = await fetch("/api/auth/ensure-teacher", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: mail }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.repaired) {
          ({ error: err } = await supabase.auth.signInWithOtp({
            email: mail, options: { shouldCreateUser: false },
          }));
        }
      } catch { /* on retombe sur la gestion d'erreur ci-dessous */ }
    }

    setOtpLoading(false);
    if (err) {
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("signup") || msg.includes("not allowed") || err.status === 422) {
        setOtpErr(
          "La connexion par code e-mail n'est pas activée côté serveur (OTP e-mail). " +
          "Contactez l'administration pour l'activer, puis réessayez.",
        );
      } else if (msg.includes("rate") || err.status === 429) {
        setOtpErr("Trop de tentatives. Patientez une minute avant de redemander un code.");
      } else {
        setOtpErr(`Impossible d'envoyer le code : ${err.message || "erreur inconnue"}.`);
      }
      return;
    }
    setCode(Array(CODE_LEN).fill(""));
    setOtpStep(2);
    setOtpMsg("Un code de vérification a été envoyé à votre email.");
    setTimeout(() => cellRefs.current[0]?.focus(), 50);
  };

  const verifyCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setOtpErr(""); setOtpMsg("");
    const token = code.join("").replace(/\D/g, "");
    if (token.length < 6) { setOtpErr("Saisissez le code complet (au moins 6 chiffres)."); return; }
    setOtpLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email: otpEmail.trim().toLowerCase(),
      token,
      type: "email",
    });
    setOtpLoading(false);
    if (err) {
      setOtpErr("Code invalide ou expiré. Réessayez ou renvoyez un code.");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[42%_58%]">

      <div className="hidden lg:block"><AuthPanel /></div>

      <div className="flex flex-col min-h-screen bg-white animate-fade-in">

        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border animate-fade-up">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <button className="flex items-center gap-1.5 text-sm text-muted hover:text-ink border border-border rounded-full px-3 py-1.5 hover:border-cama/30 active:scale-95 transition-all">
            <Globe className="w-3.5 h-3.5" /> Français
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <div className="w-full max-w-md">

            <div className="animate-fade-up delay-100">
              <h1 className="text-3xl font-light text-ink mb-1">Bienvenue&nbsp;!</h1>
              <p className="text-muted text-sm mb-6">Connectez-vous à votre compte CAMA.</p>
            </div>

            {/* Sélecteur de mode — onglets carrés */}
            <div className="grid grid-cols-2 mb-6 border border-border animate-fade-up delay-100">
              <button
                onClick={() => { setMode("password"); setError(""); }}
                className={`flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  mode === "password" ? "bg-cama text-white" : "bg-white text-muted hover:text-ink"}`}
              >
                Étudiant / Admin
              </button>
              <button
                onClick={() => { setMode("teacher"); setOtpErr(""); }}
                className={`flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase tracking-widest border-l border-border transition-colors ${
                  mode === "teacher" ? "bg-cama text-white" : "bg-white text-muted hover:text-ink"}`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Enseignant
              </button>
            </div>

            {/* ══════════ MODE MOT DE PASSE ══════════ */}
            {mode === "password" && (
              <>
                {/* Google — en haut */}
                <div className="animate-fade-up delay-150">
                  <button className="w-full flex items-center justify-center gap-3 border-2 border-border py-3 text-sm font-bold text-ink hover:bg-surface hover:border-cama/40 active:scale-95 transition-all duration-200">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continuer avec Google
                  </button>
                </div>

                {/* Séparateur */}
                <div className="flex items-center gap-3 my-5 animate-fade-up delay-200">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-subtle">Ou avec votre email</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 mb-2 animate-fade-up delay-200">
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        placeholder="votre@email.cm"
                        className={`input-auth ${error ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Mot de passe</label>
                      <div className="relative">
                        <input
                          type={showPwd ? "text" : "password"}
                          value={pwd}
                          onChange={(e) => { setPwd(e.target.value); setError(""); }}
                          placeholder="••••••••"
                          className={`input-auth pr-11 ${error ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                          required
                        />
                        <button type="button" onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle hover:text-cama transition-colors">
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3 mt-3 animate-fade-up">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end my-4 animate-fade-up delay-200">
                    <Link href="/auth/reset" className="text-sm text-cama hover:underline font-medium">
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  <div className="animate-fade-up delay-300">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-primary py-3.5 text-base rounded-xl justify-center shadow-lg shadow-cama/20 hover:shadow-cama/40 hover:scale-[1.01] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Connexion…</>
                      ) : "Se connecter"}
                    </button>
                  </div>
                </form>

                <p className="text-center text-sm text-muted mt-8 animate-fade-up delay-500">
                  Pas encore de compte ?{" "}
                  <Link href="/auth/register" className="text-cama font-bold hover:underline transition-colors">
                    S&apos;inscrire
                  </Link>
                </p>
              </>
            )}

            {/* ══════════ MODE ENSEIGNANT (OTP) ══════════ */}
            {mode === "teacher" && (
              <div className="animate-scale-in">
                {otpStep === 1 ? (
                  <form onSubmit={sendCode}>
                    <p className="text-sm text-muted mb-4">
                      Espace enseignant : recevez un code de connexion par email. Les comptes enseignants sont créés par l&apos;administration.
                    </p>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-ink mb-1.5">Email professionnel</label>
                      <input
                        type="email"
                        value={otpEmail}
                        onChange={(e) => { setOtpEmail(e.target.value); setOtpErr(""); }}
                        placeholder="prof@jfn.cm"
                        className={`input-auth ${otpErr ? "border-red-400" : ""}`}
                        required
                      />
                    </div>

                    {otpErr && (
                      <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-3 animate-fade-up">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {otpErr}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full btn-primary py-3.5 text-base rounded-xl justify-center shadow-lg shadow-cama/20 hover:shadow-cama/40 hover:scale-[1.01] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                    >
                      {otpLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</>
                      ) : (<><Mail className="w-4 h-4" /> Recevoir mon code</>)}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={verifyCode}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1.5">Code de vérification</p>
                    <p className="text-sm text-muted mb-5">
                      Saisissez le code reçu à <span className="font-bold text-ink">{otpEmail}</span>.
                    </p>

                    <div className="flex gap-1.5 justify-between mb-4" onPaste={onPaste}>
                      {code.map((d, i) => (
                        <input
                          key={i}
                          ref={(el) => { cellRefs.current[i] = el; }}
                          value={d}
                          onChange={(e) => setDigit(i, e.target.value)}
                          onKeyDown={(e) => onKeyDown(i, e)}
                          inputMode="numeric"
                          maxLength={1}
                          className="w-10 h-14 text-center text-xl font-black text-ink bg-white border-2 border-border outline-none focus:border-cama transition-colors"
                        />
                      ))}
                    </div>

                    {otpMsg && !otpErr && (
                      <p className="text-[11px] text-muted mb-3">{otpMsg}</p>
                    )}
                    {otpErr && (
                      <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-3 animate-fade-up">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {otpErr}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full btn-primary py-3.5 text-base rounded-xl justify-center shadow-lg shadow-cama/20 hover:shadow-cama/40 hover:scale-[1.01] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                    >
                      {otpLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Vérification…</>
                      ) : "Vérifier"}
                    </button>

                    <div className="flex items-center justify-between mt-4">
                      <button type="button" onClick={() => { setOtpStep(1); setOtpErr(""); setOtpMsg(""); }}
                        className="text-sm text-muted hover:text-ink transition-colors">
                        ← Changer d&apos;email
                      </button>
                      <button type="button" onClick={() => sendCode()} disabled={otpLoading}
                        className="text-sm text-cama hover:underline font-medium disabled:opacity-50">
                        Renvoyer le code
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
