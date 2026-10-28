import { useParche } from "../context/ParcheContext";
import { INVITE_STATUS_LABEL } from "../lib/invites";
import { SheetShell } from "./SheetShell";
import { Avatar } from "./Avatar";
import { Icons } from "./Icons";
import { VerifiedBadge } from "./VerifiedBadge";

/** Mini-perfil de otra persona; si viene de una solicitud, el anfitrión puede aceptar o denegar. */
export function PeerProfileSheet() {
  const { peerProfile, closePeerProfile, getPeerInfo, inviteRequests, profile, decideInvite } = useParche();
  if (!peerProfile) return null;

  const peer = getPeerInfo(peerProfile.handle);
  const request = peerProfile.requestId
    ? inviteRequests.find((r) => r.id === peerProfile.requestId)
    : undefined;
  const canDecide = !!request && request.status === "pending" && request.hostHandle === profile.handle;

  const decide = (status: "accepted" | "denied") => {
    if (!request) return;
    decideInvite(request.id, status);
    closePeerProfile();
  };

  return (
    <SheetShell onClose={closePeerProfile} labelledBy="peer-sheet-title" className="peer-sheet">
      <header className="create-header">
        <button type="button" className="text-btn" onClick={closePeerProfile}>Cerrar</button>
        <h2 id="peer-sheet-title">Perfil</h2>
        <span />
      </header>
      <div className="peer-body">
        <Avatar peer={peer} size="xl" />
        <h3 className="peer-name">{peer.name}</h3>
        <p className="peer-handle">@{peer.handle}</p>
        {peer.verified ? (
          <p className="peer-verified is-ok">
            <VerifiedBadge size="sm" /> Selfie verificada
          </p>
        ) : (
          <p className="peer-verified">
            <Icons.Shield /> Selfie sin verificar
          </p>
        )}
        <p className="peer-bio">{peer.bio?.trim() || "Esta persona aún no escribió una biografía."}</p>
        <p className="peer-note">
          El sello de selfie confirma la foto de perfil; no es verificación de identidad (KYC).
        </p>

        {request && (
          <section className="peer-request" aria-label="Solicitud de invitación">
            <p className="peer-request-plan">
              <Icons.Lock /> Pidió invitación a «{request.targetTitle}»
              <span className={`invite-chip invite-chip-${request.status}`}>{INVITE_STATUS_LABEL[request.status]}</span>
            </p>
            <blockquote className={request.message ? "peer-request-msg" : "peer-request-msg is-empty"}>
              {request.message || "Sin mensaje"}
            </blockquote>
          </section>
        )}

        {canDecide && (
          <div className="peer-actions">
            <button type="button" className="btn btn-secondary" onClick={() => decide("denied")}>
              <Icons.X /> Denegar
            </button>
            <button type="button" className="btn btn-primary" onClick={() => decide("accepted")}>
              <Icons.Check /> Aceptar
            </button>
          </div>
        )}
      </div>
    </SheetShell>
  );
}
