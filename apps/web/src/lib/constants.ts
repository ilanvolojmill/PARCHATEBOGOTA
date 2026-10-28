import type { ParcheVibe } from "./types";

export const STORAGE_KEY = "parchexbogota-state-v4";

export const BOGOTA_CENTER = { lat: 4.6097, lng: -74.0721 } as const;

export const BOGOTA_BOUNDS = {
  minLat: 4.47,
  maxLat: 4.83,
  minLng: -74.22,
  maxLng: -73.99,
} as const;

export const PARCHE_TTL_MS = 8 * 60 * 60 * 1000;

export const NEIGHBORHOODS = [
  "all",
  "Chapinero",
  "Usaquén",
  "La Candelaria",
  "Zona T",
  "Teusaquillo",
  "La Macarena",
  "Quinta Camacho",
  "San Felipe",
  "Ciudad Bolívar",
] as const;

export const DISTANCE_OPTIONS = [
  { label: "Todos", km: null },
  { label: "1 km", km: 1 },
  { label: "3 km", km: 3 },
  { label: "5 km", km: 5 },
  { label: "10 km", km: 10 },
] as const;

export const REPORT_REASONS = [
  "Contenido falso o engañoso",
  "Lugar peligroso",
  "Acoso o comportamiento inapropiado",
  "Spam o publicidad",
  "Otro",
] as const;

export const DEFAULT_FILTERS = {
  vibe: "all" as const,
  maxDistanceKm: null,
  neighborhood: "all" as const,
};

/** Orden único de categorías (filtros del mapa, Spots y formularios de publicar). */
export const VIBE_ORDER: ParcheVibe[] = [
  "rumba",
  "rooftop",
  "after",
  "cultural",
  "picnic",
  "pre",
  "chill",
  "formal",
  "foodies",
];

export const VIBE_LABELS: Record<ParcheVibe, string> = {
  rumba: "Rumba",
  rooftop: "Rooftop",
  after: "After",
  cultural: "Cultural",
  picnic: "Picnic",
  pre: "Pre",
  chill: "Chill",
  formal: "Formal",
  foodies: "Foodies",
};

export const VIBE_EMOJI: Record<ParcheVibe, string> = {
  rumba: "R",
  rooftop: "T",
  after: "A",
  cultural: "C",
  picnic: "P",
  pre: "Pr",
  chill: "Ch",
  formal: "F",
  foodies: "Fo",
};

export const VIBE_COLORS: Record<ParcheVibe, string> = {
  rumba: "#9b4545",
  rooftop: "#8a7a3a",
  after: "#7a4545",
  cultural: "#6a5e38",
  picnic: "#3d5f4a",
  pre: "#6a4a82",
  chill: "#2f6670",
  formal: "#3b4260",
  foodies: "#8a4f1d",
};

export const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN ?? "";
