import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Icons } from "./Icons";

export const GUEST_MESSAGE = "Regístrate con Google, Apple o Microsoft para continuar.";

/** Aviso para visitantes sin sesión: los planes se ven por encima y no se pueden abrir. */
export function GuestNotice({ variant }: { variant: "intro" | "map" }) {
  const { signInWithGoogle, signInWithApple, signInWithMicrosoft, configured } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
    }
    setBusy(false);
  };

  return (
    <section className={`guest-notice guest-notice-${variant}`} aria-label="Registro necesario">
      <p className="guest-notice-text">
        <Icons.Lock />
        <span>
          <strong>Debes registrarte con Google, Apple o Microsoft para continuar.</strong>{" "}
          Los planes se ven solo por encima.
        </span>
      </p>
      <div className="guest-notice-actions">
        <button type="button" disabled={busy} onClick={() => void go(signInWithGoogle)} aria-label="Continuar con Google">
          Google
        </button>
        <button type="button" disabled={busy} onClick={() => void go(signInWithApple)} aria-label="Continuar con Apple">
          Apple
        </button>
        <button type="button" disabled={busy} onClick={() => void go(signInWithMicrosoft)} aria-label="Continuar con Microsoft">
          Microsoft
        </button>
      </div>
      {!configured && <p className="guest-notice-demo">Modo demo: registro simulado.</p>}
      {error && <p className="guest-notice-error" role="alert">{error}</p>}
    </section>
  );
}
