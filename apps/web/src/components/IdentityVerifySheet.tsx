import { useState } from "react";
import { useParche } from "../context/ParcheContext";
import { SheetShell } from "./SheetShell";
import {
  getConfiguredKycProvider,
  identityStatusHint,
  identityStatusLabel,
  isKycEnabled,
  type IdentityStatus,
} from "../lib/kyc";
import { startIdentityVerificationRemote } from "../lib/supabase/api";

/**
 * Flujo de identidad con cédula.
 * Sin proveedor configurado: explica qué falta (no aprueba OCR local).
 * Con VITE_KYC_ENABLED + Supabase: crea sesión pending; el webhook del proveedor completa.
 */
export function IdentityVerifySheet() {
  const { identityOpen, closeIdentity, profile, showToast, remoteMode } = useParche();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);


  if (!identityOpen) return null;

  const status = (profile.identityStatus ?? "none") as IdentityStatus;
  const provider = getConfiguredKycProvider();
  const enabled = isKycEnabled() && provider !== "none";

  const start = async () => {
    setError(null);
    if (!remoteMode) {
      setError(
        "La verificación de cédula requiere Supabase en producción y un proveedor KYC (Truora, Sumsub, Veriff o MetaMap).",
      );
      return;
    }
    if (!enabled) {
      setError(
        "Activa VITE_KYC_ENABLED=true y VITE_KYC_PROVIDER, contrata el proveedor y despliega la Edge Function kyc-webhook. Ver KYC_Y_PUBLICACION.md.",
      );
      return;
    }
    setBusy(true);
    try {
      await startIdentityVerificationRemote(provider);
      showToast("Sesión KYC iniciada. Completa el escaneo en el proveedor.", "info");
      // Aquí se abre el SDK/WebView del proveedor cuando tengas sus keys.
      closeIdentity();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar la verificación");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SheetShell onClose={closeIdentity} labelledBy="identity-title" className="identity-sheet">
        <header className="create-header">
          <button type="button" className="text-btn" onClick={closeIdentity}>
            Cerrar
          </button>
          <h2 id="identity-title">Verificar identidad</h2>
          <span />
        </header>

        <div className="create-body">
          <p className="create-hint">
            Escaneo de <strong>cédula colombiana</strong> + selfie de comparación, vía un proveedor
            certificado. No usamos OCR casero ni afirmamos acceso a la Registraduría.
          </p>

          <div className="identity-status-block">
            <strong>{identityStatusLabel(status)}</strong>
            <p>{identityStatusHint(status)}</p>
            {profile.identityRejectionReason && (
              <p className="verify-error" role="alert">
                {profile.identityRejectionReason}
              </p>
            )}
          </div>

          <ol className="identity-steps">
            <li>Foto nítida del anverso de la cédula</li>
            <li>Selfie en vivo (liveness del proveedor)</li>
            <li>Resultado automático por webhook seguro</li>
          </ol>

          {status !== "verified" && (
            <button
              type="button"
              className="btn btn-primary btn-full"
              disabled={busy}
              onClick={() => void start()}
            >
              {busy ? "Iniciando…" : status === "rejected" ? "Reintentar verificación" : "Continuar con cédula"}
            </button>
          )}

          {error && (
            <p className="verify-error" role="alert">
              {error}
            </p>
          )}

          <p className="caption">
            Proveedor configurado: {enabled ? provider : "ninguno"}. Selfie de perfil y KYC de cédula son
            procesos distintos.
          </p>
        </div>
    </SheetShell>
  );
}
