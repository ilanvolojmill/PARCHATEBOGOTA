import { useEffect, useState } from "react";
import { useParche } from "../context/ParcheContext";
import { MAX_INVITE_CHARS, MAX_INVITE_WORDS, countWords } from "../lib/invites";
import { SheetShell } from "./SheetShell";
import { Avatar } from "./Avatar";
import { Icons } from "./Icons";

/** Hoja para pedir invitación a un plan privado, con mensaje opcional de máx. 20 palabras. */
export function InviteRequestSheet() {
  const { inviteTarget, closeInviteRequest, parches, spots, requestInvite, getPeerInfo } = useParche();
  const [message, setMessage] = useState("");

  const targetKey = inviteTarget ? `${inviteTarget.type}:${inviteTarget.id}` : "";
  useEffect(() => { setMessage(""); }, [targetKey]);

  if (!inviteTarget) return null;
  const item = inviteTarget.type === "parche"
    ? parches.find((p) => p.id === inviteTarget.id)
    : spots.find((s) => s.id === inviteTarget.id);
  if (!item) return null;

  const host = getPeerInfo(item.hostName);
  const words = countWords(message);
  const over = words > MAX_INVITE_WORDS;
  const excess = words - MAX_INVITE_WORDS;

  const submit = () => {
    if (over) return;
    requestInvite(inviteTarget.type, inviteTarget.id, message);
  };

  return (
    <SheetShell onClose={closeInviteRequest} labelledBy="invite-sheet-title" className="invite-sheet">
      <header className="create-header">
        <button type="button" className="text-btn" onClick={closeInviteRequest}>Cancelar</button>
        <h2 id="invite-sheet-title">Solicitar invitación</h2>
        <span />
      </header>
      <form
        className="create-body invite-form"
        onSubmit={(e) => { e.preventDefault(); submit(); }}
      >
        <div className="invite-target">
          <Avatar peer={host} size="lg" />
          <div>
            <strong>{item.title}</strong>
            <span>Anfitrión: @{item.hostName}</span>
          </div>
        </div>
        <p className="invite-explain">
          <Icons.Lock /> Este plan es por invitación. @{item.hostName} verá tu perfil y tu mensaje, y decidirá si
          puedes entrar. La dirección exacta y el contacto se muestran solo si te acepta.
        </p>

        <label className="field" htmlFor="invite-message">
          <span>Mensaje para el anfitrión (opcional)</span>
        </label>
        <textarea
          id="invite-message"
          className={`invite-textarea ${over ? "is-over" : ""}`}
          rows={3}
          value={message}
          maxLength={MAX_INVITE_CHARS}
          placeholder="Ej: Hola, voy con una amiga y llevamos algo para compartir."
          onChange={(e) => setMessage(e.target.value)}
          aria-describedby="invite-help invite-count"
          aria-invalid={over}
        />
        <div className="invite-meta">
          <p id="invite-help" className="invite-help">
            Máximo {MAX_INVITE_WORDS} palabras. El mensaje le llega al anfitrión en Mensajes.
          </p>
          <p id="invite-count" className={`invite-count ${over ? "is-over" : ""}`}>
            {words}/{MAX_INVITE_WORDS} palabras
          </p>
        </div>
        {over && (
          <p className="invite-error" role="alert">
            Te pasaste por {excess} {excess === 1 ? "palabra" : "palabras"}. Acórtalo para poder enviar.
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={over}
          aria-disabled={over}
        >
          <Icons.Send /> Enviar solicitud
        </button>
      </form>
    </SheetShell>
  );
}
