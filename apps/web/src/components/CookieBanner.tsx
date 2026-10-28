import { useState } from "react";
import { openPrivacyPolicy } from "../lib/legalUrl";

const KEY = "parchexbogota-cookies";

export function CookieBanner() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(KEY));

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem(KEY, "accepted");
    setVisible(false);
  };

  return (
    <aside className="cookie-banner" role="dialog" aria-label="Cookies">
      <p>
        Guardamos la sesión en este dispositivo. No usamos cookies de publicidad.{" "}
        <button type="button" className="text-btn" onClick={openPrivacyPolicy}>
          Ver la política de privacidad
        </button>
      </p>
      <button type="button" className="btn btn-primary compact" onClick={accept}>
        Entendido
      </button>
    </aside>
  );
}
