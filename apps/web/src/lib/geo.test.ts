import { describe, expect, it } from "vitest";
import { isInBogota, haversineKm, formatDistance } from "./geo";

describe("geo", () => {
  it("detecta coordenadas dentro de Bogotá", () => {
    expect(isInBogota({ lat: 4.6097, lng: -74.0721 })).toBe(true);
  });

  it("rechaza coordenadas fuera de Bogotá", () => {
    expect(isInBogota({ lat: 6.25, lng: -75.56 })).toBe(false);
  });

  it("calcula distancia en km", () => {
    const km = haversineKm(
      { lat: 4.6097, lng: -74.0721 },
      { lat: 4.6486, lng: -74.0628 }
    );
    expect(km).toBeGreaterThan(3);
    expect(km).toBeLessThan(6);
  });

  it("formatea metros cuando es menos de 1 km", () => {
    expect(formatDistance(0.4)).toBe("400 m");
  });
});
