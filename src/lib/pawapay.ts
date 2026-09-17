/* ════════════════════════════════════════════════════════════
   CAMA — Intégration PawaPay (dépôts Mobile Money) · SERVEUR uniquement.
   Le jeton PAWAPAY_API_TOKEN ne quitte jamais le serveur.
   Docs : POST /deposits initie un encaissement Mobile Money.
════════════════════════════════════════════════════════════ */

function baseUrl(): string {
  if (process.env.PAWAPAY_BASE_URL) return process.env.PAWAPAY_BASE_URL;
  return process.env.PAWAPAY_ENV === "production"
    ? "https://api.pawapay.io"
    : "https://api.sandbox.pawapay.io";
}

// Correspondents Mobile Money (à étendre selon les pays activés).
export const CORRESPONDENTS: Record<string, { label: string; currency: string }> = {
  MTN_MOMO_CMR:  { label: "MTN MoMo (Cameroun)",   currency: "XAF" },
  ORANGE_CMR:    { label: "Orange Money (Cameroun)", currency: "XAF" },
};

export interface DepositResult {
  ok: boolean;
  status?: string;      // ACCEPTED | REJECTED | DUPLICATE_IGNORED …
  error?: string;
  raw?: unknown;
}

export async function initiateDeposit(params: {
  depositId: string;
  amount: number;
  currency: string;
  correspondent: string;
  phone: string;          // MSISDN, format international sans '+'
  description?: string;
}): Promise<DepositResult> {
  const token = process.env.PAWAPAY_API_TOKEN;
  if (!token) return { ok: false, error: "PAWAPAY_API_TOKEN manquant (configuration serveur)." };

  try {
    const res = await fetch(`${baseUrl()}/deposits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        depositId: params.depositId,
        amount: String(params.amount),
        currency: params.currency,
        correspondent: params.correspondent,
        payer: { type: "MSISDN", address: { value: params.phone.replace(/[^0-9]/g, "") } },
        customerTimestamp: new Date().toISOString(),
        statementDescription: (params.description ?? "CAMA").slice(0, 22),
      }),
    });
    const raw = await res.json().catch(() => ({}));
    return { ok: res.ok, status: (raw as { status?: string })?.status, raw };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur réseau PawaPay." };
  }
}

/** Vérifie l'état réel d'un dépôt (utilisé par le webhook pour ne pas se fier au corps seul). */
export async function getDepositStatus(depositId: string): Promise<string | null> {
  const token = process.env.PAWAPAY_API_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`${baseUrl()}/deposits/${depositId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const raw = await res.json().catch(() => null);
    // L'API renvoie un tableau d'états ; on prend le plus récent.
    const item = Array.isArray(raw) ? raw[0] : raw;
    return (item as { status?: string })?.status ?? null;
  } catch {
    return null;
  }
}
