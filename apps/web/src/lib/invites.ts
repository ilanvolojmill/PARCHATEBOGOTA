import type {
  Coords,
  DMMessage,
  DMThread,
  InviteRequest,
  InviteStatus,
  PeerInfo,
} from "./types";

/** Máximo de palabras del mensaje que acompaña una solicitud de invitación. */
export const MAX_INVITE_WORDS = 20;
/** Tope de caracteres del campo (evita pegar textos enormes; el límite real es por palabras). */
export const MAX_INVITE_CHARS = 300;

export const INVITES_STORAGE_KEY = "parchexbogota-invites-v1";

/** Remitente de los avisos automáticos dentro de una conversación. */
export const SYSTEM_HANDLE = "sistema";

/** Id del parche demo (privado) que pertenece al usuario actual en modo local. */
export const DEMO_OWN_PARCHE_ID = "demo-own-private";

export function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

export const INVITE_STATUS_LABEL: Record<InviteStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  denied: "Denegada",
};

/** Usuarios ficticios (solo modo demo local). */
export const DEMO_PEOPLE: PeerInfo[] = [
  {
    handle: "valen.rojas",
    name: "Valentina Rojas",
    avatarUrl: "https://i.pravatar.cc/120?u=valentina-rojas",
    bio: "Diseñadora. Me gustan los rooftops, la música electrónica y los planes con buena gente.",
    verified: true,
  },
  {
    handle: "sofi.nocturna",
    name: "Sofía Mejía",
    avatarUrl: "https://i.pravatar.cc/120?u=sofia-mejia",
    bio: "Nueva en Bogotá, buscando parche para el viernes.",
    verified: false,
  },
  {
    handle: "camilo.bog",
    name: "Camilo Duarte",
    avatarUrl: "https://i.pravatar.cc/120?u=camilo-duarte",
    bio: "Ingeniería en la Nacho. Siempre llevo el parlante y los snacks.",
    verified: true,
  },
  {
    handle: "dani.chapi",
    name: "Daniela Pardo",
    avatarUrl: "https://i.pravatar.cc/120?u=daniela-pardo",
    bio: "Fotógrafa de eventos. Cuento historias de la ciudad en cada plan.",
    verified: true,
  },
];

export function findDemoPerson(handle: string): PeerInfo | undefined {
  return DEMO_PEOPLE.find((p) => p.handle === handle);
}

/** Anfitriones ficticios que "responden" solos a una solicitud (para poder probar el flujo). */
export const DEMO_HOST_DECISIONS: Record<string, InviteStatus> = {
  "marco.cand": "accepted",
  "lux.zt": "denied",
};
export const DEMO_DECISION_DELAY_MS = 6000;

/**
 * Ubicación aproximada para planes por invitación: se ajusta a una cuadrícula de ~550 m
 * para no revelar el punto exacto hasta que el anfitrión acepte.
 */
export function approxCoords(c: Coords): Coords {
  const step = 0.005;
  return {
    lat: Math.round(c.lat / step) * step,
    lng: Math.round(c.lng / step) * step,
  };
}

export interface InviteStore {
  requests: InviteRequest[];
  threads: DMThread[];
  messages: DMMessage[];
}

export function loadInviteStore(): InviteStore {
  try {
    const raw = localStorage.getItem(INVITES_STORAGE_KEY);
    if (!raw) return { requests: [], threads: [], messages: [] };
    const parsed = JSON.parse(raw) as Partial<InviteStore>;
    return {
      requests: parsed.requests ?? [],
      threads: parsed.threads ?? [],
      messages: parsed.messages ?? [],
    };
  } catch {
    return { requests: [], threads: [], messages: [] };
  }
}

export function saveInviteStore(store: InviteStore) {
  try {
    localStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(store));
  } catch { /* quota */ }
}

/** Datos demo: solicitudes entrantes para el parche privado propio del usuario. */
export function buildDemoIncoming(
  myHandle: string,
  targetId: string,
  targetTitle: string
): { requests: InviteRequest[]; threads: DMThread[]; messages: DMMessage[] } {
  const now = Date.now();
  const seeds = [
    {
      id: "demo-inv-1",
      person: DEMO_PEOPLE[0],
      message: "Hola! Voy con dos amigas y llevamos trago para compartir. Gracias por considerarnos.",
      ago: 14 * 60000,
    },
    {
      id: "demo-inv-2",
      person: DEMO_PEOPLE[1],
      message: "Hola, soy nueva en la ciudad y me encantaría conocer gente. Prometo buena vibra.",
      ago: 5 * 60000,
    },
  ];
  const requests: InviteRequest[] = [];
  const threads: DMThread[] = [];
  const messages: DMMessage[] = [];
  for (const s of seeds) {
    const threadId = `${s.id}-thread`;
    const createdAt = now - s.ago;
    requests.push({
      id: s.id,
      targetType: "parche",
      targetId,
      targetTitle,
      hostHandle: myHandle,
      requester: s.person,
      message: s.message,
      status: "pending",
      createdAt,
      threadId,
    });
    threads.push({
      id: threadId,
      kind: "invite",
      inviteId: s.id,
      parcheId: targetId,
      hostHandle: myHandle,
      guestHandle: s.person.handle,
      title: targetTitle,
      createdAt,
    });
    messages.push({
      id: `${s.id}-msg`,
      threadId,
      senderHandle: s.person.handle,
      text: s.message,
      createdAt,
      kind: "invite_request",
      inviteId: s.id,
    });
  }
  return { requests, threads, messages };
}
