import { useParche } from "../context/ParcheContext";
import type { LegalDoc } from "../lib/types";
import { SheetShell } from "./SheetShell";

const DOCS: Record<LegalDoc, { title: string; body: string[] }> = {
  privacy: {
    title: "Política de privacidad",
    body: [
      "Parcháte Bogotá recopila tu nombre, usuario, foto de perfil, selfie de confirmación, ubicación GPS y fotos que subes de parches y spots.",
      "Usamos estos datos para mostrar contenido en el mapa, moderar la comunidad y mejorar la experiencia en Bogotá.",
      "La selfie confirma que hay una foto de persona en el perfil. NO es una verificación de identidad gubernamental (KYC) ni biometría certificada, salvo que se integre un proveedor externo en el futuro.",
      "Las selfies se almacenan en un bucket privado (no público). Las fotos de parches/spots pueden ser públicas en el mapa.",
      "Tus datos se almacenan en servidores (Supabase) en cumplimiento de la Ley 1581 de 2012 (Colombia).",
      "Puedes exportar tus datos desde Perfil → Exportar mis datos (ARCO) y eliminar tu cuenta desde Perfil → Eliminar cuenta, o escribir a privacidad@parchexbogota.app",
      "Derechos ARCO (Colombia): acceso, rectificación, cancelación y oposición. Contacto: privacidad@parchexbogota.app",
      "No vendemos tus datos personales a terceros.",
      "Última actualización: agosto 2026.",
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
      "El sello de selfie confirmada es un mecanismo de confianza comunitario; no garantiza la conducta de usuarios ni sustituye identificación oficial.",
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
