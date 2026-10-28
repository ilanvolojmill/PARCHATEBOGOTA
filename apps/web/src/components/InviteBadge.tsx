import { Icons } from "./Icons";

/** Distintivo "Por invitación": candado + texto (no depende solo del color). */
export function InviteBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`invite-badge ${className}`.trim()}>
      <Icons.Lock />
      <span>Por invitación</span>
    </span>
  );
}
