import { useState } from "react";
import { useParche } from "../context/ParcheContext";
import { SwipeCard } from "../components/SwipeCard";
import { FilterBar } from "../components/FilterBar";
import { Icons } from "../components/Icons";
import { InviteRequestButton } from "../components/InviteRequestButton";
import { HomeAd } from "../components/HomeAd";
import { VibeBackdrop } from "../components/VibeBackdrop";

export function SpotsScreen() {
  const {
    filteredDeckSpots,
    swipeSpot,
    openCreateSpot,
    savedSpots,
    discardedSpots,
    restoreSpot,
    resetSpotDeck,
    spotFilters,
    setSpotFilters,
    selectSpot,
  } = useParche();

  const [showDiscarded, setShowDiscarded] = useState(false);
  const topSpot = filteredDeckSpots[0];
  const nextSpot = filteredDeckSpots[1];

  if (showDiscarded) {
    return (
      <div className="spots-screen">
        <header className="spots-header">
          <div>
            <h2>Descartados</h2>
            <p className="spots-sub">{discardedSpots.length} spots — recupera los que quieras</p>
          </div>
          <button type="button" className="text-btn" onClick={() => setShowDiscarded(false)}>Volver</button>
        </header>
        <ul className="discarded-list">
          {discardedSpots.length === 0 && <li className="comments-empty">No hay spots descartados</li>}
          {discardedSpots.map((s) => (
            <li key={s.id} className="discarded-item">
              <img src={s.photoUrl} alt="" />
              <article>
                <strong>{s.title}</strong>
                <span>{s.neighborhood}</span>
              </article>
              <button type="button" className="btn btn-secondary compact" onClick={() => restoreSpot(s.id)}>
                Recuperar
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="spots-screen">
      <HomeAd side="left" />
      <div className="spots-main">
      <header className="spots-header">
        <div>
          <h2>Spots</h2>
          <p className="spots-sub">Desliza para descubrir lugares en Bogotá</p>
        </div>
        {discardedSpots.length > 0 && (
          <button type="button" className="text-btn spots-discarded-link" onClick={() => setShowDiscarded(true)}>
            Descartados ({discardedSpots.length})
          </button>
        )}
      </header>

      <FilterBar filters={spotFilters} onChange={setSpotFilters} />

      <div className="spots-stage">
      <VibeBackdrop active={spotFilters.vibe} />
      <div className="swipe-deck">
        {filteredDeckSpots.length === 0 ? (
          <div className="swipe-empty">
            <span className="swipe-empty-icon" aria-hidden>
              <Icons.Spots />
            </span>
            <h3>No hay más spots</h3>
            <p>
              {savedSpots.length > 0
                ? `Tienes ${savedSpots.length} guardados. Revísalos en tu perfil.`
                : "Ajusta filtros, sube un spot o reinicia el mazo."}
            </p>
            <button type="button" className="btn btn-primary" onClick={resetSpotDeck}>Reiniciar mazo</button>
            <button type="button" className="btn btn-secondary" onClick={openCreateSpot}>Subir un spot</button>
          </div>
        ) : (
          <>
            {nextSpot && (
              <SwipeCard key={nextSpot.id} spot={nextSpot} onSwipeLeft={() => {}} onSwipeRight={() => {}} isTop={false} />
            )}
            {topSpot && (
              <SwipeCard
                key={topSpot.id}
                spot={topSpot}
                onSwipeLeft={() => swipeSpot(topSpot.id, "left")}
                onSwipeRight={() => swipeSpot(topSpot.id, "right")}
                isTop
              />
            )}
          </>
        )}
      </div>

      {topSpot?.inviteOnly && (
        <div className="spots-invite-row">
          <InviteRequestButton targetType="spot" targetId={topSpot.id} />
        </div>
      )}

      {filteredDeckSpots.length > 0 && (
        <div className="swipe-actions">
          <button type="button" className="swipe-btn swipe-btn-nope" aria-label="Descartar" onClick={() => topSpot && swipeSpot(topSpot.id, "left")}>
            <Icons.X />
          </button>
          <button type="button" className="swipe-btn swipe-btn-info" aria-label="Más info" onClick={() => topSpot && selectSpot(topSpot)}>
            <Icons.List />
          </button>
          <button type="button" className="swipe-btn swipe-btn-save" aria-label="Guardar spot" onClick={() => topSpot && swipeSpot(topSpot.id, "right")}>
            <Icons.Heart />
          </button>
        </div>
      )}

      <div className="spots-hint">
        <span>← Descartar</span>
        <span>Guardar →</span>
      </div>
      </div>
      </div>
      <HomeAd side="right" />
    </div>
  );
}
