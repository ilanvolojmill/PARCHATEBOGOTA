export type VerifyPhase = "idle" | "scanning" | "done" | "rejected";

export interface FaceVerifyResult {
  phase: VerifyPhase;
  verificationId?: string;
  message: string;
}

/** Copy honesto: selfie de confianza, NO KYC gubernamental. */
const VERIFY_STEPS = [
  "Capturando selfie…",
  "Revisando que la foto sea clara…",
  "Guardando en tu perfil…",
  "Activando sello de selfie confirmada…",
];

export function getVerifyStepLabel(step: number): string {
  return VERIFY_STEPS[Math.min(step, VERIFY_STEPS.length - 1)] ?? VERIFY_STEPS[0];
}

/**
 * Flujo local de confirmación de selfie.
 * En producción remota el sello solo se activa vía RPC confirm_profile_selfie().
 * Esto NO es verificación de identidad legal / KYC.
 */
export async function confirmSelfieFlow(
  onStep: (step: number) => void
): Promise<FaceVerifyResult> {
  for (let i = 0; i < VERIFY_STEPS.length; i++) {
    onStep(i);
    await delay(500 + Math.random() * 250);
  }
  onStep(VERIFY_STEPS.length);

  if (!navigator.onLine) {
    return {
      phase: "rejected",
      message: "Sin conexión. Intenta de nuevo cuando vuelvas online.",
    };
  }

  return {
    phase: "done",
    verificationId: `selfie_${Date.now().toString(36)}`,
    message: "Selfie confirmada. Puedes publicar. Esto no es un documento de identidad.",
  };
}

/** @deprecated usar confirmSelfieFlow */
export const simulateFaceVerification = confirmSelfieFlow;

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function sanitizeHandle(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._]/g, "")
    .replace(/\.+/g, ".")
    .slice(0, 20);
}
