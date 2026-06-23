import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function b64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export async function POST(req: Request) {
  const appId = process.env.JAAS_APP_ID;
  const keyId = process.env.JAAS_KEY_ID;
  // La clé peut contenir des \n littéraux (format Vercel) → on les restaure.
  const privateKey = (process.env.JAAS_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

  if (!appId || !keyId || !privateKey) {
    return NextResponse.json(
      { error: "JaaS non configuré (JAAS_APP_ID / JAAS_KEY_ID / JAAS_PRIVATE_KEY manquants)" },
      { status: 500 }
    );
  }

  const { room, name, email, id, moderator } = await req.json();
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", kid: keyId, typ: "JWT" };
  const payload = {
    aud: "jitsi",
    iss: "chat",
    sub: appId,
    room: room || "*",
    iat: now,
    nbf: now - 10,
    exp: now + 3 * 60 * 60, // 3 h
    context: {
      user: {
        id: id || crypto.randomUUID(),
        name: name || "Participant",
        email: email || "",
        moderator: moderator ? "true" : "false",
      },
      features: {
        livestreaming: "false",
        recording: "false",
        transcription: "false",
        "outbound-call": "false",
      },
    },
  };

  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  const signature = b64url(signer.sign(privateKey));

  return NextResponse.json({ jwt: `${signingInput}.${signature}`, appId });
}
