import { useParche } from "../context/ParcheContext";
import type { LegalDoc } from "../lib/types";
import { SheetShell } from "./SheetShell";

const DOCS: Record<LegalDoc, { title: string; body: string[] }> = {
  privacy: {
    title: "Política de privacidad",
    body: [
      "Tratamos solo lo necesario para la cuenta y el mapa: nombre, correo, usuario, foto de perfil, lo que publicas y, si la activas, una ubicación aproximada.",
      "No vendemos datos ni usamos cookies de publicidad. La cédula solo se pide si quieres publicar, y la procesa Didit.",
      "Puedes consultar, corregir, revocar y suprimir tus datos en privacidad@parchexbogota.app o desde Perfil.",
      "La política completa, Ley 1581 de 2012, está en la página pública de privacidad.",
    ],
  },
  terms: {
    title: "Términos y condiciones",
    body: [
      "Debes tener 18 años o más para usar Parcháte Bogotá.",
      "Al usar Parcháte Bogotá aceptas publicar contenido veraz sobre parches y lugares en Bogotá.",
      "Está prohibido publicar contenido falso, ilegal, que incite violencia o acoso.",
      "Eres responsable de tu seguridad al asistir a parches. Parcháte Bogotá no organiza eventos.",
      "Nos reservamos el derecho de eliminar contenido reportado o que viole estas normas.",
      "Solo puedes publicar parches o spots si Didit verificó tu cédula. El sello de selfie de perfil no sustituye esa verificación.",
      "Para soporte: hola@parchexbogota.app",
    ],
  },
};

export function LegalSheet() {
  const { legalOpen, closeLegal } = useParche();
  if (!legalOpen) return null;
  const doc = DOCS[legalOpen];

  return (
    <SheetShell onClose={closeLegal} labelledBy="legal-sheet-title" className="legal-sheet">
        <header className="create-header">
          <button type="button" className="text-btn" onClick={closeLegal}>Cerrar</button>
          <h2 id="legal-sheet-title">{doc.title}</h2>
          <span />
        </header>
        <div className="legal-body">
          {doc.body.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
    </SheetShell>
  );
}
