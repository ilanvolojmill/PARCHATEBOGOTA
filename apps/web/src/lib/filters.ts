import type { ContentFilters, Parche, Spot } from "./types";
import type { Coords } from "./types";
import { haversineKm } from "./geo";

export function matchesNeighborhood(
  neighborhood: string | undefined,
  address: string | undefined,
  filter: string
): boolean {
  if (filter === "all") return true;
  const hay = `${neighborhood ?? ""} ${address ?? ""}`.toLowerCase();
  return hay.includes(filter.toLowerCase());
}

export function applyParcheFilters(
  parches: Parche[],
  filters: ContentFilters,
  userLocation: Coords | null,
  blockedHandles: string[]
): Parche[] {
  return parches.filter((p) => {
    if (p.hidden) return false;
    if (blockedHandles.includes(p.hostName)) return false;
    if (filters.vibe !== "all" && p.vibe !== filters.vibe) return false;
    if (!matchesNeighborhood(p.neighborhood, p.address, filters.neighborhood)) return false;
    if (filters.maxDistanceKm != null && userLocation) {
      if (haversineKm(userLocation, p.coords) > filters.maxDistanceKm) return false;
    }
    return true;
  });
}

export function applySpotFilters(
  spots: Spot[],
  filters: ContentFilters,
  userLocation: Coords | null,
  blockedHandles: string[]
): Spot[] {
  return spots.filter((s) => {
    if (s.hidden) return false;
    if (blockedHandles.includes(s.hostName)) return false;
    if (filters.vibe !== "all" && s.vibe !== filters.vibe) return false;
    if (!matchesNeighborhood(s.neighborhood, s.neighborhood, filters.neighborhood)) return false;
    if (filters.maxDistanceKm != null && userLocation) {
      if (haversineKm(userLocation, s.coords) > filters.maxDistanceKm) return false;
    }
    return true;
  });
}
