import { useState } from "react";
import { useParche } from "../context/ParcheContext";
import { MapView } from "../components/MapView";
import { FilterBar } from "../components/FilterBar";
import { Icons } from "../components/Icons";
import { HomeAd } from "../components/HomeAd";
import { GuestNotice } from "../components/GuestNotice";
import { useAuth } from "../context/AuthContext";
import { approxCoords } from "../lib/invites";
import type { Coords } from "../lib/types";

export function MapScreen() {
  const {
    filteredParches,
    userLocation,
    selectedParche,
    selectParche,
    refreshLocation,
    mapFilters,
    setMapFilters,
    canViewPrivate,
  } = useParche();

  const { isGuest } = useAuth();
  const [cameraTarget, setCameraTarget] = useState<Coords | null>(null);

  return (
    <section className={`map-screen ${isGuest ? "is-guest" : ""}`}>
      <HomeAd side="left" />
      <section className="home-intro" aria-label="Bienvenida">
        <div className="home-intro-copy">
          <p className="home-kicker">Bogotá</p>
          <h1>Todos los parches de Bogotá en un solo lugar.</h1>
          <p className="home-lead">
            Parcháte Bogotá reúne lo que está pasando en la ciudad: quién publicó el plan,
            quién ya llegó y cómo encontrarlo sin perderte entre chats.
          </p>
          {isGuest && <GuestNotice variant="intro" />}
        </div>
        <ul className="home-points">
          <li>
            <span>01</span>
            <div>
              <strong>Mapa</strong>
              <p>Parches activos sobre Bogotá. Filtra por tipo y mira el punto antes de salir.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Spots</strong>
              <p>Lugares para guardar y volver: el sitio queda, el plan cambia.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Llegué</strong>
              <p>Cuando marcas que estás ahí, tu foto aparece junto al parche.</p>
            </div>
          </li>
          <li>
            <span>04</span>
            <div>
              <strong>Mensajes</strong>
              <p>Escribes a quien publicó, desde el mismo parche.</p>
            </div>
          </li>
        </ul>
      </section>
      <div className="home-map">
        <MapView
          parches={filteredParches}
          userLocation={userLocation}
          selectedId={selectedParche?.id}
          isRevealed={(p) => canViewPrivate("parche", p.id)}
          onSelect={(p) => {
            if (isGuest) return; // visitante: los planes no se pueden abrir
            selectParche(p);
            setCameraTarget(
              p.inviteOnly && !canViewPrivate("parche", p.id) ? approxCoords(p.coords) : p.coords
            );
          }}
          flyTo={cameraTarget}
        />
        <header className="map-overlay-top">
          <FilterBar filters={mapFilters} onChange={setMapFilters} />
        </header>
        {isGuest && <GuestNotice variant="map" />}
        <button type="button" className="locate-fab" onClick={refreshLocation} aria-label="Centrar en mi ubicación">
          <Icons.Crosshair />
        </button>
      </div>
      <HomeAd side="right" />
    </section>
  );
}