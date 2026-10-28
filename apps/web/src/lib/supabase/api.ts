import { getSupabase, isSupabaseConfigured } from "./client";
import type { DbParche, DbProfile, DbSpot } from "./mappers";
import { mapParche, mapProfile, mapSpot } from "./mappers";
import type {
  ContentTargetType,
  Coords,
  InviteRequest,
  InviteStatus,
  Parche,
  ParcheVibe,
  PeerInfo,
  Spot,
  UserProfile,
} from "../types";
import { PARCHE_TTL_MS } from "../constants";

export { isSupabaseConfigured };

const PROFILE_SELECT = "*";
const HOST_JOIN = "profiles:host_id(id, handle, name, avatar_url, verified, is_admin)";

async function ensureRateLimit(action: string, max: number, windowSeconds: number) {
  const sb = getSupabase();
  if (!sb) return;
  const { data, error } = await sb.rpc("check_rate_limit", {
    p_action: action,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    // Si la RPC aún no está desplegada, no bloqueamos el flujo.
    console.warn("rate_limit", error.message);
    return;
  }
  if (data === false) {
    throw new Error("Demasiadas acciones. Espera un momento e intenta de nuevo.");
  }
}

async function uploadPhoto(
  dataUrl: string,
  path: string,
  bucket: "photos" | "faces" = "photos"
): Promise<string> {
  const sb = getSupabase();
  if (!sb) return dataUrl;

  if (dataUrl.startsWith("http")) return dataUrl;

  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = blob.type.includes("png") ? "png" : "jpg";
  const filePath = `${path}.${ext}`;

  const { error } = await sb.storage.from(bucket).upload(filePath, blob, {
    upsert: true,
    contentType: blob.type || "image/jpeg",
  });
  if (error) throw error;

  if (bucket === "faces") {
    const { data: signed, error: signErr } = await sb.storage
      .from("faces")
      .createSignedUrl(filePath, 60 * 60 * 24 * 7);
    if (signErr || !signed) throw signErr ?? new Error("No se pudo firmar la selfie");
    return signed.signedUrl;
  }

  const { data } = sb.storage.from("photos").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from("profiles").select(PROFILE_SELECT).eq("id", userId).single();
  if (error || !data) return null;
  return mapProfile(data as DbProfile);
}

export async function updateProfile(userId: string, patch: Partial<UserProfile>): Promise<UserProfile | null> {
  const sb = getSupabase();
  if (!sb) return null;

  let avatarUrl = patch.avatarUrl;
  let facePhotoUrl = patch.facePhotoUrl;
  if (avatarUrl?.startsWith("data:")) {
    avatarUrl = await uploadPhoto(avatarUrl, `avatars/${userId}`, "photos");
  }
  if (facePhotoUrl?.startsWith("data:")) {
    facePhotoUrl = await uploadPhoto(facePhotoUrl, `${userId}/selfie`, "faces");
  }

  // Nunca escribir verified / is_admin / is_banned desde el cliente.
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.handle !== undefined) row.handle = patch.handle;
  if (patch.bio !== undefined) row.bio = patch.bio;
  if (avatarUrl !== undefined) row.avatar_url = avatarUrl;
  if (facePhotoUrl !== undefined) row.face_photo_url = facePhotoUrl;
  if (patch.onboardingCompleted !== undefined) row.onboarding_completed = patch.onboardingCompleted;

  const { data, error } = await sb
    .from("profiles")
    .update(row)
    .eq("id", userId)
    .select(PROFILE_SELECT)
    .single();

  if (error) throw error;
  return mapProfile(data as DbProfile);
}

/** Activa sello de selfie confirmada vía RPC (server-side). */
export async function confirmSelfieRemote(): Promise<UserProfile | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc("confirm_profile_selfie");
  if (error) throw error;
  return mapProfile(data as DbProfile);
}

/** Inicia sesión KYC (cédula). El proveedor externo completa vía webhook. */
export async function startIdentityVerificationRemote(provider: string): Promise<{ sessionId: string }> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase no configurado");
  const { data, error } = await sb.rpc("start_identity_verification", {
    p_provider: provider,
    p_external_id: null,
  });
  if (error) throw error;
  const row = data as { id: string };
  return { sessionId: row.id };
}

export async function deleteOwnAccountRemote(): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase no configurado");
  const { error } = await sb.rpc("delete_own_account");
  if (error) throw error;
  await sb.auth.signOut();
}

export async function isHandleAvailable(handle: string, excludeUserId?: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return true;
  let q = sb.from("profiles").select("id").eq("handle", handle);
  if (excludeUserId) q = q.neq("id", excludeUserId);
  const { data } = await q.maybeSingle();
  return !data;
}

export async function fetchParches(): Promise<Parche[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data: rows, error } = await sb
    .from("parches")
    .select(`*, ${HOST_JOIN}`)
    .gt("expires_at", new Date().toISOString())
    .eq("hidden", false)
    .order("created_at", { ascending: false });

  if (error || !rows) return [];

  const ids = (rows as DbParche[]).map((r) => r.id);
  const [goingRes, checkinRes, checkinPeopleRes] = await Promise.all([
    sb.from("going_entries").select("parche_id").in("parche_id", ids),
    sb.from("checkins").select("parche_id").in("parche_id", ids),
    sb
      .from("checkins")
      .select("parche_id, user_id, profiles:user_id(id, name, handle, avatar_url, face_photo_url)")
      .in("parche_id", ids),
  ]);

  const goingCounts = new Map<string, number>();
  const checkinCounts = new Map<string, number>();
  const checkInAvatars = new Map<string, import("../types").CheckInAvatar[]>();

  goingRes.data?.forEach((g: { parche_id: string }) => {
    goingCounts.set(g.parche_id, (goingCounts.get(g.parche_id) ?? 0) + 1);
  });
  checkinRes.data?.forEach((c: { parche_id: string }) => {
    checkinCounts.set(c.parche_id, (checkinCounts.get(c.parche_id) ?? 0) + 1);
  });
  checkinPeopleRes.data?.forEach((row: {
    parche_id: string;
    user_id: string;
    profiles?:
      | {
          id: string;
          name: string;
          handle: string;
          avatar_url: string | null;
          face_photo_url: string | null;
        }
      | {
          id: string;
          name: string;
          handle: string;
          avatar_url: string | null;
          face_photo_url: string | null;
        }[]
      | null;
  }) => {
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const list = checkInAvatars.get(row.parche_id) ?? [];
    list.push({
      id: row.user_id,
      name: p?.name ?? p?.handle ?? "Parcero",
      avatarUrl: p?.avatar_url ?? p?.face_photo_url ?? undefined,
    });
    checkInAvatars.set(row.parche_id, list);
  });

  return (rows as DbParche[]).map((r) =>
    mapParche(
      r,
      goingCounts.get(r.id) ?? 0,
      checkinCounts.get(r.id) ?? 0,
      checkInAvatars.get(r.id) ?? []
    )
  );
}

export async function createParche(
  userId: string,
  data: {
    title: string;
    description: string;
    photoUrl: string;
    coords: Coords;
    vibe: ParcheVibe;
    address?: string;
    neighborhood?: string;
    whatsapp?: string;
    inviteOnly?: boolean;
  }
): Promise<Parche> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase no configurado");

  await ensureRateLimit("publish_parche", 5, 3600);
  const photoUrl = await uploadPhoto(data.photoUrl, `parches/${userId}/${Date.now()}`);
  const expiresAt = new Date(Date.now() + PARCHE_TTL_MS).toISOString();

  const { data: row, error } = await sb
    .from("parches")
    .insert({
      host_id: userId,
      title: data.title,
      description: data.description,
      photo_url: photoUrl,
      lat: data.coords.lat,
      lng: data.coords.lng,
      address: data.address,
      neighborhood: data.neighborhood,
      vibe: data.vibe,
      expires_at: expiresAt,
      whatsapp: data.whatsapp ?? null,
      invite_only: !!data.inviteOnly,
    })
    .select(`*, ${HOST_JOIN}`)
    .single();

  if (error) throw error;
  await sb.from("checkins").insert({ parche_id: row.id, user_id: userId });
  return mapParche(row as DbParche, 0, 1);
}

export async function updateParcheRemote(
  id: string,
  data: Partial<{ title: string; description: string; vibe: ParcheVibe; whatsapp: string | null; inviteOnly: boolean }>
) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from("parches").update({
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.vibe !== undefined ? { vibe: data.vibe } : {}),
    ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp } : {}),
    ...(data.inviteOnly !== undefined ? { invite_only: data.inviteOnly } : {}),
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteParcheRemote(id: string) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from("parches").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchSpots(): Promise<Spot[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("spots")
    .select(`*, ${HOST_JOIN}`)
    .eq("hidden", false)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as DbSpot[]).map(mapSpot);
}

export async function createSpot(
  userId: string,
  data: {
    title: string;
    description: string;
    photoUrl: string;
    coords: Coords;
    neighborhood: string;
    vibe: ParcheVibe;
    whatsapp?: string;
    inviteOnly?: boolean;
  }
): Promise<Spot> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase no configurado");

  await ensureRateLimit("publish_spot", 10, 3600);
  const photoUrl = await uploadPhoto(data.photoUrl, `spots/${userId}/${Date.now()}`);

  const { data: row, error } = await sb
    .from("spots")
    .insert({
      host_id: userId,
      title: data.title,
      description: data.description,
      photo_url: photoUrl,
      lat: data.coords.lat,
      lng: data.coords.lng,
      neighborhood: data.neighborhood,
      vibe: data.vibe,
      whatsapp: data.whatsapp ?? null,
      invite_only: !!data.inviteOnly,
    })
    .select(`*, ${HOST_JOIN}`)
    .single();

  if (error) throw error;
  return mapSpot(row as DbSpot);
}

export async function updateSpotRemote(
  id: string,
  data: Partial<{ title: string; description: string; vibe: ParcheVibe; neighborhood: string; whatsapp: string | null; inviteOnly: boolean }>
) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from("spots").update({
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.vibe !== undefined ? { vibe: data.vibe } : {}),
    ...(data.neighborhood !== undefined ? { neighborhood: data.neighborhood } : {}),
    ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp } : {}),
    ...(data.inviteOnly !== undefined ? { invite_only: data.inviteOnly } : {}),
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteSpotRemote(id: string) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from("spots").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleGoing(userId: string, parcheId: string, going: boolean) {
  const sb = getSupabase();
  if (!sb) return;
  if (going) {
    await sb.from("going_entries").upsert({ parche_id: parcheId, user_id: userId });
  } else {
    await sb.from("going_entries").delete().eq("parche_id", parcheId).eq("user_id", userId);
  }
}

export async function toggleCheckin(userId: string, parcheId: string, checkedIn: boolean) {
  const sb = getSupabase();
  if (!sb) return;
  if (checkedIn) {
    await sb.from("checkins").upsert({ parche_id: parcheId, user_id: userId });
  } else {
    await sb.from("checkins").delete().eq("parche_id", parcheId).eq("user_id", userId);
  }
}

export async function fetchUserGoing(userId: string): Promise<string[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb.from("going_entries").select("parche_id").eq("user_id", userId);
  return data?.map((r: { parche_id: string }) => r.parche_id) ?? [];
}

export async function fetchUserCheckins(userId: string): Promise<string[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb.from("checkins").select("parche_id").eq("user_id", userId);
  return data?.map((r: { parche_id: string }) => r.parche_id) ?? [];
}

export async function addCommentRemote(
  userId: string,
  targetType: "parche" | "spot",
  targetId: string,
  text: string
) {
  const sb = getSupabase();
  if (!sb) return;
  await ensureRateLimit("comment", 30, 3600);
  const { error } = await sb.from("comments").insert({
    target_type: targetType,
    target_id: targetId,
    author_id: userId,
    text,
  });
  if (error) throw error;
}

export async function deleteCommentRemote(commentId: string) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from("comments").delete().eq("id", commentId);
  if (error) throw error;
}

export async function fetchComments(): Promise<import("../types").Comment[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("comments")
    .select("*, profiles:author_id(handle, name, avatar_url)")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => {
    const author = row.profiles as { handle: string; name: string; avatar_url?: string };
    return {
      id: row.id,
      targetType: row.target_type,
      targetId: row.target_id,
      authorHandle: author?.handle ?? "",
      authorName: author?.name ?? "",
      authorAvatar: author?.avatar_url,
      text: row.text,
      createdAt: new Date(row.created_at).getTime(),
    };
  });
}

export async function getOrCreateThread(
  userId: string,
  opts: { parcheId?: string; spotId?: string; hostId: string; title: string }
): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase no configurado");

  let q = sb.from("dm_threads").select("id");
  if (opts.parcheId) q = q.eq("parche_id", opts.parcheId).eq("guest_id", userId);
  else if (opts.spotId) q = q.eq("spot_id", opts.spotId).eq("guest_id", userId);

  const { data: existing } = await q.maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await sb
    .from("dm_threads")
    .insert({
      parche_id: nullOr(opts.parcheId),
      spot_id: nullOr(opts.spotId),
      host_id: opts.hostId,
      guest_id: userId,
      title: opts.title,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

function nullOr(v?: string) {
  return v ?? null;
}

export async function sendMessageRemote(threadId: string, senderId: string, text: string) {
  const sb = getSupabase();
  if (!sb) return;
  await ensureRateLimit("dm", 60, 3600);
  const { error } = await sb.from("dm_messages").insert({
    thread_id: threadId,
    sender_id: senderId,
    text,
  });
  if (error) throw error;
}

export async function fetchThreads(userId: string) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("dm_threads")
    .select("*, host:host_id(handle), guest:guest_id(handle)")
    .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    kind: "dm" as const,
    parcheId: row.parche_id ?? undefined,
    spotId: row.spot_id ?? undefined,
    hostHandle: (row.host as { handle: string })?.handle ?? "",
    guestHandle: (row.guest as { handle: string })?.handle ?? "",
    hostId: row.host_id,
    guestId: row.guest_id,
    title: row.title,
    createdAt: new Date(row.created_at).getTime(),
  }));
}

export async function fetchMessages(threadIds: string[]) {
  const sb = getSupabase();
  if (!sb || threadIds.length === 0) return [];
  const { data, error } = await sb
    .from("dm_messages")
    .select("*, profiles:sender_id(handle)")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    threadId: row.thread_id,
    senderHandle: (row.profiles as { handle: string })?.handle ?? "",
    senderId: row.sender_id,
    text: row.text,
    createdAt: new Date(row.created_at).getTime(),
    readAt: row.read_at ? new Date(row.read_at).getTime() : undefined,
  }));
}

export async function markThreadRead(threadId: string, userId: string) {
  const sb = getSupabase();
  if (!sb) return;
  await sb
    .from("dm_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .neq("sender_id", userId)
    .is("read_at", null);
}

export async function submitReportRemote(
  userId: string,
  target: { type: string; id: string; label: string },
  reason: string
) {
  const sb = getSupabase();
  if (!sb) return;
  await ensureRateLimit("report", 15, 3600);
  const { error } = await sb.from("reports").insert({
    target_type: target.type,
    target_id: target.id,
    target_label: target.label,
    reason,
    reporter_id: userId,
  });
  if (error) throw error;
}

export async function fetchReportsAdmin() {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("reports")
    .select("*, profiles:reporter_id(handle)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    targetLabel: row.target_label,
    reason: row.reason,
    reporterHandle: (row.profiles as { handle: string })?.handle ?? "",
    createdAt: new Date(row.created_at).getTime(),
    status: row.status,
  }));
}

export async function moderateHideRemote(type: "parche" | "spot", id: string) {
  const sb = getSupabase();
  if (!sb) return;
  const table = type === "parche" ? "parches" : "spots";
  await sb.from(table).update({ hidden: true }).eq("id", id);
}

export async function moderateDismissReportRemote(id: string) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("reports").update({ status: "dismissed" }).eq("id", id);
}

export async function banUserRemote(userId: string) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("profiles").update({ is_banned: true }).eq("id", userId);
}

export async function unbanUserRemote(userId: string) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("profiles").update({ is_banned: false }).eq("id", userId);
}

export async function syncSpotPref(userId: string, spotId: string, status: "saved" | "discarded" | "none") {
  const sb = getSupabase();
  if (!sb) return;
  if (status === "none") {
    await sb.from("user_spot_prefs").delete().eq("user_id", userId).eq("spot_id", spotId);
  } else {
    await sb.from("user_spot_prefs").upsert({ user_id: userId, spot_id: spotId, status });
  }
}

export async function fetchSpotPrefs(userId: string) {
  const sb = getSupabase();
  if (!sb) return { saved: [] as string[], discarded: [] as string[] };
  const { data } = await sb.from("user_spot_prefs").select("spot_id, status").eq("user_id", userId);
  const saved: string[] = [];
  const discarded: string[] = [];
  data?.forEach((r: { spot_id: string; status: string }) => {
    if (r.status === "saved") saved.push(r.spot_id);
    else discarded.push(r.spot_id);
  });
  return { saved, discarded };
}

export async function setOnboardingCompleted(userId: string, completed: boolean) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb
    .from("profiles")
    .update({ onboarding_completed: completed })
    .eq("id", userId);
  if (error) throw error;
}

export async function fetchBlocks(userId: string): Promise<string[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("blocks")
    .select("blocked_handle")
    .eq("blocker_id", userId);
  if (error || !data) return [];
  return data.map((r: { blocked_handle: string }) => r.blocked_handle);
}

export async function blockUserRemote(blockerId: string, handle: string) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from("blocks").upsert(
    { blocker_id: blockerId, blocked_handle: handle },
    { onConflict: "blocker_id,blocked_handle" }
  );
  if (error) throw error;
}

export async function clearDiscardedSpotPrefs(userId: string) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("user_spot_prefs").delete().eq("user_id", userId).eq("status", "discarded");
}

export async function savePushToken(userId: string, token: string, platform: "web" | "ios" | "android") {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("push_tokens").upsert({ user_id: userId, token, platform });
}

export async function updateMyLocationRemote(lat: number, lng: number) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.rpc("update_my_location", { p_lat: lat, p_lng: lng });
  if (error) console.warn("update_my_location", error.message);
}

export async function exportMyDataRemote(userId: string) {
  const sb = getSupabase();
  if (!sb) return null;

  const [profile, parches, spots, comments, threads, prefs, blocks, invites] = await Promise.all([
    sb.from("profiles").select("*").eq("id", userId).maybeSingle(),
    sb.from("parches").select("*").eq("host_id", userId),
    sb.from("spots").select("*").eq("host_id", userId),
    sb.from("comments").select("*").eq("author_id", userId),
    sb.from("dm_threads").select("*").or(`host_id.eq.${userId},guest_id.eq.${userId}`),
    sb.from("user_spot_prefs").select("*").eq("user_id", userId),
    sb.from("blocks").select("*").eq("blocker_id", userId),
    sb.from("invite_requests").select("*").or(`host_id.eq.${userId},requester_id.eq.${userId}`),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    profile: profile.data,
    parches: parches.data ?? [],
    spots: spots.data ?? [],
    comments: comments.data ?? [],
    dmThreads: threads.data ?? [],
    inviteRequests: invites.data ?? [],
    spotPrefs: prefs.data ?? [],
    blocks: blocks.data ?? [],
    note: "Exportación ARCO / portabilidad. Selfies están en bucket privado y pueden requerir solicitud aparte.",
  };
}

type InvitePeerRow = {
  handle?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  verified?: boolean | null;
};

function mapInvitePeer(row: InvitePeerRow | InvitePeerRow[] | null | undefined, fallback: string): PeerInfo {
  const p = Array.isArray(row) ? row[0] : row;
  return {
    handle: p?.handle ?? fallback,
    name: p?.name ?? p?.handle ?? fallback,
    avatarUrl: p?.avatar_url ?? undefined,
    bio: p?.bio ?? undefined,
    verified: !!p?.verified,
  };
}

export async function fetchInviteRequests(): Promise<InviteRequest[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("invite_requests")
    .select(`
      id, target_type, target_id, message, status, created_at, decided_at, thread_id,
      host:host_id(handle, name, avatar_url, bio, verified),
      requester:requester_id(handle, name, avatar_url, bio, verified)
    `)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const parcheIds = data.filter((r) => r.target_type === "parche").map((r) => r.target_id as string);
  const spotIds = data.filter((r) => r.target_type === "spot").map((r) => r.target_id as string);
  const titles = new Map<string, string>();
  if (parcheIds.length) {
    const { data: rows } = await sb.from("parches").select("id, title").in("id", parcheIds);
    rows?.forEach((r: { id: string; title: string }) => titles.set(r.id, r.title));
  }
  if (spotIds.length) {
    const { data: rows } = await sb.from("spots").select("id, title").in("id", spotIds);
    rows?.forEach((r: { id: string; title: string }) => titles.set(r.id, r.title));
  }

  return data.map((row) => {
    const requester = mapInvitePeer(row.requester as InvitePeerRow, "usuario");
    const host = mapInvitePeer(row.host as InvitePeerRow, "anfitrion");
    return {
      id: row.id as string,
      targetType: row.target_type as ContentTargetType,
      targetId: row.target_id as string,
      targetTitle: titles.get(row.target_id as string) ?? "Plan",
      hostHandle: host.handle,
      requester,
      message: (row.message as string) ?? "",
      status: row.status as InviteStatus,
      createdAt: new Date(row.created_at as string).getTime(),
      decidedAt: row.decided_at ? new Date(row.decided_at as string).getTime() : undefined,
      threadId: (row.thread_id as string | null) ?? `invite:${row.id}`,
    };
  });
}

export async function createInviteRequestRemote(data: {
  userId: string;
  hostId: string;
  targetType: ContentTargetType;
  targetId: string;
  title: string;
  message: string;
}): Promise<{ inviteId: string; threadId: string }> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase no configurado");

  const threadId = await getOrCreateThread(data.userId, {
    parcheId: data.targetType === "parche" ? data.targetId : undefined,
    spotId: data.targetType === "spot" ? data.targetId : undefined,
    hostId: data.hostId,
    title: data.title,
  });

  const { data: row, error } = await sb
    .from("invite_requests")
    .insert({
      target_type: data.targetType,
      target_id: data.targetId,
      host_id: data.hostId,
      requester_id: data.userId,
      message: data.message,
      status: "pending",
      thread_id: threadId,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Ya enviaste una solicitud para este plan");
    throw error;
  }

  await sendMessageRemote(threadId, data.userId, data.message);
  return { inviteId: row.id as string, threadId };
}

export async function decideInviteRemote(requestId: string, status: Exclude<InviteStatus, "pending">) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb
    .from("invite_requests")
    .update({ status, decided_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "pending");
  if (error) throw error;
}

export function subscribeRealtime(
  tables: string[],
  onChange: () => void
): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};

  const channel = sb.channel("parchexbogota-realtime");
  tables.forEach((table) => {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, onChange);
  });
  channel.subscribe();

  return () => {
    sb.removeChannel(channel);
  };
}