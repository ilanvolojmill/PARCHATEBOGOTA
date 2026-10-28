import type { Comment, DMMessage, DMThread, Parche, ParcheVibe, Report, Spot, UserProfile } from "../types";

export interface DbProfile {
  id: string;
  handle: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  face_photo_url: string | null;
  verified: boolean;
  verified_at: string | null;
  verification_id: string | null;
  identity_status?: string | null;
  identity_provider?: string | null;
  identity_verification_id?: string | null;
  identity_verified_at?: string | null;
  identity_rejection_reason?: string | null;
  is_admin: boolean;
  is_banned: boolean;
  onboarding_completed: boolean;
}

export interface DbParche {
  id: string;
  host_id: string;
  title: string;
  description: string;
  photo_url: string;
  lat: number;
  lng: number;
  address: string | null;
  neighborhood: string | null;
  vibe: ParcheVibe;
  expires_at: string;
  hidden: boolean;
  created_at: string;
  whatsapp: string | null;
  invite_only?: boolean | null;
  profiles?: DbProfile;
  going_count?: number;
  checkin_count?: number;
}

export interface DbSpot {
  id: string;
  host_id: string;
  title: string;
  description: string;
  photo_url: string;
  lat: number;
  lng: number;
  neighborhood: string;
  vibe: ParcheVibe;
  hidden: boolean;
  created_at: string;
  whatsapp: string | null;
  invite_only?: boolean | null;
  profiles?: DbProfile;
}

export interface DbComment {
  id: string;
  target_type: "parche" | "spot";
  target_id: string;
  author_id: string;
  text: string;
  created_at: string;
  profiles?: DbProfile;
}

export interface DbDmThread {
  id: string;
  parche_id: string | null;
  spot_id: string | null;
  host_id: string;
  guest_id: string;
  title: string;
  created_at: string;
  host?: DbProfile;
  guest?: DbProfile;
}

export interface DbDmMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  text: string;
  read_at: string | null;
  created_at: string;
  profiles?: DbProfile;
}

export interface DbReport {
  id: string;
  target_type: "parche" | "spot" | "user";
  target_id: string;
  target_label: string;
  reason: string;
  reporter_id: string;
  status: "pending" | "reviewed" | "dismissed";
  created_at: string;
  profiles?: DbProfile;
}

export function mapProfile(row: DbProfile): UserProfile {
  const identityStatus = (row.identity_status ?? "none") as UserProfile["identityStatus"];
  return {
    userId: row.id,
    name: row.name,
    handle: row.handle,
    bio: row.bio ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    facePhotoUrl: row.face_photo_url ?? undefined,
    verified: row.verified,
    verifiedAt: row.verified_at ? new Date(row.verified_at).getTime() : undefined,
    verificationId: row.verification_id ?? undefined,
    identityStatus,
    identityProvider: row.identity_provider ?? undefined,
    identityVerifiedAt: row.identity_verified_at
      ? new Date(row.identity_verified_at).getTime()
      : undefined,
    identityRejectionReason: row.identity_rejection_reason ?? undefined,
    isAdmin: row.is_admin,
    onboardingCompleted: row.onboarding_completed ?? false,
    isBanned: row.is_banned ?? false,
  };
}

export function mapParche(
  row: DbParche,
  goingCount = 0,
  checkinCount = 0,
  checkInAvatars: import("../types").CheckInAvatar[] = []
): Parche {
  const host = row.profiles;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    photoUrl: row.photo_url,
    coords: { lat: row.lat, lng: row.lng },
    address: row.address ?? undefined,
    neighborhood: row.neighborhood ?? undefined,
    vibe: row.vibe,
    hostName: host?.handle ?? "unknown.bog",
    hostAvatar: host?.avatar_url ?? undefined,
    hostVerified: host?.verified ?? false,
    hostId: row.host_id,
    createdAt: new Date(row.created_at).getTime(),
    expiresAt: new Date(row.expires_at).getTime(),
    attendeeCount: checkinCount,
    goingCount,
    isUserCreated: true,
    hidden: row.hidden,
    whatsapp: row.whatsapp ?? undefined,
    inviteOnly: !!row.invite_only,
    checkInAvatars,
  };
}

export function mapSpot(row: DbSpot): Spot {
  const host = row.profiles;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    photoUrl: row.photo_url,
    coords: { lat: row.lat, lng: row.lng },
    neighborhood: row.neighborhood,
    vibe: row.vibe,
    hostName: host?.handle ?? "unknown.bog",
    hostAvatar: host?.avatar_url ?? undefined,
    hostVerified: host?.verified ?? false,
    hostId: row.host_id,
    createdAt: new Date(row.created_at).getTime(),
    isUserCreated: true,
    hidden: row.hidden,
    whatsapp: row.whatsapp ?? undefined,
    inviteOnly: !!row.invite_only,
  };
}

export function mapComment(row: DbComment): Comment {
  const author = row.profiles;
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    authorHandle: author?.handle ?? "unknown.bog",
    authorName: author?.name ?? "Usuario",
    authorAvatar: author?.avatar_url ?? undefined,
    text: row.text,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export function mapThread(row: DbDmThread, hostHandle?: string, guestHandle?: string): DMThread {
  return {
    id: row.id,
    parcheId: row.parche_id ?? undefined,
    spotId: row.spot_id ?? undefined,
    hostHandle: hostHandle ?? row.host?.handle ?? "",
    guestHandle: guestHandle ?? row.guest?.handle ?? "",
    hostId: row.host_id,
    guestId: row.guest_id,
    title: row.title,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export function mapMessage(row: DbDmMessage): DMMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderHandle: row.profiles?.handle ?? "",
    senderId: row.sender_id,
    text: row.text,
    createdAt: new Date(row.created_at).getTime(),
    readAt: row.read_at ? new Date(row.read_at).getTime() : undefined,
  };
}

export function mapReport(row: DbReport): Report {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    targetLabel: row.target_label,
    reason: row.reason,
    reporterHandle: row.profiles?.handle ?? "",
    createdAt: new Date(row.created_at).getTime(),
    status: row.status,
  };
}
