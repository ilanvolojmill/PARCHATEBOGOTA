import { useParche } from "../context/ParcheContext";
import type { ContentTargetType } from "../lib/types";
import { Icons } from "./Icons";

interface InviteRequestButtonProps {
  targetType: ContentTargetType;
  targetId: string;
  className?: string;
}

/**
 * Botón de solicitud para un plan "Por invitación".
 * No se muestra al anfitrión. Refleja el estado: pendiente / aceptada / denegada.
 */
export function InviteRequestButton({ targetType, targetId, className = "" }: InviteRequestButtonProps) {
  const { isHostOf, getMyInvite, openInviteRequest } = useParche();
  if (isHostOf(targetType, targetId)) return null;
  const invite = getMyInvite(targetType, targetId);

  if (!invite) {
    return (
      <button
        type="button"
        className={`btn btn-primary btn-full invite-request-btn ${className}`.trim()}
        onClick={() => openInviteRequest(targetType, targetId)}
      >
        <Icons.Lock /> Solicitar invitación
      </button>
    );
  }

  const states = {
    pending: { label: "Solicitud enviada", icon: <Icons.Clock />, hint: "Esperando respuesta del anfitrión." },
    accepted: { label: "Invitación aceptada", icon: <Icons.Check />, hint: "Ya puedes ver la dirección y el contacto." },
    denied: { label: "Solicitud denegada", icon: <Icons.X />, hint: "El anfitrión no aceptó esta vez." },
  } as const;
  const s = states[invite.status];

  return (
    <div className={`invite-request-state ${className}`.trim()}>
      <button
        type="button"
        className={`btn btn-full invite-request-btn invite-${invite.status}`}
        disabled
        aria-disabled="true"
      >
        {s.icon} {s.label}
      </button>
      <p className="invite-request-hint" role="status">{s.hint}</p>
    </div>
  );
}
