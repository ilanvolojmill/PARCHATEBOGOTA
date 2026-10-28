import { BOGOTA_BOUNDS } from "./constants";
import type { Coords } from "./types";

export function isInBogota({ lat, lng }: Coords): boolean {
  return (
    lat >= BOGOTA_BOUNDS.minLat &&
    lat <= BOGOTA_BOUNDS.maxLat &&
    lng >= BOGOTA_BOUNDS.minLng &&
    lng <= BOGOTA_BOUNDS.maxLng
  );
}

export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  return `Hace ${Math.floor(hrs / 24)} d`;
}

export function formatExpiresIn(expiresAt: number): string {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expirado";
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs > 0) return `${hrs}h ${mins}m restantes`;
  return `${mins} min restantes`;
}

export function getDirectionsUrl(coords: Coords): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
}

export function getWazeUrl(coords: Coords): string {
  return `https://waze.com/ul?ll=${coords.lat},${coords.lng}&navigate=yes`;
}

export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function requestUserLocation(): Promise<Coords> {
  try {
    const { getNativeLocation } = await import("./native");
    const native = await getNativeLocation();
    if (native) return native;
  } catch { /* web fallback */ }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalización no disponible"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("No pudimos obtener tu ubicación")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  });
}
