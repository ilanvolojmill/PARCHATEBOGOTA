import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MOCK_PARCHES } from "../data/mock";
import { MOCK_SPOTS } from "../data/mockSpots";
import {
  DEMO_DECISION_DELAY_MS,
  DEMO_HOST_DECISIONS,
  DEMO_OWN_PARCHE_ID,
  DEMO_PEOPLE,
  INVITES_STORAGE_KEY,
  MAX_INVITE_WORDS,
  SYSTEM_HANDLE,
  buildDemoIncoming,
  countWords,
  findDemoPerson,
  loadInviteStore,
  saveInviteStore,
} from "../lib/invites";
import { useAuth } from "./AuthContext";
import { track, trackNeighborhood, initAnalytics, trackFilters, identifyUser } from "../lib/analytics";
import {
  DEFAULT_FILTERS,
  PARCHE_TTL_MS,
  STORAGE_KEY,
} from "../lib/constants";
import { ADMIN_PIN, isDemoAdminPinEnabled } from "../lib/env";
import { applyParcheFilters, applySpotFilters } from "../lib/filters";
import { haversineKm, isInBogota, requestUserLocation, uid, formatDistance } from "../lib/geo";
import { notifyNearbyParche, requestPushPermission, initNativePush } from "../lib/notifications";
import { inferNeighborhood, queueOfflineAction, getOfflineQueue } from "../lib/offline";
import { flushOfflineQueue } from "../lib/offlineSync";
import { clearDeepLink, parseDeepLink } from "../lib/share";
import {
  isSupabaseConfigured,
  fetchParches as fetchRemoteParches,
  fetchSpots as fetchRemoteSpots,
  fetchComments,
  fetchThreads,
  fetchMessages,
  fetchSpotPrefs,
  fetchUserGoing,
  fetchUserCheckins,
  fetchReportsAdmin,
  createParche as createRemoteParche,
  createSpot as createRemoteSpot,
  updateParcheRemote,
  updateSpotRemote,
  deleteParcheRemote,
  deleteSpotRemote,
  toggleGoing,
  toggleCheckin,
  addCommentRemote,
  getOrCreateThread,
  sendMessageRemote,
  markThreadRead,
  submitReportRemote,
  moderateHideRemote,
  moderateDismissReportRemote,
  banUserRemote,
  unbanUserRemote,
  confirmSelfieRemote,
  deleteOwnAccountRemote,
  syncSpotPref,
  updateProfile as updateRemoteProfile,
  isHandleAvailable,
  subscribeRealtime,
  fetchBlocks,
  blockUserRemote,
  setOnboardingCompleted,
  clearDiscardedSpotPrefs,
  updateMyLocationRemote,
  exportMyDataRemote,
  fetchInviteRequests,
  createInviteRequestRemote,
  decideInviteRemote,
} from "../lib/supabase/api";
import type {
  AppState,
  Comment,
  ContentFilters,
  ContentTargetType,
  Coords,
  DMMessage,
  DMThread,
  InviteRequest,
  InviteStatus,
  LegalDoc,
  Parche,
  ParcheVibe,
  PeerInfo,
  Report,
  ReportTarget,
  ShareTarget,
  Spot,
  Tab,
  ToastMessage,
  UserProfile,
} from "../lib/types";

interface ParcheContextValue extends AppState {
  activeParches: Parche[];
  filteredParches: Parche[];
  selectedParche: Parche | null;
  selectedSpot: Spot | null;
  createOpen: boolean;
  createSpotOpen: boolean;
  editProfileOpen: boolean;
  editParcheId: string | null;
  editSpotId: string | null;
  detailOpen: boolean;
  spotDetailOpen: boolean;
  activeThreadId: string | null;
  inviteRequests: InviteRequest[];
  /** Plan al que se está pidiendo invitación (abre el sheet de solicitud). */
  inviteTarget: { type: ContentTargetType; id: string } | null;
  /** Perfil de otra persona que se está viendo (sheet de mini-perfil). */
  peerProfile: { handle: string; requestId?: string } | null;
  /** Solicitudes de invitación pendientes que recibí como anfitrión. */
  pendingInviteCount: number;
  reportOpen: boolean;
  reportTarget: ReportTarget | null;
  shareOpen: boolean;
  shareTarget: ShareTarget | null;
  legalOpen: LegalDoc | null;
  adminOpen: boolean;
  adminAuthed: boolean;
  identityOpen: boolean;
  remoteMode: boolean;
  checkinIds: string[];
  unreadDmCount: number;
  toast: ToastMessage | null;
  deckSpots: Spot[];
  filteredDeckSpots: Spot[];
  savedSpots: Spot[];
  discardedSpots: Spot[];
  setTab: (tab: Tab) => void;
  completeOnboarding: (profile: UserProfile) => void;
  finishOnboarding: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  verifyProfile: (facePhotoUrl: string, verificationId: string) => void;
  openEditProfile: () => void;
  closeEditProfile: () => void;
  selectParche: (parche: Parche | null) => void;
  selectSpot: (spot: Spot | null) => void;
  openCreate: () => void;
  closeCreate: () => void;
  openEditParche: (id: string) => void;
  openCreateSpot: () => void;
  closeCreateSpot: () => void;
  closeDetail: () => void;
  closeSpotDetail: () => void;
  publishParche: (data: {
    title: string;
    description: string;
    photoUrl: string;
    coords: Coords;
    vibe: ParcheVibe;
    address?: string;
    whatsapp?: string;
    inviteOnly?: boolean;
  }) => void;
  updateParche: (id: string, data: Partial<Pick<Parche, "title" | "description" | "vibe" | "whatsapp" | "inviteOnly">>) => void;
  deleteParche: (id: string) => void;
  publishSpot: (data: {
    title: string;
    description: string;
    photoUrl: string;
    coords: Coords;
    neighborhood: string;
    vibe: ParcheVibe;
    whatsapp?: string;
    inviteOnly?: boolean;
  }) => void;
  updateSpot: (id: string, data: Partial<Pick<Spot, "title" | "description" | "vibe" | "neighborhood" | "whatsapp" | "inviteOnly">>) => void;
  deleteSpot: (id: string) => void;
  swipeSpot: (id: string, direction: "left" | "right") => void;
  /** Quita un spot de guardados; vuelve al mazo (no a descartados). */
  unsaveSpot: (id: string) => void;
  /** Deshace `unsaveSpot`: vuelve a guardar el spot en su posición original. */
  resaveSpot: (id: string, index?: number) => void;
  restoreSpot: (id: string) => void;
  resetSpotDeck: () => void;
  addComment: (targetType: ContentTargetType, targetId: string, text: string) => void;
  getComments: (targetType: ContentTargetType, targetId: string) => Comment[];
  openDM: (parcheId?: string, spotId?: string, hostHandle?: string, title?: string) => void;
  /** Deja de mostrar la conversación abierta (vuelve a la lista en móvil). */
  closeThread: () => void;
  sendDM: (text: string) => void;
  sendThreadMessage: (threadId: string, text: string) => void;
  getThreadMessages: (threadId: string) => DMMessage[];
  getPeerInfo: (handle: string) => PeerInfo;
  /** Invitaciones por solicitud */
  isHostOf: (type: ContentTargetType, id: string) => boolean;
  /** true si el plan es público, o si soy el anfitrión, o ya me aceptaron. */
  canViewPrivate: (type: ContentTargetType, id: string) => boolean;
  getMyInvite: (type: ContentTargetType, id: string) => InviteRequest | undefined;
  openInviteRequest: (type: ContentTargetType, id: string) => void;
  closeInviteRequest: () => void;
  requestInvite: (type: ContentTargetType, id: string, message: string) => boolean;
  decideInvite: (requestId: string, status: Exclude<InviteStatus, "pending">) => void;
  openPeerProfile: (handle: string, requestId?: string) => void;
  closePeerProfile: () => void;
  openReport: (target: ReportTarget) => void;
  closeReport: () => void;
  submitReport: (reason: string) => void;
  blockUser: (handle: string) => void;
  openShare: (target: ShareTarget) => void;
  closeShare: () => void;
  markGoing: (parcheId: string) => void;
  isGoing: (parcheId: string) => boolean;
  getGoingCount: (parcheId: string) => number;
  markCheckedIn: (parcheId: string) => void;
  isCheckedIn: (parcheId: string) => boolean;
  /** Lleva a la pestaña Mensajes (sin conversación abierta). */
  openInbox: () => void;
  openIdentity: () => void;
  closeIdentity: () => void;
  openDMThread: (threadId: string) => void;
  openEditSpot: (id: string) => void;
  banUser: (userId: string) => void;
  unbanUser: (userId: string) => void;
  deleteAccount: () => Promise<void>;
  exportMyData: () => Promise<void>;
  offlineQueueCount: number;
  setMapFilters: (f: Partial<ContentFilters>) => void;
  setSpotFilters: (f: Partial<ContentFilters>) => void;
  enablePush: () => Promise<boolean>;
  openLegal: (doc: LegalDoc) => void;
  closeLegal: () => void;
  openAdmin: () => void;
  closeAdmin: () => void;
  loginAdmin: (pin: string) => boolean;
  moderateHide: (type: ContentTargetType, id: string) => void;
  moderateDismissReport: (id: string) => void;
  refreshLocation: () => Promise<void>;
  showToast: (text: string, type?: ToastMessage["type"]) => void;
  sortedParches: Parche[];
}

const defaultProfile: UserProfile = {
  name: "Parcero",
  handle: "parcero.bog",
  verified: false,
  identityStatus: "none",
};

function normalizeProfile(raw?: Partial<UserProfile>): UserProfile {
  return {
    ...defaultProfile,
    ...raw,
    verified: raw?.verified ?? false,
    identityStatus: raw?.identityStatus ?? "none",
  };
}

const ParcheContext = createContext<ParcheContextValue | null>(null);

function loadState(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (parsed.profile) parsed.profile = normalizeProfile(parsed.profile);
    return parsed;
  } catch {
    return {};
  }
}

function saveState(state: Partial<AppState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota */ }
}

export function ParcheProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const remoteMode = isSupabaseConfigured && !!auth.session;
  const userId = auth.session?.user?.id;

  const saved = loadState();
  const [onboardingDone, setOnboardingDone] = useState(saved.onboardingDone ?? false);
  const [tab, setTab] = useState<Tab>(saved.tab ?? "map");
  const [inviteSaved] = useState(loadInviteStore);
  const [rawParches, setParches] = useState<Parche[]>(() => {
    if (isSupabaseConfigured) return [];
    const user = (saved.parches ?? []).filter((p) => p.isUserCreated);
    return [...MOCK_PARCHES, ...user];
  });
  const [rawUserParches, setUserParches] = useState<string[]>(saved.userParches ?? []);
  const [spots, setSpots] = useState<Spot[]>(() => {
    if (isSupabaseConfigured) return [];
    const user = (saved.spots ?? []).filter((s) => s.isUserCreated);
    return [...MOCK_SPOTS, ...user];
  });
  const [userSpots, setUserSpots] = useState<string[]>(saved.userSpots ?? []);
  const [savedSpotIds, setSavedSpotIds] = useState<string[]>(saved.savedSpotIds ?? []);
  const [discardedSpotIds, setDiscardedSpotIds] = useState<string[]>(saved.discardedSpotIds ?? []);
  const [profile, setProfile] = useState<UserProfile>(() =>
    remoteMode && auth.profile ? auth.profile : normalizeProfile(saved.profile)
  );
  const [userLocation, setUserLocation] = useState<Coords | null>(saved.userLocation ?? null);
  const [comments, setComments] = useState<Comment[]>(saved.comments ?? []);
  const [dmThreads, setDmThreads] = useState<DMThread[]>(() =>
    isSupabaseConfigured
      ? []
      : [
          ...(saved.dmThreads ?? []).filter((t) => t.kind !== "invite"),
          ...inviteSaved.threads,
        ]
  );
  const [dmMessages, setDmMessages] = useState<DMMessage[]>(() => {
    if (isSupabaseConfigured) return [];
    const inviteIds = new Set(inviteSaved.threads.map((t) => t.id));
    return [
      ...(saved.dmMessages ?? []).filter((m) => !inviteIds.has(m.threadId)),
      ...inviteSaved.messages,
    ];
  });
  const [inviteRequests, setInviteRequests] = useState<InviteRequest[]>(
    isSupabaseConfigured ? [] : inviteSaved.requests
  );
  const [inviteTarget, setInviteTarget] = useState<{ type: ContentTargetType; id: string } | null>(null);
  const [peerProfile, setPeerProfile] = useState<{ handle: string; requestId?: string } | null>(null);
  const [reports, setReports] = useState<Report[]>(saved.reports ?? []);
  const [blockedHandles, setBlockedHandles] = useState<string[]>(saved.blockedHandles ?? []);
  const [goingEntries, setGoingEntries] = useState(saved.goingEntries ?? []);
  const [pushEnabled, setPushEnabled] = useState(saved.pushEnabled ?? false);
  const [mapFilters, setMapFiltersState] = useState<ContentFilters>(saved.mapFilters ?? DEFAULT_FILTERS);
  const [spotFilters, setSpotFiltersState] = useState<ContentFilters>(saved.spotFilters ?? DEFAULT_FILTERS);

  const [selectedParche, setSelectedParche] = useState<Parche | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSpotOpen, setCreateSpotOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editParcheId, setEditParcheId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [spotDetailOpen, setSpotDetailOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const [legalOpen, setLegalOpen] = useState<LegalDoc | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [identityOpen, setIdentityOpen] = useState(false);
  const [editSpotId, setEditSpotId] = useState<string | null>(null);
  const [checkinIds, setCheckinIds] = useState<string[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, type: ToastMessage["type"] = "info") => {
    const id = Date.now();
    setToast({ id, text, type });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 3200);
  }, []);

  const requireVerified = useCallback(() => {
    if (profile.verified) return true;
    showToast("Confirma tu selfie para publicar", "error");
    setTab("profile");
    setEditProfileOpen(true);
    return false;
  }, [profile.verified, showToast]);

  // El parche demo privado "propio" toma como anfitrión al usuario actual (solo modo local).
  const parches = useMemo(
    () => rawParches.map((p) =>
      p.id === DEMO_OWN_PARCHE_ID
        ? {
            ...p,
            hostName: profile.handle,
            hostId: profile.userId,
            hostAvatar: profile.avatarUrl ?? profile.facePhotoUrl,
            hostVerified: profile.verified,
          }
        : p
    ),
    [rawParches, profile.handle, profile.userId, profile.avatarUrl, profile.facePhotoUrl, profile.verified]
  );
  const userParches = useMemo(
    () => (!isSupabaseConfigured && !rawUserParches.includes(DEMO_OWN_PARCHE_ID)
      ? [DEMO_OWN_PARCHE_ID, ...rawUserParches]
      : rawUserParches),
    [rawUserParches]
  );

  const activeParches = useMemo(
    () => parches.filter((p) => p.expiresAt > Date.now() && !p.hidden),
    [parches]
  );

  const filteredParches = useMemo(
    () => applyParcheFilters(activeParches, mapFilters, userLocation, blockedHandles),
    [activeParches, mapFilters, userLocation, blockedHandles]
  );

  const sortedParches = useMemo(() => {
    const list = [...filteredParches];
    if (userLocation) {
      list.sort((a, b) => haversineKm(userLocation, a.coords) - haversineKm(userLocation, b.coords));
    } else {
      list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return list;
  }, [filteredParches, userLocation]);

  const deckSpots = useMemo(
    () => spots.filter((s) => !savedSpotIds.includes(s.id) && !discardedSpotIds.includes(s.id) && !s.hidden),
    [spots, savedSpotIds, discardedSpotIds]
  );

  const filteredDeckSpots = useMemo(
    () => applySpotFilters(deckSpots, spotFilters, userLocation, blockedHandles),
    [deckSpots, spotFilters, userLocation, blockedHandles]
  );

  const savedSpots = useMemo(() => spots.filter((s) => savedSpotIds.includes(s.id)), [spots, savedSpotIds]);
  const discardedSpots = useMemo(() => spots.filter((s) => discardedSpotIds.includes(s.id)), [spots, discardedSpotIds]);

  const unreadDmCount = useMemo(() => {
    if (!profile.userId && !profile.handle) return 0;
    return dmMessages.filter(
      (m) => m.senderHandle !== profile.handle && !m.readAt
    ).length;
  }, [dmMessages, profile.handle, profile.userId]);

  const pendingInviteCount = useMemo(
    () => inviteRequests.filter((r) => r.status === "pending" && r.hostHandle === profile.handle).length,
    [inviteRequests, profile.handle]
  );

  // Referencias para timers y callbacks asíncronos (evitan datos viejos).
  const inviteRef = useRef(inviteRequests);
  inviteRef.current = inviteRequests;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const inviteThreadIdsRef = useRef<Set<string>>(new Set());
  inviteThreadIdsRef.current = new Set(dmThreads.filter((t) => t.kind === "invite").map((t) => t.id));

  const reloadRemote = useCallback(async () => {
    if (!remoteMode || !userId) return;
    const [p, s, c, threads, going, checkins, prefs, blocks, invites] = await Promise.all([
      fetchRemoteParches(),
      fetchRemoteSpots(),
      fetchComments(),
      fetchThreads(userId),
      fetchUserGoing(userId),
      fetchUserCheckins(userId),
      fetchSpotPrefs(userId),
      fetchBlocks(userId),
      fetchInviteRequests(),
    ]);
    const inviteByThread = new Map(invites.filter((r) => r.threadId).map((r) => [r.threadId, r]));
    const taggedThreads: DMThread[] = threads.map((t) => {
      const inv = inviteByThread.get(t.id);
      return inv
        ? { ...t, kind: "invite" as const, inviteId: inv.id }
        : { ...t, kind: t.kind ?? "dm" };
    });
    setParches(p);
    setSpots(s);
    setComments(c);
    setInviteRequests(invites);
    setDmThreads(taggedThreads);
    setUserParches(p.filter((x) => x.hostId === userId).map((x) => x.id));
    setUserSpots(s.filter((x) => x.hostId === userId).map((x) => x.id));
    setGoingEntries(going.map((pid) => ({ parcheId: pid, userHandle: profile.handle })));
    setCheckinIds(checkins);
    setSavedSpotIds(prefs.saved);
    setDiscardedSpotIds(prefs.discarded);
    setBlockedHandles(blocks);
    if (profile.isAdmin) {
      const adminReports = await fetchReportsAdmin();
      setReports(adminReports);
    }
    const threadIds = taggedThreads.map((t) => t.id);
    if (threadIds.length) {
      const msgs = await fetchMessages(threadIds);
      setDmMessages(msgs);
    } else {
      setDmMessages([]);
    }
  }, [remoteMode, userId, profile.handle, profile.isAdmin]);

  useEffect(() => {
    if (auth.profile) {
      setProfile(auth.profile);
      if (auth.profile.onboardingCompleted) setOnboardingDone(true);
    }
  }, [auth.profile]);

  useEffect(() => {
    if (!remoteMode || !userId) return;
    const sync = async () => {
      const n = await flushOfflineQueue(userId);
      if (n > 0) {
        showToast(`${n} acción(es) offline sincronizada(s)`, "success");
        await reloadRemote();
      }
    };
    sync();
    const onOnline = () => { sync(); };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [remoteMode, userId, reloadRemote, showToast]);

  useEffect(() => {
    if (userId) {
      identifyUser(userId, { handle: profile.handle, neighborhood: "Bogotá" });
      initNativePush(userId);
    }
  }, [userId, profile.handle]);

  useEffect(() => {
    if (!remoteMode) return;
    reloadRemote();
    const unsub = subscribeRealtime(
      ["parches", "spots", "comments", "dm_messages", "going_entries", "checkins", "reports", "invite_requests"],
      reloadRemote
    );
    return unsub;
  }, [remoteMode, reloadRemote]);

  useEffect(() => {
    if (remoteMode) return;
    const inviteIds = new Set(dmThreads.filter((t) => t.kind === "invite").map((t) => t.id));
    saveState({
      onboardingDone, tab,
      parches: parches.filter((p) => p.isUserCreated),
      userParches: rawUserParches,
      spots: spots.filter((s) => s.isUserCreated),
      userSpots, savedSpotIds, discardedSpotIds,
      profile, userLocation,
      comments,
      dmThreads: dmThreads.filter((t) => t.kind !== "invite"),
      dmMessages: dmMessages.filter((m) => !inviteIds.has(m.threadId)),
      reports, blockedHandles,
      goingEntries, pushEnabled, mapFilters, spotFilters,
    });
  }, [
    onboardingDone, tab, parches, rawUserParches, spots, userSpots,
    savedSpotIds, discardedSpotIds, profile, userLocation,
    comments, dmThreads, dmMessages, reports, blockedHandles,
    goingEntries, pushEnabled, mapFilters, spotFilters, remoteMode,
  ]);

  // Solicitudes de invitación y sus conversaciones: siempre locales (también con sesión remota).
  useEffect(() => {
    const inviteIds = new Set(dmThreads.filter((t) => t.kind === "invite").map((t) => t.id));
    saveInviteStore({
      requests: inviteRequests,
      threads: dmThreads.filter((t) => t.kind === "invite"),
      messages: dmMessages.filter((m) => inviteIds.has(m.threadId)),
    });
  }, [inviteRequests, dmThreads, dmMessages]);

  useEffect(() => { initAnalytics(); }, []);

  useEffect(() => {
    if (!onboardingDone) return;
    const link = parseDeepLink();
    if (!link) return;
    if (link.type === "parche") {
      const p = parches.find((x) => x.id === link.id);
      if (p) { setSelectedParche(p); setDetailOpen(true); setTab("map"); }
    } else {
      const s = spots.find((x) => x.id === link.id);
      if (s) { setSelectedSpot(s); setSpotDetailOpen(true); setTab("spots"); }
    }
    clearDeepLink();
  }, [onboardingDone, parches, spots]);

  useEffect(() => {
    if (!onboardingDone || !pushEnabled || !userLocation) return;
    const nearest = activeParches
      .map((p) => ({ p, d: haversineKm(userLocation, p.coords) }))
      .filter((x) => x.d <= 0.5)
      .sort((a, b) => a.d - b.d)[0];
    if (nearest) {
      notifyNearbyParche(nearest.p.title, formatDistance(nearest.d));
    }
  }, [onboardingDone, pushEnabled, userLocation, activeParches.length]);

  const refreshLocation = useCallback(async () => {
    try {
      const coords = await requestUserLocation();
      if (!isInBogota(coords)) showToast("Parece que no estás en Bogotá", "info");
      setUserLocation(coords);
      if (remoteMode && userId) {
        void updateMyLocationRemote(coords.lat, coords.lng);
      }
    } catch {
      showToast("Activa la ubicación para ver distancias", "error");
    }
  }, [showToast, remoteMode, userId]);

  useEffect(() => {
    if (onboardingDone) refreshLocation();
  }, [onboardingDone, refreshLocation]);

  const completeOnboarding = useCallback(async (p: UserProfile) => {
    const normalized = normalizeProfile({ ...p, verified: false });
    if (remoteMode && userId) {
      try {
        await updateRemoteProfile(userId, {
          name: normalized.name,
          handle: normalized.handle,
          bio: normalized.bio,
          facePhotoUrl: normalized.facePhotoUrl,
          avatarUrl: normalized.avatarUrl,
        });
        const confirmed = await confirmSelfieRemote();
        if (confirmed) {
          setProfile(confirmed);
          await auth.refreshProfile();
          return;
        }
        await auth.refreshProfile();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Error al guardar perfil", "error");
      }
    }
    setProfile(normalizeProfile({ ...normalized, verified: true, verifiedAt: Date.now() }));
  }, [remoteMode, userId, auth, showToast]);
  const finishOnboarding = useCallback(async () => {
    if (remoteMode && userId) {
      try {
        await setOnboardingCompleted(userId, true);
        await auth.refreshProfile();
      } catch { /* noop */ }
    }
    setOnboardingDone(true);
    track("Onboarding Complete");
  }, [remoteMode, userId, auth]);
  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    if (remoteMode && userId) {
      if (patch.handle && !(await isHandleAvailable(patch.handle, userId))) {
        showToast("Ese @usuario.bog ya está en uso", "error");
        return;
      }
      const updated = await updateRemoteProfile(userId, patch);
      if (updated) setProfile(updated);
      await auth.refreshProfile();
    } else {
      const oldHandle = profileRef.current.handle;
      const newHandle = patch.handle;
      if (newHandle && newHandle !== oldHandle) {
        // Mantiene las conversaciones y solicitudes locales al cambiar de @usuario.
        const swap = (h: string) => (h === oldHandle ? newHandle : h);
        setInviteRequests((prev) => prev.map((r) => ({
          ...r,
          hostHandle: swap(r.hostHandle),
          requester: r.requester.handle === oldHandle ? { ...r.requester, handle: newHandle } : r.requester,
        })));
        setDmThreads((prev) => prev.map((t) => ({
          ...t, hostHandle: swap(t.hostHandle), guestHandle: swap(t.guestHandle),
        })));
        setDmMessages((prev) => prev.map((m) => ({ ...m, senderHandle: swap(m.senderHandle) })));
      }
      setProfile((prev) => normalizeProfile({ ...prev, ...patch }));
    }
    showToast("Perfil actualizado", "success");
  }, [remoteMode, userId, auth, showToast]);
  const openEditProfile = useCallback(() => setEditProfileOpen(true), []);
  const verifyProfile = useCallback(async (facePhotoUrl: string, _verificationId: string) => {
    if (remoteMode && userId) {
      try {
        await updateRemoteProfile(userId, { facePhotoUrl, avatarUrl: facePhotoUrl });
        const confirmed = await confirmSelfieRemote();
        if (confirmed) setProfile(confirmed);
        await auth.refreshProfile();
        showToast("Selfie confirmada (no es KYC legal)", "success");
        setEditProfileOpen(false);
        track("Profile Selfie Confirmed");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "No se pudo confirmar la selfie", "error");
      }
      return;
    }
    const patch = {
      facePhotoUrl, avatarUrl: facePhotoUrl, verified: true,
      verifiedAt: Date.now(), verificationId: _verificationId,
    };
    setProfile((prev) => normalizeProfile({ ...prev, ...patch }));
    showToast("Selfie confirmada (modo demo)", "success");
    setEditProfileOpen(false);
    track("Profile Selfie Confirmed");
  }, [remoteMode, userId, auth, showToast]);

  const selectParche = useCallback((p: Parche | null) => {
    setSelectedParche(p); setDetailOpen(!!p);
    if (p) track("View Parche", { id: p.id, vibe: p.vibe });
  }, []);
  const selectSpot = useCallback((s: Spot | null) => {
    setSelectedSpot(s); setSpotDetailOpen(!!s);
    if (s) { track("View Spot", { id: s.id }); trackNeighborhood(s.neighborhood, "view"); }
  }, []);
  const closeDetail = useCallback(() => { setDetailOpen(false); setSelectedParche(null); }, []);
  const closeSpotDetail = useCallback(() => { setSpotDetailOpen(false); setSelectedSpot(null); }, []);

  /* ——— Invitaciones (planes "Por invitación") ——— */

  const findInviteTarget = useCallback((type: ContentTargetType, id: string) => {
    const item = type === "parche" ? parches.find((p) => p.id === id) : spots.find((s) => s.id === id);
    if (!item) return undefined;
    return {
      title: item.title,
      hostName: item.hostName,
      hostId: item.hostId,
      inviteOnly: !!item.inviteOnly,
    };
  }, [parches, spots]);

  const isHostOf = useCallback((type: ContentTargetType, id: string) => {
    const t = findInviteTarget(type, id);
    if (!t) return false;
    if (type === "parche" && userParches.includes(id)) return true;
    if (type === "spot" && userSpots.includes(id)) return true;
    return t.hostName === profile.handle || (!!t.hostId && t.hostId === userId);
  }, [findInviteTarget, userParches, userSpots, profile.handle, userId]);

  const getMyInvite = useCallback((type: ContentTargetType, id: string) => {
    return [...inviteRequests]
      .filter((r) => r.targetType === type && r.targetId === id && r.requester.handle === profile.handle)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
  }, [inviteRequests, profile.handle]);

  const canViewPrivate = useCallback((type: ContentTargetType, id: string) => {
    const t = findInviteTarget(type, id);
    if (!t || !t.inviteOnly) return true;
    if (isHostOf(type, id)) return true;
    return getMyInvite(type, id)?.status === "accepted";
  }, [findInviteTarget, isHostOf, getMyInvite]);

  const getPeerInfo = useCallback((handle: string): PeerInfo => {
    const me = profileRef.current;
    if (handle === me.handle) {
      return {
        handle, name: me.name, avatarUrl: me.avatarUrl ?? me.facePhotoUrl,
        bio: me.bio, verified: me.verified,
      };
    }
    const fromRequest = inviteRef.current.find((r) => r.requester.handle === handle);
    if (fromRequest) return fromRequest.requester;
    const demo = findDemoPerson(handle);
    if (demo) return demo;
    const host = parches.find((p) => p.hostName === handle) ?? spots.find((s) => s.hostName === handle);
    return {
      handle,
      name: handle,
      avatarUrl: host?.hostAvatar,
      verified: !!host?.hostVerified,
    };
  }, [parches, spots]);

  const openInviteRequest = useCallback((type: ContentTargetType, id: string) => {
    setInviteTarget({ type, id });
  }, []);
  const closeInviteRequest = useCallback(() => setInviteTarget(null), []);
  const openPeerProfile = useCallback((handle: string, requestId?: string) => {
    setPeerProfile({ handle, requestId });
  }, []);
  const closePeerProfile = useCallback(() => setPeerProfile(null), []);

  const requestInvite = useCallback((type: ContentTargetType, id: string, rawMessage: string): boolean => {
    const target = findInviteTarget(type, id);
    const message = rawMessage.trim().replace(/\s+/g, " ");
    if (!target || !target.inviteOnly) { showToast("Este plan no es por invitación", "error"); return false; }
    if (isHostOf(type, id)) { showToast("Eres el anfitrión de este plan", "error"); return false; }
    if (getMyInvite(type, id)) { showToast("Ya enviaste una solicitud para este plan", "info"); return false; }
    if (countWords(message) > MAX_INVITE_WORDS) {
      showToast(`El mensaje no puede pasar de ${MAX_INVITE_WORDS} palabras`, "error");
      return false;
    }
    const me = profileRef.current;
    const now = Date.now();

    if (remoteMode && userId) {
      if (!target.hostId) {
        showToast("No se encontró al anfitrión", "error");
        return false;
      }
      void (async () => {
        try {
          const created = await createInviteRequestRemote({
            userId,
            hostId: target.hostId as string,
            targetType: type,
            targetId: id,
            title: target.title,
            message,
          });
          setInviteRequests((prev) => [...prev, {
            id: created.inviteId,
            targetType: type,
            targetId: id,
            targetTitle: target.title,
            hostHandle: target.hostName,
            requester: {
              handle: me.handle, name: me.name, avatarUrl: me.avatarUrl ?? me.facePhotoUrl,
              bio: me.bio, verified: me.verified,
            },
            message,
            status: "pending",
            createdAt: now,
            threadId: created.threadId,
          }]);
          setInviteTarget(null);
          showToast(`Solicitud enviada a @${target.hostName}`, "success");
          track("Request Invite", { targetType: type });
          await reloadRemote();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "No se pudo enviar la solicitud";
          showToast(msg, "error");
        }
      })();
      return true;
    }

    const inviteId = uid();
    const threadId = uid();
    const request: InviteRequest = {
      id: inviteId,
      targetType: type,
      targetId: id,
      targetTitle: target.title,
      hostHandle: target.hostName,
      requester: {
        handle: me.handle, name: me.name, avatarUrl: me.avatarUrl ?? me.facePhotoUrl,
        bio: me.bio, verified: me.verified,
      },
      message,
      status: "pending",
      createdAt: now,
      threadId,
    };
    const thread: DMThread = {
      id: threadId, kind: "invite", inviteId,
      parcheId: type === "parche" ? id : undefined,
      spotId: type === "spot" ? id : undefined,
      hostHandle: target.hostName, guestHandle: me.handle,
      hostId: target.hostId, guestId: me.userId,
      title: target.title, createdAt: now,
    };
    const msg: DMMessage = {
      id: uid(), threadId, senderHandle: me.handle, senderId: me.userId,
      text: message, createdAt: now, kind: "invite_request", inviteId,
      readAt: now,
    };
    setInviteRequests((prev) => [...prev, request]);
    setDmThreads((prev) => [...prev, thread]);
    setDmMessages((prev) => [...prev, msg]);
    setInviteTarget(null);
    showToast(`Solicitud enviada a @${target.hostName}`, "success");
    track("Request Invite", { targetType: type });
    return true;
  }, [findInviteTarget, isHostOf, getMyInvite, showToast, remoteMode, userId, reloadRemote]);

  const applyInviteDecision = useCallback((requestId: string, status: Exclude<InviteStatus, "pending">) => {
    const req = inviteRef.current.find((r) => r.id === requestId);
    if (!req || req.status !== "pending") return;
    const me = profileRef.current;
    const iAmHost = req.hostHandle === me.handle;
    const iAmRequester = req.requester.handle === me.handle;
    const now = Date.now();
    const accepted = status === "accepted";
    const text = accepted
      ? `@${req.hostHandle} aceptó tu solicitud para «${req.targetTitle}». Ya puedes ver la dirección exacta y el contacto.`
      : `@${req.hostHandle} denegó tu solicitud para «${req.targetTitle}».`;
    const altText = accepted
      ? `Aceptaste la solicitud de @${req.requester.handle} para «${req.targetTitle}».`
      : `Denegaste la solicitud de @${req.requester.handle} para «${req.targetTitle}».`;
    const sysMsg: DMMessage = {
      id: uid(), threadId: req.threadId, senderHandle: SYSTEM_HANDLE,
      text, altText, createdAt: now, kind: "system", inviteId: req.id,
      // Si decido yo como anfitrión, el aviso ya está "leído" para mí.
      readAt: iAmHost && !iAmRequester ? now : undefined,
    };
    setInviteRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status, decidedAt: now } : r))
    );
    setDmMessages((prev) => [...prev, sysMsg]);
    if (iAmHost) {
      showToast(
        accepted ? `Aceptaste a @${req.requester.handle}` : `Denegaste a @${req.requester.handle}`,
        accepted ? "success" : "info"
      );
    } else if (iAmRequester) {
      showToast(
        accepted ? `@${req.hostHandle} aceptó tu solicitud` : `@${req.hostHandle} denegó tu solicitud`,
        accepted ? "success" : "info"
      );
    }
    track("Decide Invite", { status });
  }, [showToast]);

  const decideInvite = useCallback((requestId: string, status: Exclude<InviteStatus, "pending">) => {
    const req = inviteRef.current.find((r) => r.id === requestId);
    if (!req) return;
    if (req.hostHandle !== profileRef.current.handle) {
      showToast("Solo el anfitrión puede decidir", "error");
      return;
    }
    if (remoteMode) {
      void (async () => {
        try {
          await decideInviteRemote(requestId, status);
          applyInviteDecision(requestId, status);
          if (req.threadId && userId) {
            const accepted = status === "accepted";
            const text = accepted
              ? `Acepté tu solicitud para «${req.targetTitle}». Ya puedes ver la dirección exacta y el contacto.`
              : `Denegué tu solicitud para «${req.targetTitle}».`;
            await sendMessageRemote(req.threadId, userId, text);
          }
          await reloadRemote();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "No se pudo guardar la decisión";
          showToast(msg, "error");
        }
      })();
      return;
    }
    applyInviteDecision(requestId, status);
  }, [applyInviteDecision, showToast, remoteMode, userId, reloadRemote]);

  /** Modo demo: una persona ficticia pide invitación a un plan privado que acabas de publicar. */
  const scheduleDemoRequest = useCallback((type: ContentTargetType, targetId: string, title: string) => {
    window.setTimeout(() => {
      const taken = new Set(
        inviteRef.current
          .filter((r) => r.targetType === type && r.targetId === targetId)
          .map((r) => r.requester.handle)
      );
      const person = DEMO_PEOPLE.find((p) => !taken.has(p.handle));
      if (!person) return;
      const me = profileRef.current;
      const now = Date.now();
      const inviteId = uid();
      const threadId = uid();
      const message = "Hola! Vi tu plan y me encantaría ir. Llego puntual y con buena energía.";
      setInviteRequests((prev) => [...prev, {
        id: inviteId, targetType: type, targetId, targetTitle: title,
        hostHandle: me.handle, requester: person, message, status: "pending",
        createdAt: now, threadId,
      }]);
      setDmThreads((prev) => [...prev, {
        id: threadId, kind: "invite", inviteId,
        parcheId: type === "parche" ? targetId : undefined,
        spotId: type === "spot" ? targetId : undefined,
        hostHandle: me.handle, guestHandle: person.handle, title, createdAt: now,
      }]);
      setDmMessages((prev) => [...prev, {
        id: uid(), threadId, senderHandle: person.handle, text: message,
        createdAt: now, kind: "invite_request", inviteId,
      }]);
      showToast(`@${person.handle} pidió invitación a «${title}»`, "info");
    }, 7000);
  }, [showToast]);

  const seededRef = useRef<Set<string>>(new Set());

  // Modo demo: siembra solicitudes entrantes para tu parche privado de ejemplo.
  useEffect(() => {
    if (isSupabaseConfigured || !onboardingDone) return;
    const own = rawParches.find((p) => p.id === DEMO_OWN_PARCHE_ID);
    if (!own) return;
    const demo = buildDemoIncoming(profile.handle, DEMO_OWN_PARCHE_ID, own.title);
    const missing = demo.requests.filter(
      (r) => !inviteRef.current.some((x) => x.id === r.id) && !seededRef.current.has(r.id)
    );
    if (missing.length === 0) return;
    missing.forEach((r) => seededRef.current.add(r.id));
    const ids = new Set(missing.map((r) => r.id));
    const threadIds = new Set(missing.map((r) => r.threadId));
    setInviteRequests((prev) => [...prev, ...missing.filter((r) => !prev.some((x) => x.id === r.id))]);
    setDmThreads((prev) => [
      ...prev,
      ...demo.threads.filter((t) => ids.has(t.inviteId ?? "") && !prev.some((x) => x.id === t.id)),
    ]);
    setDmMessages((prev) => [
      ...prev,
      ...demo.messages.filter((m) => threadIds.has(m.threadId) && !prev.some((x) => x.id === m.id)),
    ]);
    showToast(
      missing.length === 1
        ? "Tienes 1 solicitud de invitación nueva"
        : `Tienes ${missing.length} solicitudes de invitación nuevas`,
      "info"
    );
  }, [onboardingDone, rawParches, profile.handle, showToast]);

  // Modo demo: los anfitriones ficticios responden a tus solicitudes a los pocos segundos.
  useEffect(() => {
    if (isSupabaseConfigured) return;
    const timers: number[] = [];
    for (const r of inviteRequests) {
      const decision = DEMO_HOST_DECISIONS[r.hostHandle];
      if (r.status !== "pending" || r.requester.handle !== profile.handle || !decision || decision === "pending") continue;
      const wait = Math.max(600, r.createdAt + DEMO_DECISION_DELAY_MS - Date.now());
      timers.push(window.setTimeout(() => applyInviteDecision(r.id, decision), wait));
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [inviteRequests, profile.handle, applyInviteDecision]);

  const openCreate = useCallback(() => {
    if (!requireVerified()) return;
    setEditParcheId(null); setCreateOpen(true); setTab("create");
  }, [requireVerified]);
  const openEditParche = useCallback((id: string) => {
    setEditParcheId(id); setCreateOpen(true); setTab("create");
  }, []);
  const closeCreate = useCallback(() => { setCreateOpen(false); setEditParcheId(null); setTab("map"); }, []);
  const openCreateSpot = useCallback(() => {
    if (!requireVerified()) return;
    setEditSpotId(null);
    setCreateSpotOpen(true);
  }, [requireVerified]);
  const openEditSpot = useCallback((id: string) => {
    setEditSpotId(id);
    setCreateSpotOpen(true);
  }, []);
  const closeCreateSpot = useCallback(() => { setCreateSpotOpen(false); setEditSpotId(null); }, []);

  const publishParche = useCallback(async (data: {
    title: string; description: string; photoUrl: string; coords: Coords; vibe: ParcheVibe; address?: string; whatsapp?: string;
    inviteOnly?: boolean;
  }) => {
    if (!profile.verified) { showToast("Confirma tu selfie para publicar", "error"); return; }
    const neighborhood = inferNeighborhood(data.address, data.coords.lat, data.coords.lng);

    if (remoteMode && userId) {
      if (!navigator.onLine) {
        queueOfflineAction({ type: "publish_parche", payload: data as unknown as Record<string, unknown> });
        showToast("Sin conexión — parche en cola offline", "info");
        return;
      }
      try {
        const parche = await createRemoteParche(userId, { ...data, neighborhood });
        setCreateOpen(false); setEditParcheId(null); setTab("map");
        selectParche(parche);
        showToast(data.inviteOnly ? "¡Parche publicado! Será por invitación" : "¡Parche publicado!", "success");
        track("Publish Parche", { vibe: data.vibe, inviteOnly: !!data.inviteOnly });
      } catch {
        showToast("Error al publicar parche", "error");
      }
      return;
    }

    const now = Date.now();
    const parche: Parche = {
      id: uid(), ...data, neighborhood,
      hostName: profile.handle, hostAvatar: profile.avatarUrl, hostVerified: true,
      createdAt: now, expiresAt: now + PARCHE_TTL_MS, attendeeCount: 1, goingCount: 0, isUserCreated: true,
    };
    setParches((prev) => [parche, ...prev]);
    setUserParches((prev) => [parche.id, ...prev]);
    setCreateOpen(false); setEditParcheId(null); setTab("map");
    selectParche(parche);
    showToast(parche.inviteOnly ? "¡Parche publicado! Será por invitación" : "¡Parche publicado!", "success");
    track("Publish Parche", { vibe: data.vibe, inviteOnly: !!data.inviteOnly });
    if (parche.inviteOnly && !isSupabaseConfigured) scheduleDemoRequest("parche", parche.id, parche.title);
  }, [profile, selectParche, showToast, remoteMode, userId, scheduleDemoRequest]);

  const updateParche = useCallback(async (id: string, data: Partial<Pick<Parche, "title" | "description" | "vibe" | "whatsapp" | "inviteOnly">>) => {
    if (remoteMode) await updateParcheRemote(id, data);
    setParches((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    setCreateOpen(false); setEditParcheId(null); setTab("map");
    showToast("Parche actualizado", "success");
  }, [showToast, remoteMode]);

  const deleteParche = useCallback(async (id: string) => {
    if (remoteMode) await deleteParcheRemote(id);
    setParches((prev) => prev.filter((p) => p.id !== id));
    setUserParches((prev) => prev.filter((x) => x !== id));
    closeDetail();
    showToast("Parche eliminado", "info");
  }, [showToast, remoteMode]);

  const publishSpot = useCallback(async (data: {
    title: string; description: string; photoUrl: string; coords: Coords; neighborhood: string; vibe: ParcheVibe; whatsapp?: string;
    inviteOnly?: boolean;
  }) => {
    if (!profile.verified) { showToast("Confirma tu selfie para publicar", "error"); return; }

    if (remoteMode && userId) {
      try {
        await createRemoteSpot(userId, data);
        setCreateSpotOpen(false); setEditSpotId(null);
        showToast("Spot subido a la nube ☁️", "success");
        track("Publish Spot", { neighborhood: data.neighborhood });
        await reloadRemote();
      } catch {
        showToast("Error al publicar spot", "error");
      }
      return;
    }

    const spot: Spot = {
      id: uid(), ...data,
      hostName: profile.handle, hostAvatar: profile.avatarUrl, hostVerified: true,
      createdAt: Date.now(), isUserCreated: true,
    };
    setSpots((prev) => [spot, ...prev]);
    setUserSpots((prev) => [spot.id, ...prev]);
    setCreateSpotOpen(false);
    showToast("Spot subido a la nube ☁️", "success");
    track("Publish Spot", { neighborhood: data.neighborhood });
    trackNeighborhood(data.neighborhood, "publish");
    if (spot.inviteOnly && !isSupabaseConfigured) scheduleDemoRequest("spot", spot.id, spot.title);
  }, [profile, showToast, remoteMode, userId, reloadRemote, scheduleDemoRequest]);

  const updateSpot = useCallback(async (id: string, data: Partial<Pick<Spot, "title" | "description" | "vibe" | "neighborhood" | "whatsapp" | "inviteOnly">>) => {
    if (remoteMode) await updateSpotRemote(id, data);
    setSpots((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    setCreateSpotOpen(false); setEditSpotId(null);
    showToast("Spot actualizado", "success");
  }, [showToast, remoteMode]);

  const deleteSpot = useCallback(async (id: string) => {
    if (remoteMode) await deleteSpotRemote(id);
    setSpots((prev) => prev.filter((s) => s.id !== id));
    setUserSpots((prev) => prev.filter((x) => x !== id));
    closeSpotDetail();
    showToast("Spot eliminado", "info");
  }, [showToast, remoteMode]);

  const swipeSpot = useCallback(async (id: string, direction: "left" | "right") => {
    if (direction === "right") {
      setSavedSpotIds((prev) => [...prev, id]);
      if (remoteMode && userId) await syncSpotPref(userId, id, "saved");
      showToast("Spot guardado", "success");
      track("Spot Saved", { id });
    } else {
      setDiscardedSpotIds((prev) => [...prev, id]);
      if (remoteMode && userId) await syncSpotPref(userId, id, "discarded");
      track("Spot Discarded", { id });
    }
  }, [showToast, remoteMode, userId]);

  const unsaveSpot = useCallback(async (id: string) => {
    setSavedSpotIds((prev) => prev.filter((x) => x !== id));
    if (remoteMode && userId) await syncSpotPref(userId, id, "none");
    showToast("Spot quitado de guardados", "info");
    track("Spot Unsaved", { id });
  }, [showToast, remoteMode, userId]);

  const resaveSpot = useCallback(async (id: string, index?: number) => {
    setSavedSpotIds((prev) => {
      if (prev.includes(id)) return prev;
      if (index == null || index < 0 || index > prev.length) return [...prev, id];
      const next = [...prev];
      next.splice(index, 0, id);
      return next;
    });
    if (remoteMode && userId) await syncSpotPref(userId, id, "saved");
  }, [remoteMode, userId]);

  const restoreSpot = useCallback(async (id: string) => {
    setDiscardedSpotIds((prev) => prev.filter((x) => x !== id));
    if (remoteMode && userId) await syncSpotPref(userId, id, "none");
    showToast("Spot recuperado al mazo", "success");
    track("Spot Restored", { id });
  }, [showToast, remoteMode, userId]);

  const resetSpotDeck = useCallback(async () => {
    setDiscardedSpotIds([]);
    if (remoteMode && userId) await clearDiscardedSpotPrefs(userId);
    showToast("Mazo reiniciado", "info");
  }, [showToast, remoteMode, userId]);

  const addComment = useCallback(async (targetType: ContentTargetType, targetId: string, text: string) => {
    if (remoteMode && userId) {
      await addCommentRemote(userId, targetType, targetId, text.trim());
      await reloadRemote();
    } else {
      const c: Comment = {
        id: uid(), targetType, targetId,
        authorHandle: profile.handle, authorName: profile.name, authorAvatar: profile.avatarUrl,
        text: text.trim(), createdAt: Date.now(),
      };
      setComments((prev) => [...prev, c]);
    }
    track("Add Comment", { targetType });
  }, [profile, remoteMode, userId, reloadRemote]);

  const getComments = useCallback(
    (targetType: ContentTargetType, targetId: string) =>
      comments.filter((c) => c.targetType === targetType && c.targetId === targetId)
        .sort((a, b) => a.createdAt - b.createdAt),
    [comments]
  );

  const openDM = useCallback(async (parcheId?: string, spotId?: string, hostHandle?: string, title?: string) => {
    if (remoteMode && userId) {
      const parche = parcheId ? parches.find((p) => p.id === parcheId) : undefined;
      const spot = spotId ? spots.find((s) => s.id === spotId) : undefined;
      const hostId = parche?.hostId ?? spot?.hostId;
      if (!hostId) { showToast("No se pudo abrir el chat", "error"); return; }
      const threadId = await getOrCreateThread(userId, { parcheId, spotId, hostId, title: title ?? "Conversación" });
      setActiveThreadId(threadId);
      setTab("messages");
      setDetailOpen(false); setSelectedParche(null);
      setSpotDetailOpen(false); setSelectedSpot(null);
      await markThreadRead(threadId, userId);
      await reloadRemote();
      track("Open DM");
      return;
    }

    const guest = profile.handle;
    const host = hostHandle ?? "host";
    let thread = dmThreads.find((t) =>
      t.kind !== "invite" && (
        (parcheId && t.parcheId === parcheId && t.guestHandle === guest) ||
        (spotId && t.spotId === spotId && t.guestHandle === guest)
      )
    );
    if (!thread) {
      thread = {
        id: uid(), parcheId, spotId, hostHandle: host, guestHandle: guest,
        title: title ?? "Conversación", createdAt: Date.now(),
      };
      setDmThreads((prev) => [...prev, thread!]);
    }
    setActiveThreadId(thread.id);
    setTab("messages");
    setDetailOpen(false); setSelectedParche(null);
    setSpotDetailOpen(false); setSelectedSpot(null);
    track("Open DM");
  }, [profile.handle, dmThreads, remoteMode, userId, parches, spots, showToast, reloadRemote]);

  const markThreadReadLocal = useCallback((threadId: string) => {
    const now = Date.now();
    setDmMessages((prev) =>
      prev.some((m) => m.threadId === threadId && m.senderHandle !== profile.handle && !m.readAt)
        ? prev.map((m) =>
            m.threadId === threadId && m.senderHandle !== profile.handle && !m.readAt
              ? { ...m, readAt: now }
              : m
          )
        : prev
    );
  }, [profile.handle]);

  const openDMThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
    setTab("messages");
    markThreadReadLocal(threadId);
    const isInvite = dmThreads.find((t) => t.id === threadId)?.kind === "invite";
    if (remoteMode && userId && !isInvite) markThreadRead(threadId, userId).then(reloadRemote);
  }, [remoteMode, userId, reloadRemote, markThreadReadLocal, dmThreads]);

  const closeThread = useCallback(() => setActiveThreadId(null), []);

  // Con una conversación abierta en Mensajes, lo que llega se marca como leído.
  useEffect(() => {
    if (tab !== "messages" || !activeThreadId) return;
    const hasUnread = dmMessages.some(
      (m) => m.threadId === activeThreadId && m.senderHandle !== profile.handle && !m.readAt
    );
    if (hasUnread) markThreadReadLocal(activeThreadId);
  }, [tab, activeThreadId, dmMessages, profile.handle, markThreadReadLocal]);

  const sendThreadMessage = useCallback(async (threadId: string, text: string) => {
    const clean = text.trim();
    if (!threadId || !clean) return;
    const isInvite = dmThreads.find((t) => t.id === threadId)?.kind === "invite";
    if (remoteMode && userId && !isInvite) {
      await sendMessageRemote(threadId, userId, clean);
      await reloadRemote();
      return;
    }
    const msg: DMMessage = {
      id: uid(), threadId, senderHandle: profile.handle, senderId: profile.userId,
      text: clean, createdAt: Date.now(), readAt: Date.now(),
    };
    setDmMessages((prev) => [...prev, msg]);
  }, [dmThreads, profile.handle, profile.userId, remoteMode, userId, reloadRemote]);

  const sendDM = useCallback(
    (text: string) => { if (activeThreadId) void sendThreadMessage(activeThreadId, text); },
    [activeThreadId, sendThreadMessage]
  );

  const getThreadMessages = useCallback(
    (threadId: string) => dmMessages.filter((m) => m.threadId === threadId).sort((a, b) => a.createdAt - b.createdAt),
    [dmMessages]
  );

  const openReport = useCallback((target: ReportTarget) => { setReportTarget(target); setReportOpen(true); }, []);
  const closeReport = useCallback(() => { setReportOpen(false); setReportTarget(null); }, []);
  const submitReport = useCallback(async (reason: string) => {
    if (!reportTarget) return;
    if (remoteMode && userId) {
      await submitReportRemote(userId, reportTarget, reason);
    } else {
      const r: Report = {
        id: uid(), targetType: reportTarget.type, targetId: reportTarget.id,
        targetLabel: reportTarget.label, reason, reporterHandle: profile.handle,
        createdAt: Date.now(), status: "pending",
      };
      setReports((prev) => [...prev, r]);
    }
    closeReport();
    showToast("Reporte enviado. Gracias.", "success");
    track("Submit Report", { type: reportTarget.type });
  }, [reportTarget, profile.handle, closeReport, showToast, remoteMode, userId]);

  const blockUser = useCallback(async (handle: string) => {
    setBlockedHandles((prev) => [...new Set([...prev, handle])]);
    if (remoteMode && userId) {
      try {
        await blockUserRemote(userId, handle);
      } catch {
        showToast("No se pudo sincronizar el bloqueo", "error");
      }
    }
    showToast(`@${handle} bloqueado`, "info");
    track("Block User");
  }, [showToast, remoteMode, userId]);

  const markGoing = useCallback(async (parcheId: string) => {
    const going = goingEntries.some((g) => g.parcheId === parcheId && g.userHandle === profile.handle);
    if (going) {
      setGoingEntries((prev) => prev.filter((g) => !(g.parcheId === parcheId && g.userHandle === profile.handle)));
      setParches((prev) => prev.map((p) => p.id === parcheId ? { ...p, goingCount: Math.max(0, (p.goingCount ?? 0) - 1) } : p));
      if (remoteMode && userId) await toggleGoing(userId, parcheId, false);
      showToast("Ya no vas en camino", "info");
      return;
    }
    setGoingEntries((prev) => [...prev, { parcheId, userHandle: profile.handle }]);
    setParches((prev) => prev.map((p) => p.id === parcheId ? { ...p, goingCount: (p.goingCount ?? 0) + 1 } : p));
    if (remoteMode && userId) await toggleGoing(userId, parcheId, true);
    showToast("¡Vas en camino! 🚶", "success");
    track("Mark Going", { parcheId });
  }, [goingEntries, profile.handle, showToast, remoteMode, userId]);

  const markCheckedIn = useCallback(async (parcheId: string) => {
    const meId = profile.userId ?? profile.handle;
    const meAvatar: import("../lib/types").CheckInAvatar = {
      id: meId,
      name: profile.name,
      avatarUrl: profile.avatarUrl ?? profile.facePhotoUrl,
    };
    const checked = checkinIds.includes(parcheId);

    const patchParche = (p: import("../lib/types").Parche): import("../lib/types").Parche => {
      if (p.id !== parcheId) return p;
      if (checked) {
        return {
          ...p,
          attendeeCount: Math.max(0, p.attendeeCount - 1),
          checkInAvatars: (p.checkInAvatars ?? []).filter((a) => a.id !== meId),
        };
      }
      return {
        ...p,
        attendeeCount: p.attendeeCount + 1,
        checkInAvatars: [
          ...(p.checkInAvatars ?? []).filter((a) => a.id !== meId),
          meAvatar,
        ],
      };
    };

    if (checked) {
      setCheckinIds((prev) => prev.filter((id) => id !== parcheId));
      setParches((prev) => prev.map(patchParche));
      setSelectedParche((prev) => (prev ? patchParche(prev) : prev));
      if (remoteMode && userId) await toggleCheckin(userId, parcheId, false);
      showToast("Check-in cancelado", "info");
      return;
    }
    setCheckinIds((prev) => [...prev, parcheId]);
    setParches((prev) => prev.map(patchParche));
    setSelectedParche((prev) => (prev ? patchParche(prev) : prev));
    if (remoteMode && userId) await toggleCheckin(userId, parcheId, true);
    showToast("¡Llegaste al parche!", "success");
    track("Check In", { parcheId });
  }, [checkinIds, showToast, remoteMode, userId, profile]);

  const isCheckedIn = useCallback((parcheId: string) => checkinIds.includes(parcheId), [checkinIds]);

  const isGoing = useCallback(
    (parcheId: string) => goingEntries.some((g) => g.parcheId === parcheId && g.userHandle === profile.handle),
    [goingEntries, profile.handle]
  );

  const getGoingCount = useCallback(
    (parcheId: string) => parches.find((p) => p.id === parcheId)?.goingCount ?? 0,
    [parches]
  );

  const setMapFilters = useCallback((f: Partial<ContentFilters>) => {
    setMapFiltersState((prev) => ({ ...prev, ...f }));
    trackFilters("Filter Map", f);
  }, []);

  const setSpotFilters = useCallback((f: Partial<ContentFilters>) => {
    setSpotFiltersState((prev) => ({ ...prev, ...f }));
    trackFilters("Filter Spots", f);
  }, []);

  const enablePush = useCallback(async () => {
    const ok = await requestPushPermission();
    setPushEnabled(ok);
    if (ok) showToast("Notificaciones activadas", "success");
    else showToast("Permiso de notificaciones denegado", "error");
    return ok;
  }, [showToast]);

  const loginAdmin = useCallback((pin: string) => {
    if (profile.isAdmin) {
      setAdminAuthed(true);
      return true;
    }
    if (remoteMode) {
      showToast("Solo cuentas con is_admin en Supabase pueden moderar", "error");
      return false;
    }
    if (!isDemoAdminPinEnabled) {
      showToast("Admin demo deshabilitado", "error");
      return false;
    }
    const ok = pin === ADMIN_PIN;
    setAdminAuthed(ok);
    if (!ok) showToast("PIN incorrecto", "error");
    return ok;
  }, [showToast, remoteMode, profile.isAdmin]);

  const moderateHide = useCallback(async (type: ContentTargetType, id: string) => {
    if (remoteMode) await moderateHideRemote(type, id);
    if (type === "parche") setParches((prev) => prev.map((p) => p.id === id ? { ...p, hidden: true } : p));
    else setSpots((prev) => prev.map((s) => s.id === id ? { ...s, hidden: true } : s));
    showToast("Contenido oculto", "success");
  }, [showToast, remoteMode]);

  const moderateDismissReport = useCallback(async (id: string) => {
    if (remoteMode) await moderateDismissReportRemote(id);
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: "dismissed" as const } : r));
  }, [remoteMode]);

  const banUser = useCallback(async (targetUserId: string) => {
    if (remoteMode) await banUserRemote(targetUserId);
    showToast("Usuario baneado", "success");
  }, [remoteMode, showToast]);

  const unbanUser = useCallback(async (targetUserId: string) => {
    if (remoteMode) await unbanUserRemote(targetUserId);
    showToast("Usuario desbaneado", "success");
  }, [remoteMode, showToast]);

  const deleteAccount = useCallback(async () => {
    if (!remoteMode) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(INVITES_STORAGE_KEY);
      setOnboardingDone(false);
      setProfile(defaultProfile);
      showToast("Datos locales borrados", "success");
      return;
    }
    await deleteOwnAccountRemote();
    showToast("Cuenta eliminada", "success");
  }, [remoteMode, showToast]);

  const exportMyData = useCallback(async () => {
    if (!remoteMode || !userId) {
      const blob = new Blob(
        [JSON.stringify({ profile, parches: userParches, spots: userSpots, exportedAt: new Date().toISOString() }, null, 2)],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "parchexbogota-mis-datos.json";
      a.click();
      URL.revokeObjectURL(url);
      showToast("Datos locales exportados", "success");
      return;
    }
    const data = await exportMyDataRemote(userId);
    if (!data) {
      showToast("No se pudo exportar", "error");
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `parchexbogota-${profile.handle}-datos.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exportación lista (ARCO)", "success");
  }, [remoteMode, userId, profile, userParches, userSpots, showToast]);

  const offlineQueueCount = getOfflineQueue().length;

  const value: ParcheContextValue = {
    onboardingDone, tab, parches, userParches, spots, userSpots,
    savedSpotIds, discardedSpotIds, profile, userLocation,
    comments, dmThreads, dmMessages, reports, blockedHandles,
    goingEntries, pushEnabled, mapFilters, spotFilters,
    activeParches, filteredParches, selectedParche, selectedSpot,
    createOpen, createSpotOpen, editProfileOpen, editParcheId,
    detailOpen, spotDetailOpen, activeThreadId,
    inviteRequests, inviteTarget, peerProfile, pendingInviteCount,
    reportOpen, reportTarget, shareOpen, shareTarget,
    legalOpen, adminOpen, adminAuthed, identityOpen, editSpotId, remoteMode, checkinIds, unreadDmCount, toast,
    deckSpots, filteredDeckSpots, savedSpots, discardedSpots,
    offlineQueueCount,
    setTab, completeOnboarding, finishOnboarding,
    updateProfile, verifyProfile, openEditProfile, closeEditProfile: () => setEditProfileOpen(false),
    selectParche, selectSpot, openCreate, closeCreate, openEditParche,
    openCreateSpot, closeCreateSpot, openEditSpot, closeDetail, closeSpotDetail,
    publishParche, updateParche, deleteParche, publishSpot, updateSpot, deleteSpot,
    swipeSpot, unsaveSpot, resaveSpot, restoreSpot, resetSpotDeck,
    addComment, getComments, openDM, closeThread, sendDM, sendThreadMessage, getThreadMessages,
    getPeerInfo, isHostOf, canViewPrivate, getMyInvite,
    openInviteRequest, closeInviteRequest, requestInvite, decideInvite,
    openPeerProfile, closePeerProfile,
    openInbox: () => { setTab("messages"); setActiveThreadId(null); },
    openIdentity: () => setIdentityOpen(true), closeIdentity: () => setIdentityOpen(false),
    openDMThread,
    openReport, closeReport, submitReport, blockUser,
    openShare: (t) => { setShareTarget(t); setShareOpen(true); },
    closeShare: () => { setShareOpen(false); setShareTarget(null); },
    markGoing, isGoing, getGoingCount, markCheckedIn, isCheckedIn,
    setMapFilters, setSpotFilters, enablePush,
    openLegal: setLegalOpen, closeLegal: () => setLegalOpen(null),
    openAdmin: () => setAdminOpen(true), closeAdmin: () => { setAdminOpen(false); setAdminAuthed(false); },
    loginAdmin, moderateHide, moderateDismissReport, banUser, unbanUser, deleteAccount, exportMyData,
    refreshLocation, showToast, sortedParches,
  };

  return <ParcheContext.Provider value={value}>{children}</ParcheContext.Provider>;
}

export function useParche() {
  const ctx = useContext(ParcheContext);
  if (!ctx) throw new Error("useParche must be used within ParcheProvider");
  return ctx;
}
