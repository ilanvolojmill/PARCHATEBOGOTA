/**
 * KYC de identidad (cédula) — solo vía proveedor externo.
 * No hay OCR local que “apruebe” documentos: eso no es verificación real.
 */

export type IdentityStatus = "none" | "pending" | "verified" | "rejected";

export type KycProvider = "truora" | "sumsub" | "veriff" | "metamap" | "none";

export function isKycEnabled(): boolean {
  return String(import.meta.env.VITE_KYC_ENABLED ?? "").toLowerCase() === "true";
}

export function getConfiguredKycProvider(): KycProvider {
  const raw = String(import.meta.env.VITE_KYC_PROVIDER ?? "none").toLowerCase();
  if (raw === "truora" || raw === "sumsub" || raw === "veriff" || raw === "metamap") {
    return raw;
  }
  return "none";
}

export function identityStatusLabel(status: IdentityStatus): string {
  switch (status) {
    case "verified":
      return "Identidad verificada";
    case "pending":
      return "Verificación en proceso";
    case "rejected":
      return "Verificación rechazada";
    default:
      return "Sin verificar identidad";
  }
}

export function identityStatusHint(status: IdentityStatus): string {
  switch (status) {
    case "verified":
      return "Tu cédula fue validada por un proveedor KYC certificado.";
    case "pending":
      return "Estamos esperando el resultado del proveedor. Puede tomar unos minutos.";
    case "rejected":
      return "No se pudo verificar. Revisa que la foto de la cédula sea nítida e inténtalo de nuevo.";
    default:
      return "Para identidad real se escanea la cédula con un proveedor certificado (no es OCR local).";
  }
}
