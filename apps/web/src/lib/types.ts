export type Tab = "map" | "spots" | "create" | "messages" | "profile";

export type ParcheVibe =
  | "rumba"
  | "rooftop"
  | "after"
  | "cultural"
  | "picnic"
  | "pre"
  | "chill"
  | "formal"
  | "foodies";

export type ContentTargetType = "parche" | "spot";

export type LegalDoc = "privacy" | "terms";

export interface Coords {
  lat: number;
  lng: number;
}

/** Persona que hizo check-in (“Llegué al parche”) y se muestra en el mapa. */
export interface CheckInAvatar {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Parche {
  id: string;
  title: string;
  description: string;
  photoUrl: string;
  coords: Coords;
  address?: string;
  neighborhood?: string;
  vibe: ParcheVibe;
  hostName: string;
  hostId?: string;
  hostAvatar?: string;
  hostVerified?: boolean;
  createdAt: number;
  expiresAt: number;
  attendeeCount: number;
  goingCount?: number;
  isUserCreated?: boolean;
  hidden?: boolean;
  /** Número WhatsApp del anfitrión (solo dígitos / con indicativo) */
  whatsapp?: string;
  /** Quienes llegaron al parche (foto junto a la burbuja). */
  checkInAvatars?: CheckInAvatar[];
  /** Plan público pero "Por invitación": hay que solicitar entrada al anfitrión. */
  inviteOnly?: boolean;
}

export interface Spot {
  id: string;
  title: string;
  description: string;
  photoUrl: string;
  coords: Coords;
  neighborhood: string;
  vibe: ParcheVibe;
  hostName: string;
  hostId?: string;
  hostAvatar?: string;
  hostVerified?: boolean;
  createdAt: number;
  isUserCreated?: boolean;
  hidden?: boolean;
  /** Número WhatsApp del anfitrión (solo dígitos / con indicativo) */
  whatsapp?: string;
  /** Spot "Por invitación": ubicación exacta y contacto ocultos hasta que el anfitrión acepte. */
  inviteOnly?: boolean;
}

export interface UserProfile {
  userId?: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  facePhotoUrl?: string;
  verified: boolean;
  verifiedAt?: number;
  verificationId?: string;
  /** KYC cédula vía proveedor (no confundir con selfie de perfil). */
  identityStatus?: "none" | "pending" | "verified" | "rejected";
  identityProvider?: string;
  identityVerifiedAt?: number;
  identityRejectionReason?: string;
  bio?: string;
  isAdmin?: boolean;
  onboardingCompleted?: boolean;
  isBanned?: boolean;
}

export interface Comment {
  id: string;
  targetType: ContentTargetType;
  targetId: string;
  authorHandle: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: number;
}

export interface DMMessage {
  id: string;
  threadId: string;
  senderHandle: string;
  senderId?: string;
  text: string;
  createdAt: number;
  readAt?: number;
  /** "text" (por defecto), "system" (avisos automáticos) o "invite_request" (tarjeta de solicitud). */
  kind?: "text" | "system" | "invite_request";
  inviteId?: string;
  /** Variante del texto de sistema que ve el anfitrión del hilo. */
  altText?: string;
}

export type InviteStatus = "pending" | "accepted" | "denied";

/** Foto y datos públicos mínimos de quien solicita (o de un usuario demo). */
export interface PeerInfo {
  handle: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  verified: boolean;
}

export interface InviteRequest {
  id: string;
  targetType: ContentTargetType;
  targetId: string;
  targetTitle: string;
  hostHandle: string;
  requester: PeerInfo;
  /** Mensaje opcional del solicitante (máx. 20 palabras). */
  message: string;
  status: InviteStatus;
  createdAt: number;
  decidedAt?: number;
  threadId: string;
}

export interface DMThread {
  id: string;
  /** "invite" = conversación creada por una solicitud de invitación. */
  kind?: "dm" | "invite";
  inviteId?: string;
  parcheId?: string;
  spotId?: string;
  hostHandle: string;
  guestHandle: string;
  hostId?: string;
  guestId?: string;
  title: string;
  createdAt: number;
  unreadCount?: number;
}

export interface Report {
  id: string;
  targetType: ContentTargetType | "user";
  targetId: string;
  targetLabel: string;
  reason: string;
  reporterHandle: string;
  createdAt: number;
  status: "pending" | "reviewed" | "dismissed";
}

export interface GoingEntry {
  parcheId: string;
  userHandle: string;
}

export interface ContentFilters {
  vibe: ParcheVibe | "all";
  maxDistanceKm: number | null;
  neighborhood: string | "all";
}

export interface AppState {
  onboardingDone: boolean;
  tab: Tab;
  parches: Parche[];
  userParches: string[];
  spots: Spot[];
  userSpots: string[];
  savedSpotIds: string[];
  discardedSpotIds: string[];
  profile: UserProfile;
  userLocation: Coords | null;
  comments: Comment[];
  dmThreads: DMThread[];
  dmMessages: DMMessage[];
  reports: Report[];
  blockedHandles: string[];
  goingEntries: GoingEntry[];
  pushEnabled: boolean;
  mapFilters: ContentFilters;
  spotFilters: ContentFilters;
}

export interface ToastMessage {
  id: number;
  text: string;
  type?: "success" | "error" | "info";
}

export interface ShareTarget {
  type: ContentTargetType;
  id: string;
  title: string;
  photoUrl: string;
}

export interface ReportTarget {
  type: ContentTargetType | "user";
  id: string;
  label: string;
  hostHandle?: string;
}
