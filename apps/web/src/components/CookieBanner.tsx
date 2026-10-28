import { useState } from "react";

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
        Usamos cookies y almacenamiento local para la app, analytics (Plausible/Mixpanel) y mejorar tu experiencia.
        Al continuar aceptas nuestra política de privacidad.
      </p>
      <button type="button" className="btn btn-primary compact" onClick={accept}>
        Aceptar
      </button>
    </aside>
  );
}
