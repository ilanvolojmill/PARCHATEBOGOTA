import { describe, expect, it } from "vitest";
import { applyParcheFilters, applySpotFilters, matchesNeighborhood } from "./filters";
import type { Parche, Spot } from "./types";

const baseParche: Parche = {
  id: "p1",
  title: "Test",
  description: "d",
  photoUrl: "x",
  coords: { lat: 4.65, lng: -74.06 },
  vibe: "rumba",
  hostName: "host.bog",
  createdAt: Date.now(),
  expiresAt: Date.now() + 3600000,
  attendeeCount: 1,
};

const baseSpot: Spot = {
  id: "s1",
  title: "Spot",
  description: "d",
  photoUrl: "x",
  coords: { lat: 4.65, lng: -74.06 },
  neighborhood: "Chapinero",
  vibe: "rooftop",
  hostName: "host.bog",
  createdAt: Date.now(),
};

describe("filters", () => {
  it("filtra parches por vibra", () => {
    const result = applyParcheFilters(
      [baseParche],
      { vibe: "cultural", maxDistanceKm: null, neighborhood: "all" },
      null,
      []
    );
    expect(result).toHaveLength(0);
  });

  it("excluye usuarios bloqueados", () => {
    const result = applySpotFilters(
      [baseSpot],
      { vibe: "all", maxDistanceKm: null, neighborhood: "all" },
      null,
      ["host.bog"]
    );
    expect(result).toHaveLength(0);
  });

  it("filtra spots por barrio", () => {
    const result = applySpotFilters(
      [baseSpot],
      { vibe: "all", maxDistanceKm: null, neighborhood: "Usaquén" },
      null,
      []
    );
    expect(result).toHaveLength(0);
  });

  it("matchesNeighborhood flexible", () => {
    expect(matchesNeighborhood("Chapinero", "Chapinero Alto", "Chapinero")).toBe(true);
    expect(matchesNeighborhood(undefined, "Usaquén", "Usaquén")).toBe(true);
  });
});
