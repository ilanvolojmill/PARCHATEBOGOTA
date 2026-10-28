/** Página pública de la política. También vive en /privacidad.html cuando la app está publicada. */
export const PRIVACY_POLICY_URL =
  "https://cdn.jsdelivr.net/gh/ilanvolojmill/PARCHATEBOGOTA@main/apps/web/public/privacidad.html";

export function openPrivacyPolicy() {
  window.open(PRIVACY_POLICY_URL, "_blank", "noopener,noreferrer");
}
