import { VIBE_LABELS, VIBE_ORDER } from "../lib/constants";
import type { ParcheVibe } from "../lib/types";

interface VibeBackdropProps {
  /** Categoría activa en el filtro; se resalta un poco más. */
  active?: ParcheVibe | "all";
}

const MID = Math.ceil(VIBE_ORDER.length / 2);
const LEFT = VIBE_ORDER.slice(0, MID);
const RIGHT = VIBE_ORDER.slice(MID);

/**
 * Categorías a los lados de la tarjeta del medio: letras tenues, no tapan el mazo.
 */
export function VibeBackdrop({ active = "all" }: VibeBackdropProps) {
  return (
    <div className="vibe-backdrop" aria-hidden="true">
      <div className="vibe-col vibe-col-left">
        {LEFT.map((v) => (
          <span key={v} className={`vibe-backdrop-word ${active === v ? "is-active" : ""}`}>
            {VIBE_LABELS[v]}
          </span>
        ))}
      </div>
      <div className="vibe-col vibe-col-right">
        {RIGHT.map((v) => (
          <span key={v} className={`vibe-backdrop-word ${active === v ? "is-active" : ""}`}>
            {VIBE_LABELS[v]}
          </span>
        ))}
      </div>
    </div>
  );
}
