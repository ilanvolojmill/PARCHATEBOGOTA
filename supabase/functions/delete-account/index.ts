// Edge Function: borrar auth.users tras delete_own_account RPC
// Deploy: supabase functions deploy delete-account
// Secrets: SUPABASE_SERVICE_ROLE_KEY (ya disponible en functions)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "missing auth" }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  await admin.rpc("delete_own_account"); // limpia storage/perfil si se llama con user JWT
  // Prefer: call SQL as service after verifying uid
  await admin.from("profiles").delete().eq("id", userData.user.id);
  const { error } = await admin.auth.admin.deleteUser(userData.user.id);

  return new Response(JSON.stringify({ ok: !error, error: error?.message }), {
    headers: { "Content-Type": "application/json" },
    status: error ? 500 : 200,
  });
});
