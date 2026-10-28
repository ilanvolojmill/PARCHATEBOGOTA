/** Página pública. Se abre al pulsar Política de privacidad. */
export const PRIVACY_POLICY_URL = "https://centralasersas.github.io/parche-privacidad/";

export function openPrivacyPolicy() {
  window.open(PRIVACY_POLICY_URL, "_blank", "noopener,noreferrer");
}
