import { useParche } from "../context/ParcheContext";
import { VIBE_COLORS, VIBE_LABELS } from "../lib/constants";
import {
  formatDistance,
  formatExpiresIn,
  formatTimeAgo,
  getDirectionsUrl,
  getWazeUrl,
  haversineKm,
} from "../lib/geo";
import { approxCoords } from "../lib/invites";
import { SheetShell } from "./SheetShell";
import { CommentsSection } from "./CommentsSection";
import { Icons } from "./Icons";
import { VerifiedBadge } from "./VerifiedBadge";
import { InviteBadge } from "./InviteBadge";
import { InviteRequestButton } from "./InviteRequestButton";
import { formatWhatsAppDisplay, whatsAppChatUrl } from "../lib/share";

export function ParcheSheet() {
  const {
    selectedParche, detailOpen, closeDetail, userLocation, userParches,
    markGoing, isGoing, getGoingCount, markCheckedIn, isCheckedIn,
    openDM, openReport, openShare,
    blockUser, deleteParche, openEditParche, profile,
    canViewPrivate, isHostOf, inviteRequests, openInbox,
  } = useParche();

  if (!detailOpen || !selectedParche) return null;

  const p = selectedParche;
  // Plan por invitación: sin aceptación, solo barrio aproximado y sin contacto.
  const locked = !!p.inviteOnly && !canViewPrivate("parche", p.id);
  const isHost = isHostOf("parche", p.id);
  const shownCoords = locked ? approxCoords(p.coords) : p.coords;
  const distance = userLocation != null ? formatDistance(haversineKm(userLocation, shownCoords)) : null;
  const going = isGoing(p.id);
  const goingCount = getGoingCount(p.id);
  const isOwner = userParches.includes(p.id);
  const pendingForMe = isHost
    ? inviteRequests.filter((r) => r.targetId === p.id && r.status === "pending" && r.hostHandle === profile.handle).length
    : 0;

  return (
    <SheetShell onClose={closeDetail} labelledBy="parche-sheet-title" className="parche-sheet">
        <button type="button" className="sheet-close" onClick={closeDetail} aria-label="Cerrar">
          <Icons.Close />
        </button>
        <figure className="parche-sheet-photo">
          <img src={p.photoUrl} alt="" />
          <span className="vibe-badge" style={{ background: VIBE_COLORS[p.vibe] }}>
            {VIBE_LABELS[p.vibe]}
          </span>
          {p.inviteOnly && <InviteBadge className="invite-badge-photo" />}
        </figure>
        <div className="parche-sheet-body">
          <h2 id="parche-sheet-title">{p.title}</h2>
          {p.inviteOnly && (
            <p className="invite-note">
              <Icons.Lock />
              {isHost
                ? "Tu plan es por invitación: tú decides quién entra."
                : locked
                  ? "Plan por invitación: pide entrar y el anfitrión decide."
                  : "Plan por invitación: ya tienes acceso."}
            </p>
          )}
          <p className="parche-desc">{p.description}</p>
          <div className="parche-meta">
            <span><Icons.Clock /> {formatTimeAgo(p.createdAt)} · {formatExpiresIn(p.expiresAt)}</span>
            <span><Icons.Users /> {goingCount} van en camino · {p.attendeeCount} en el parche</span>
            <span>
              <Icons.Location />{" "}
              {locked
                ? `Zona aproximada: ${p.neighborhood ?? "Bogotá"}`
                : (p.address ?? p.neighborhood ?? "Bogotá")}
            </span>
            {distance && (
              <span><Icons.Navigation /> {locked ? "A unos " : "A "}{distance} de ti</span>
            )}
          </div>
          <div className="host-row">
            {p.hostAvatar && <img src={p.hostAvatar} alt="" className="host-avatar" />}
            <div>
              <span className="host-label">Publicado por</span>
              <span className="host-name host-name-row">
                @{p.hostName}
                {p.hostVerified && <VerifiedBadge size="sm" />}
              </span>
            </div>
          </div>

          {p.inviteOnly && !isHost && <InviteRequestButton targetType="parche" targetId={p.id} />}
          {p.inviteOnly && isHost && (
            <button type="button" className="btn btn-secondary btn-full" onClick={() => { closeDetail(); openInbox(); }}>
              <Icons.Send /> Ver solicitudes{pendingForMe > 0 ? ` (${pendingForMe} pendientes)` : ""}
            </button>
          )}

          {locked ? (
            <section className="invite-locked" aria-label="Información reservada">
              <Icons.Lock />
              <div>
                <h3>Dirección exacta y contacto reservados</h3>
                <p>
                  Se muestran cuando @{p.hostName} acepte tu solicitud. Mientras tanto ves solo el barrio
                  aproximado y la distancia estimada.
                </p>
              </div>
            </section>
          ) : (
            <>
              <section className="checkin-people" aria-label="Gente en el parche">
                <h3 className="checkin-people-title">En el parche</h3>
                {(p.checkInAvatars?.length ?? 0) === 0 ? (
                  <p className="checkin-people-empty">Nadie ha marcado llegada todavía.</p>
                ) : (
                  <ul className="checkin-people-list">
                    {p.checkInAvatars!.map((person) => (
                      <li key={person.id} className="checkin-people-item">
                        {person.avatarUrl ? (
                          <img src={person.avatarUrl} alt="" className="checkin-people-avatar" />
                        ) : (
                          <span className="checkin-people-avatar placeholder" aria-hidden>
                            {(person.name.trim()[0] || "?").toUpperCase()}
                          </span>
                        )}
                        <span className="checkin-people-name">{person.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <button
                type="button"
                className={`btn btn-full going-btn ${going ? "going-active" : ""}`}
                onClick={() => markGoing(p.id)}
              >
                {going ? "Vas en camino — tocar para cancelar" : "Voy en camino"}
              </button>

              <button
                type="button"
                className={`btn btn-full checkin-btn ${isCheckedIn(p.id) ? "checkin-active" : ""}`}
                onClick={() => markCheckedIn(p.id)}
              >
                {isCheckedIn(p.id) ? "Estás en el parche" : "Llegué al parche"}
              </button>
            </>
          )}

          <CommentsSection targetType="parche" targetId={p.id} />

          <div className="action-row">
            {!locked && !(p.inviteOnly && isHost) && (
              <button type="button" className="btn btn-secondary" onClick={() => openDM(p.id, undefined, p.hostName, p.title)}>
                <Icons.Message /> Chat
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => openShare({ type: "parche", id: p.id, title: p.title, photoUrl: p.photoUrl })}>
              <Icons.Share /> Compartir
            </button>
          </div>

          {/* Plan privado: el número nunca se muestra en pantalla ni al anfitrión. */}
          {p.inviteOnly && isHost && p.whatsapp && (
            <p className="invite-note">
              <Icons.Lock />
              Tu WhatsApp está protegido: solo lo usan quienes tú aceptes y no se muestra en pantalla.
            </p>
          )}
          {!locked && !(p.inviteOnly && isHost) && p.whatsapp && (
            <a
              className="btn btn-full btn-whatsapp"
              href={whatsAppChatUrl(p.whatsapp, `Hola, vi tu parche "${p.title}" en Parcháte Bogotá`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {p.inviteOnly ? "Escribir por WhatsApp" : `WhatsApp ${formatWhatsAppDisplay(p.whatsapp)}`}
            </a>
          )}

          {!locked && (
            <div className="nav-actions">
              <a href={getDirectionsUrl(p.coords)} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <Icons.Navigation /> Cómo llegar
              </a>
              <a href={getWazeUrl(p.coords)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Waze</a>
            </div>
          )}

          <div className="secondary-actions">
            {isOwner && (
              <>
                <button type="button" className="text-btn" onClick={() => { closeDetail(); openEditParche(p.id); }}>Editar</button>
                <button type="button" className="text-btn" onClick={() => deleteParche(p.id)}>Eliminar</button>
              </>
            )}
            {p.hostName !== profile.handle && (
              <>
                <button type="button" className="text-btn" onClick={() => openReport({ type: "parche", id: p.id, label: p.title, hostHandle: p.hostName })}>
                  <Icons.Flag /> Reportar
                </button>
                <button type="button" className="text-btn" onClick={() => blockUser(p.hostName)}>Bloquear</button>
              </>
            )}
          </div>
        </div>
    </SheetShell>
  );
}
