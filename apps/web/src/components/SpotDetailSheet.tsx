import { useParche } from "../context/ParcheContext";
import { VIBE_COLORS, VIBE_LABELS } from "../lib/constants";
import { getDirectionsUrl, getWazeUrl } from "../lib/geo";
import { SheetShell } from "./SheetShell";
import { CommentsSection } from "./CommentsSection";
import { Icons } from "./Icons";
import { VerifiedBadge } from "./VerifiedBadge";
import { InviteBadge } from "./InviteBadge";
import { InviteRequestButton } from "./InviteRequestButton";
import { formatWhatsAppDisplay, whatsAppChatUrl } from "../lib/share";

export function SpotDetailSheet() {
  const {
    selectedSpot, spotDetailOpen, closeSpotDetail, userSpots,
    openDM, openReport, openShare, blockUser, deleteSpot, openEditSpot, profile,
    canViewPrivate, isHostOf, inviteRequests, openInbox,
  } = useParche();

  if (!spotDetailOpen || !selectedSpot) return null;
  const s = selectedSpot;
  const isOwner = userSpots.includes(s.id);
  const isHost = isHostOf("spot", s.id);
  const locked = !!s.inviteOnly && !canViewPrivate("spot", s.id);
  const pendingForMe = isHost
    ? inviteRequests.filter((r) => r.targetId === s.id && r.status === "pending" && r.hostHandle === profile.handle).length
    : 0;

  return (
    <SheetShell onClose={closeSpotDetail} labelledBy="spot-sheet-title" className="parche-sheet">
        <button type="button" className="sheet-close" onClick={closeSpotDetail} aria-label="Cerrar">
          <Icons.Close />
        </button>
        <figure className="parche-sheet-photo">
          <img src={s.photoUrl} alt="" />
          <span className="vibe-badge" style={{ background: VIBE_COLORS[s.vibe] }}>
            {VIBE_LABELS[s.vibe]}
          </span>
          {s.inviteOnly && <InviteBadge className="invite-badge-photo" />}
        </figure>
        <div className="parche-sheet-body">
          <h2 id="spot-sheet-title">{s.title}</h2>
          {s.inviteOnly && (
            <p className="invite-note">
              <Icons.Lock />
              {isHost
                ? "Tu spot es por invitación: tú decides quién entra."
                : locked
                  ? "Spot por invitación: pide entrar y el anfitrión decide."
                  : "Spot por invitación: ya tienes acceso."}
            </p>
          )}
          <p className="parche-desc">{s.description}</p>
          <p className="swipe-neighborhood">
            {locked ? `Zona aproximada: ${s.neighborhood}, Bogotá` : `${s.neighborhood}, Bogotá`}
          </p>
          <p className="host-name host-name-row">
            @{s.hostName} {s.hostVerified && <VerifiedBadge size="sm" />}
          </p>

          {s.inviteOnly && !isHost && <InviteRequestButton targetType="spot" targetId={s.id} />}
          {s.inviteOnly && isHost && (
            <button type="button" className="btn btn-secondary btn-full" onClick={() => { closeSpotDetail(); openInbox(); }}>
              <Icons.Send /> Ver solicitudes{pendingForMe > 0 ? ` (${pendingForMe} pendientes)` : ""}
            </button>
          )}
          {locked && (
            <section className="invite-locked" aria-label="Información reservada">
              <Icons.Lock />
              <div>
                <h3>Ubicación exacta y contacto reservados</h3>
                <p>
                  Se muestran cuando @{s.hostName} acepte tu solicitud. Mientras tanto ves solo el barrio.
                </p>
              </div>
            </section>
          )}

          <CommentsSection targetType="spot" targetId={s.id} />
          <div className="action-row">
            {!locked && !(s.inviteOnly && isHost) && (
              <button type="button" className="btn btn-secondary" onClick={() => openDM(undefined, s.id, s.hostName, s.title)}>
                <Icons.Message /> Chat
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => openShare({ type: "spot", id: s.id, title: s.title, photoUrl: s.photoUrl })}>
              <Icons.Share /> Compartir
            </button>
          </div>
          {/* Spot privado: el número nunca se muestra en pantalla ni al anfitrión. */}
          {s.inviteOnly && isHost && s.whatsapp && (
            <p className="invite-note">
              <Icons.Lock />
              Tu WhatsApp está protegido: solo lo usan quienes tú aceptes y no se muestra en pantalla.
            </p>
          )}
          {!locked && !(s.inviteOnly && isHost) && s.whatsapp && (
            <a
              className="btn btn-full btn-whatsapp"
              href={whatsAppChatUrl(s.whatsapp, `Hola, vi tu spot "${s.title}" en Parcháte Bogotá`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {s.inviteOnly ? "Escribir por WhatsApp" : `WhatsApp ${formatWhatsAppDisplay(s.whatsapp)}`}
            </a>
          )}
          {!locked && (
            <div className="nav-actions">
              <a href={getDirectionsUrl(s.coords)} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <Icons.Navigation /> Cómo llegar
              </a>
              <a href={getWazeUrl(s.coords)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Waze</a>
            </div>
          )}
          <div className="secondary-actions">
            {isOwner && (
              <>
                <button type="button" className="text-btn" onClick={() => { closeSpotDetail(); openEditSpot(s.id); }}>Editar</button>
                <button type="button" className="text-btn" onClick={() => deleteSpot(s.id)}>Eliminar spot</button>
              </>
            )}
            {s.hostName !== profile.handle && (
              <>
                <button type="button" className="text-btn" onClick={() => openReport({ type: "spot", id: s.id, label: s.title, hostHandle: s.hostName })}>Reportar</button>
                <button type="button" className="text-btn" onClick={() => blockUser(s.hostName)}>Bloquear</button>
              </>
            )}
          </div>
        </div>
    </SheetShell>
  );
}
