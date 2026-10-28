/**
 * Edge Function: kyc-webhook
 *
 * Recibe el resultado del proveedor KYC (Truora / Sumsub / Veriff / MetaMap)
 * y actualiza profiles.identity_* con service role.
 *
 * Deploy:
 *   supabase functions deploy kyc-webhook
 *   supabase secrets set KYC_WEBHOOK_SECRET=... KYC_PROVIDER=truora
 *
 * El cliente NUNCA marca identity_status = verified.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-kyc-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const secret = Deno.env.get("KYC_WEBHOOK_SECRET") ?? "";
    const signature = req.headers.get("x-kyc-signature") ?? "";
    if (secret && signature !== secret) {
      return json({ error: "Firma inválida" }, 401);
    }

    const body = await req.json();
    // Normaliza según proveedor. Ejemplo genérico:
    const userId = body.user_id ?? body.reference ?? body.applicantId;
    const statusRaw = String(body.status ?? body.result ?? "").toLowerCase();
    const externalId = body.verification_id ?? body.session_id ?? body.id ?? null;
    const reason = body.reason ?? body.rejection_reason ?? null;

    const verified = ["verified", "approved", "success", "completed"].includes(statusRaw);
    const rejected = ["rejected", "declined", "failed"].includes(statusRaw);

    if (!userId || (!verified && !rejected)) {
      return json({ error: "Payload incompleto o estado desconocido", received: body }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(url, key);

    const identity_status = verified ? "verified" : "rejected";
    const provider = Deno.env.get("KYC_PROVIDER") ?? "external";

    const { error: profileErr } = await sb
      .from("profiles")
      .update({
        identity_status,
        identity_provider: provider,
        identity_verification_id: externalId,
        identity_verified_at: verified ? new Date().toISOString() : null,
        identity_rejection_reason: rejected ? reason : null,
      })
      .eq("id", userId);

    if (profileErr) throw profileErr;

    if (externalId) {
      await sb
        .from("kyc_sessions")
        .update({ status: identity_status, updated_at: new Date().toISOString() })
        .eq("external_id", externalId);
    }

    return json({ ok: true, identity_status });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
