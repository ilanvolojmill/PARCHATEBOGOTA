import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function LoginScreen() {
  const { signInWithGoogle, signInWithMicrosoft, signInWithApple, configured } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al iniciar sesión");
    }
    setBusy(false);
  };

  return (
    <div className="login-screen" aria-busy={busy}>
      <div className="login-card">
        <p className="login-eyebrow">Bogotá</p>
        <h1>Parcháte Bogotá</h1>
        <p className="login-sub">
          Entra con tu cuenta. Elige usuario. Sube tu foto.
        </p>

        <div className="login-actions">
          <button
            type="button"
            className="btn btn-oauth btn-google btn-full"
            disabled={busy}
            onClick={() => void handle(signInWithGoogle)}
          >
            Continuar con Google
          </button>
          <button
            type="button"
            className="btn btn-oauth btn-microsoft btn-full"
            disabled={busy}
            onClick={() => void handle(signInWithMicrosoft)}
          >
            Continuar con Microsoft
          </button>
          <button
            type="button"
            className="btn btn-oauth btn-apple btn-full"
            disabled={busy}
            onClick={() => void handle(signInWithApple)}
          >
            Continuar con Apple
          </button>
        </div>

        <div className="login-feedback" aria-live="polite">
          {busy && (
            <p className="login-msg" role="status">
              Abriendo inicio de sesión…
            </p>
          )}
          {!configured && (
            <p className="login-msg error" role="alert">
              Supabase no está configurado. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
            </p>
          )}
          {error && <p className="login-msg error" role="alert">{error}</p>}
        </div>
      </div>
    </div>
  );
}
