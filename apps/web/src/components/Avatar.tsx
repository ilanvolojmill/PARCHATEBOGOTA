import { useEffect, useState } from "react";
import type { PeerInfo } from "../lib/types";

interface AvatarProps {
  peer: Pick<PeerInfo, "name" | "handle" | "avatarUrl">;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/** Foto de perfil o inicial sobre fondo neutro (también si la foto no carga). */
export function Avatar({ peer, size = "md", className = "" }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [peer.avatarUrl]);

  const initial = (peer.name.trim()[0] || peer.handle.trim()[0] || "?").toUpperCase();
  const cls = `avatar avatar-${size} ${className}`.trim();
  if (peer.avatarUrl && !failed) {
    return (
      <img
        className={cls}
        src={peer.avatarUrl}
        alt=""
        draggable={false}
        onError={() => setFailed(true)}
      />
    );
  }
  return <span className={`${cls} avatar-placeholder`} aria-hidden>{initial}</span>;
}
