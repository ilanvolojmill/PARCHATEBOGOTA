import { useState } from "react";

const KEY = "parchexbogota-age-ok";

export function hasConfirmedAge(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  const [denied, setDenied] = useState(false);

  if (denied) {
    return (
      <div className="age-gate">
        <div className="age-gate-panel">
          <h1>Parcháte Bogotá</h1>
          <p>Debes ser mayor de 18 años para usar esta app.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="age-gate">
      <div className="age-gate-panel">
        <h1>Parcháte Bogotá</h1>
        <p className="age-gate-lead">
          Esta app muestra ubicaciones y contenido generado por usuarios.
          Confirma que tienes <strong>18 años o más</strong>.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-full"
          onClick={() => {
            localStorage.setItem(KEY, "1");
            onConfirm();
          }}
        >
          Sí, soy mayor de 18
        </button>
        <button type="button" className="text-btn" onClick={() => setDenied(true)}>
          Soy menor de 18
        </button>
      </div>
    </div>
  );
}
