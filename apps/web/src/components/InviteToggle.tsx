import { useId } from "react";
import { Icons } from "./Icons";

interface InviteToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  kind: "parche" | "spot";
}

/** Interruptor accesible "Privado · Por invitación". */
export function InviteToggle({ checked, onChange, kind }: InviteToggleProps) {
  const id = useId();
  const helpId = `${id}-help`;
  return (
    <div className={`invite-toggle ${checked ? "is-on" : ""}`}>
      <label className="invite-toggle-text" htmlFor={id}>
        <span className="invite-toggle-title">
          <Icons.Lock /> Privado · Por invitación
        </span>
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={helpId}
        className="invite-switch"
        onClick={() => onChange(!checked)}
      >
        <span className="invite-switch-state">{checked ? "Activado" : "Desactivado"}</span>
        <span className="invite-switch-track" aria-hidden>
          <span className="invite-switch-thumb" />
        </span>
      </button>
      <p id={helpId} className="invite-toggle-help">
        {kind === "parche" ? "El plan" : "El spot"} sigue visible en el mapa y en el mazo, pero quien quiera ir
        debe solicitar invitación (con un mensaje de hasta 20 palabras). Tú ves su perfil y decides si entra.
        {" "}La dirección exacta y el WhatsApp quedan ocultos hasta que aceptes; mientras tanto solo se ve el barrio aproximado.
      </p>
    </div>
  );
}
