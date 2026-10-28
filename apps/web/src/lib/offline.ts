import type { ParcheVibe } from "./types";

const OFFLINE_KEY = "parchexbogota-offline-queue";
const MAX_ATTEMPTS = 5;
const MAX_QUEUE = 40;

export interface OfflineAction {
  id: string;
  type: "publish_parche" | "publish_spot" | "comment" | "going" | "checkin";
  payload: Record<string, unknown>;
  createdAt: number;
  attempts?: number;
}

export function queueOfflineAction(action: Omit<OfflineAction, "id" | "createdAt">) {
  try {
    const list = getOfflineQueue();
    if (list.length >= MAX_QUEUE) {
      list.shift();
    }
    // No guardar data URLs enormes en cola (solo metadatos + flag)
    const payload = { ...action.payload };
    if (typeof payload.photoUrl === "string" && payload.photoUrl.startsWith("data:")) {
      payload.photoUrl = payload.photoUrl.slice(0, 48) + "…[pendiente re-captura]";
      payload._needsPhoto = true;
    }
    list.push({ ...action, payload, id: `${Date.now()}`, createdAt: Date.now(), attempts: 0 });
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(list));
  } catch { /* noop */ }
}

export function getOfflineQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem(OFFLINE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearOfflineQueue() {
  localStorage.removeItem(OFFLINE_KEY);
}

export function bumpAttempt(action: OfflineAction): OfflineAction | null {
  const attempts = (action.attempts ?? 0) + 1;
  if (attempts >= MAX_ATTEMPTS) return null;
  return { ...action, attempts };
}

export function inferNeighborhood(address?: string, lat?: number, lng?: number): string | undefined {
  if (!address) return undefined;
  const a = address.toLowerCase();
  const map: [string, string][] = [
    ["chapinero", "Chapinero"],
    ["usaquén", "Usaquén"],
    ["usaquen", "Usaquén"],
    ["candelaria", "La Candelaria"],
    ["zona t", "Zona T"],
    ["teusaquillo", "Teusaquillo"],
    ["macarena", "La Macarena"],
    ["quinta camacho", "Quinta Camacho"],
    ["san felipe", "San Felipe"],
    ["ciudad bolívar", "Ciudad Bolívar"],
    ["ciudad bolivar", "Ciudad Bolívar"],
    ["93", "Zona T"],
  ];
  for (const [key, hood] of map) {
    if (a.includes(key)) return hood;
  }
  void lat;
  void lng;
  return undefined;
}

export type { ParcheVibe };
