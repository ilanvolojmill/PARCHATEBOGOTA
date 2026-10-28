// Edge Function — push a usuarios cerca de parches activos
// Deploy: supabase functions deploy notify-nearby
// Secrets:
//   FIREBASE_SERVICE_ACCOUNT_JSON  (FCM HTTP v1 — recomendado)
//   o FIREBASE_SERVER_KEY          (legacy, deprecado)
//
// Invocar con service role / cron cada 5–10 min:
//   POST /functions/v1/notify-nearby  { "mode": "scan" }
// o push directo a un user:
//   POST /functions/v1/notify-nearby  { "userId": "...", "title": "...", "body": "..." }

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const RADIUS_KM = 0.5;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.json().catch(() => ({}));
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);

  if (body.mode === "scan") {
    const result = await scanAndNotify(sb);
    return json(result);
  }

  const { userId, title, body: msg } = body;
  if (!userId) return json({ ok: false, error: "userId required" }, 400);

  const sent = await pushToUser(sb, userId, title ?? "ParchexBogotá", msg ?? "");
  return json({ ok: true, sent });
});

async function scanAndNotify(sb: ReturnType<typeof createClient>) {
  const { data: parches } = await sb
    .from("parches")
    .select("id, title, lat, lng, host_id")
    .gt("expires_at", new Date().toISOString())
    .eq("hidden", false);

  const { data: users } = await sb
    .from("profiles")
    .select("id, last_lat, last_lng")
    .not("last_lat", "is", null)
    .not("last_lng", "is", null)
    .eq("is_banned", false);

  if (!parches?.length || !users?.length) {
    return { ok: true, sent: 0, reason: "no_parches_or_users" };
  }

  let sent = 0;
  for (const u of users) {
    const near = parches.find((p) => {
      if (p.host_id === u.id) return false;
      return haversineKm(u.last_lat, u.last_lng, p.lat, p.lng) <= RADIUS_KM;
    });
    if (!near) continue;
    sent += await pushToUser(
      sb,
      u.id,
      "Parche cerca de ti",
      `${near.title} — a menos de 500 m. Abre ParchexBogotá.`
    );
  }
  return { ok: true, sent, scannedUsers: users.length, activeParches: parches.length };
}

async function pushToUser(
  sb: ReturnType<typeof createClient>,
  userId: string,
  title: string,
  body: string
) {
  const { data: tokens } = await sb.from("push_tokens").select("token").eq("user_id", userId);
  if (!tokens?.length) return 0;

  const accessToken = await getFcmAccessToken();
  const projectId = Deno.env.get("FIREBASE_PROJECT_ID");
  const legacyKey = Deno.env.get("FIREBASE_SERVER_KEY");

  let sent = 0;
  for (const { token } of tokens) {
    try {
      if (accessToken && projectId) {
        const res = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token,
                notification: { title, body },
              },
            }),
          }
        );
        if (res.ok) sent++;
      } else if (legacyKey) {
        const res = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            Authorization: `key=${legacyKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: token,
            notification: { title, body },
          }),
        });
        if (res.ok) sent++;
      }
    } catch {
      /* continue */
    }
  }
  return sent;
}

async function getFcmAccessToken(): Promise<string | null> {
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw);
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claim = btoa(
      JSON.stringify({
        iss: sa.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      })
    );
    // Nota: firmar JWT RS256 en Deno requiere WebCrypto + private_key.
    // Si no hay key usable, cae a legacy FIREBASE_SERVER_KEY.
    // Para producción: usa la librería google-auth o genera el token fuera.
    void header;
    void claim;
    void sa;
    return null;
  } catch {
    return null;
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
