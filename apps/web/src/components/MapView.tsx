import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { BOGOTA_CENTER, VIBE_COLORS, VIBE_EMOJI, VIBE_LABELS } from "../lib/constants";
import { approxCoords } from "../lib/invites";
import type { CheckInAvatar, Coords, Parche } from "../lib/types";

/** Zoom inicial: Bogotá bien grande, sin animación rara */
const INITIAL_ZOOM = 13;
const MAX_AVATARS = 3;

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function avatarHtml(person: CheckInAvatar, selected: boolean): string {
  const sizeClass = selected ? "is-large" : "";
  const label = escapeAttr(person.name);
  const frame = `parche-checkin-frame ${sizeClass}`;
  if (person.avatarUrl) {
    return `<span class="${frame}" title="${label}"><img class="parche-checkin-img" src="${escapeAttr(person.avatarUrl)}" alt="" draggable="false" /></span>`;
  }
  const initial = escapeAttr((person.name.trim()[0] || "?").toUpperCase());
  return `<span class="${frame} placeholder ${sizeClass}" title="${label}" aria-hidden>${initial}</span>`;
}

const LOCK_SVG =
  '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="11" width="15" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

function createParcheIcon(
  vibe: Parche["vibe"],
  isSelected: boolean,
  checkIns: CheckInAvatar[] = [],
  inviteOnly = false
) {
  const color = VIBE_COLORS[vibe];
  const mark = VIBE_EMOJI[vibe];
  const size = isSelected ? 46 : 34;
  const shown = checkIns.slice(0, MAX_AVATARS);
  const extra = checkIns.length - shown.length;
  const avatarW = isSelected ? 32 : 22;
  const stackW = shown.length > 0
    ? shown.length * (avatarW * 0.72) + avatarW * 0.4 + (extra > 0 ? 18 : 0)
    : 0;
  const totalW = size + (stackW > 0 ? 6 + stackW : 0);
  const totalH = Math.max(size, isSelected ? 36 : 26);

  const avatarsBlock = shown.length
    ? `<div class="parche-checkins" aria-hidden>
        ${shown.map((p) => avatarHtml(p, isSelected)).join("")}
        ${extra > 0 ? `<span class="parche-checkin-more ${isSelected ? "is-large" : ""}">+${extra}</span>` : ""}
      </div>`
    : "";

  return L.divIcon({
    className: "parche-marker-wrap",
    html: `<div class="parche-marker-cluster ${isSelected ? "selected" : ""}">
      <div class="parche-marker ${isSelected ? "selected" : ""}" style="--marker-color:${color};width:${size}px;height:${size}px">
        <span class="parche-marker-emoji">${mark}</span>
        ${inviteOnly ? `<span class="parche-marker-lock" aria-hidden="true">${LOCK_SVG}</span>` : ""}
        ${isSelected ? "" : '<span class="parche-marker-pulse"></span>'}
      </div>
      ${avatarsBlock}
    </div>`,
    iconSize: [totalW, totalH],
    iconAnchor: [size / 2, totalH / 2],
    popupAnchor: [0, -totalH / 2],
  });
}

function createUserIcon() {
  return L.divIcon({
    className: "user-marker-wrap",
    html: `<div class="user-marker"><span class="user-marker-dot"></span></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

/** Recalcula tamaño cuando el contenedor ya tiene altura (móvil / splash). */
function MapInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const run = () => map.invalidateSize({ animate: false });
    run();
    const delays = [80, 250, 600, 1200, 2000].map((ms) => window.setTimeout(run, ms));
    window.addEventListener("resize", run);
    window.addEventListener("orientationchange", run);
    const container = map.getContainer();
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => run())
        : null;
    ro?.observe(container);
    const parent = container.parentElement;
    if (parent) ro?.observe(parent);
    return () => {
      delays.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("resize", run);
      window.removeEventListener("orientationchange", run);
      ro?.disconnect();
    };
  }, [map]);
  return null;
}

/** Solo mueve la cámara cuando el usuario elige un parche (no al montar). */
function MapController({ center }: { center?: Coords | null }) {
  const map = useMap();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!center) return;
    const key = `${center.lat.toFixed(5)},${center.lng.toFixed(5)}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    map.setView([center.lat, center.lng], 15, { animate: false });
  }, [center, map]);

  return null;
}

interface MapViewProps {
  parches: Parche[];
  userLocation: Coords | null;
  selectedId?: string | null;
  onSelect: (parche: Parche) => void;
  flyTo?: Coords | null;
  /** Para planes por invitación: true si ya se puede ver el punto exacto. */
  isRevealed?: (parche: Parche) => boolean;
}

export function MapView({
  parches,
  userLocation,
  selectedId,
  onSelect,
  flyTo,
  isRevealed,
}: MapViewProps) {
  return (
    <MapContainer
      center={[BOGOTA_CENTER.lat, BOGOTA_CENTER.lng]}
      zoom={INITIAL_ZOOM}
      minZoom={11}
      maxZoom={18}
      className="map-container"
      zoomControl={false}
      attributionControl={true}
      zoomAnimation={false}
      fadeAnimation={false}
      markerZoomAnimation={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <MapInvalidateSize />
      <MapController center={flyTo} />
      {parches.map((p) => {
        const hidden = !!p.inviteOnly && !(isRevealed?.(p) ?? false);
        const pos = hidden ? approxCoords(p.coords) : p.coords;
        const checkIns = hidden ? [] : (p.checkInAvatars ?? []);
        return (
          <Marker
            key={`${p.id}-${checkIns.length}-${p.id === selectedId ? "s" : "u"}-${hidden ? "h" : "v"}`}
            position={[pos.lat, pos.lng]}
            icon={createParcheIcon(p.vibe, p.id === selectedId, checkIns, !!p.inviteOnly)}
            eventHandlers={{ click: () => onSelect(p) }}
            zIndexOffset={p.id === selectedId ? 800 : (checkIns.length ? 200 : 0)}
          >
            <Popup className="map-popup">
              <strong>{p.title}</strong>
              <span>{VIBE_LABELS[p.vibe]}</span>
              {p.inviteOnly && <span className="map-popup-invite">Por invitación · zona aproximada</span>}
              {checkIns.length > 0 && (
                <span className="map-popup-checkins">
                  {checkIns.length} en el parche
                </span>
              )}
            </Popup>
          </Marker>
        );
      })}
      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={createUserIcon()}
        />
      )}
    </MapContainer>
  );
}
