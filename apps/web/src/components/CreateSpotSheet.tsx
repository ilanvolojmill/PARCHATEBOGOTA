import { useState, useRef, useEffect } from "react";
import { useParche } from "../context/ParcheContext";
import { VIBE_LABELS, VIBE_ORDER } from "../lib/constants";
import { isInBogota, requestUserLocation } from "../lib/geo";
import type { ParcheVibe } from "../lib/types";
import { compressImage } from "../lib/image";
import { normalizeWhatsApp } from "../lib/share";
import { SheetShell } from "./SheetShell";
import { Icons } from "./Icons";
import { InviteToggle } from "./InviteToggle";

const VIBES: ParcheVibe[] = VIBE_ORDER;

const NEIGHBORHOODS = [
  "Chapinero", "Usaquén", "La Candelaria", "Zona T", "Teusaquillo",
  "La Macarena", "Quinta Camacho", "San Felipe", "Ciudad Bolívar", "Otro",
];

export function CreateSpotSheet() {
  const { createSpotOpen, closeCreateSpot, publishSpot, updateSpot, editSpotId, spots, showToast } = useParche();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [neighborhood, setNeighborhood] = useState(NEIGHBORHOODS[0]);
  const [vibe, setVibe] = useState<ParcheVibe>("rumba");
  const [whatsapp, setWhatsapp] = useState("");
  const [inviteOnly, setInviteOnly] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editSpotId;

  useEffect(() => {
    if (!createSpotOpen) return;
    if (editSpotId) {
      const s = spots.find((x) => x.id === editSpotId);
      if (s) {
        setTitle(s.title);
        setDescription(s.description);
        setNeighborhood(s.neighborhood);
        setVibe(s.vibe);
        setWhatsapp(s.whatsapp ?? "");
        setInviteOnly(!!s.inviteOnly);
        setPhotoUrl(s.photoUrl);
        setCoords(s.coords);
      }
    } else {
      setTitle("");
      setDescription("");
      setNeighborhood(NEIGHBORHOODS[0]);
      setVibe("rumba");
      setWhatsapp("");
      setInviteOnly(false);
      setPhotoUrl(null);
      setCoords(null);
    }
  }, [createSpotOpen, editSpotId, spots]);


  if (!createSpotOpen) return null;

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    void (async () => {
      try {
        setPhotoUrl(await compressImage(file));
      } catch {
        const reader = new FileReader();
        reader.onload = () => setPhotoUrl(reader.result as string);
        reader.readAsDataURL(file);
      }
    })();
  };

  const handleLocate = async () => {
    setLocating(true);
    try {
      const c = await requestUserLocation();
      if (!isInBogota(c)) {
        showToast("Tu ubicación está fuera de Bogotá", "error");
        setLocating(false);
        return;
      }
      setCoords(c);
      showToast("Ubicación capturada", "success");
    } catch {
      showToast("No pudimos obtener tu ubicación", "error");
    }
    setLocating(false);
  };

  const resolveWhatsApp = (): string | undefined => {
    const raw = whatsapp.trim();
    if (!raw) return undefined;
    const normalized = normalizeWhatsApp(raw);
    if (!normalized) {
      showToast("WhatsApp inválido. Usa 10 dígitos o +57…", "error");
      return "";
    }
    return normalized;
  };

  const handlePublish = () => {
    if (!title.trim()) {
      showToast("El título es obligatorio", "error");
      return;
    }
    const wa = resolveWhatsApp();
    if (wa === "") return;

    if (isEditing && editSpotId) {
      updateSpot(editSpotId, {
        title: title.trim(),
        description: description.trim() || "Sin descripción",
        neighborhood,
        vibe,
        whatsapp: wa,
        inviteOnly,
      });
      return;
    }
    if (!photoUrl || !coords) {
      showToast("Completa título, foto y ubicación", "error");
      return;
    }
    publishSpot({
      title: title.trim(),
      description: description.trim() || "Sin descripción",
      photoUrl,
      coords,
      neighborhood,
      vibe,
      whatsapp: wa,
      inviteOnly,
    });
  };

  return (
    <SheetShell onClose={closeCreateSpot} labelledBy="create-spot-title" className="create-sheet">
        <header className="create-header">
          <button type="button" className="text-btn" onClick={closeCreateSpot}>Cancelar</button>
          <h2 id="create-spot-title">{isEditing ? "Editar spot" : "Subir spot"}</h2>
          <button type="button" className="text-btn accent" onClick={handlePublish}>
            {isEditing ? "Guardar" : "Publicar"}
          </button>
        </header>

        <div className="create-body">
          {!isEditing && (
            <p className="create-hint">Tu spot aparecerá en el mazo de descubrimiento.</p>
          )}

          {!isEditing && (
            <>
              <button type="button" className={`photo-upload ${photoUrl ? "has-photo" : ""}`} onClick={() => fileRef.current?.click()}>
                {photoUrl ? <img src={photoUrl} alt="Vista previa" /> : <><Icons.Camera /><span>Foto del lugar</span></>}
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={handlePhoto} />
            </>
          )}

          {isEditing && photoUrl && (
            <figure className="edit-photo-preview"><img src={photoUrl} alt="" /></figure>
          )}

          <label className="field">
            <span>Nombre del spot</span>
            <input type="text" placeholder="Ej: Terraza en Chapinero" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
          </label>

          <label className="field">
            <span>Barrio / zona</span>
            <select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="select-field">
              {NEIGHBORHOODS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>

          <label className="field">
            <span>WhatsApp (opcional)</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="300 123 4567"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              maxLength={20}
            />
          </label>

          <label className="field">
            <span>Descripción</span>
            <textarea placeholder="Qué hay, cómo llegar..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={280} />
          </label>

          <div className="field">
            <span>Vibra</span>
            <div className="vibe-picker">
              {VIBES.map((v) => (
                <button key={v} type="button" className={`vibe-chip ${vibe === v ? "active" : ""}`} onClick={() => setVibe(v)}>
                  {VIBE_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          <InviteToggle kind="spot" checked={inviteOnly} onChange={setInviteOnly} />

          {!isEditing && (
            <button type="button" className={`locate-btn ${coords ? "located" : ""}`} onClick={handleLocate} disabled={locating}>
              <Icons.Crosshair />
              {locating ? "Obteniendo ubicación..." : coords ? "Ubicación lista ✓" : "Ubicación del lugar"}
            </button>
          )}
        </div>
    </SheetShell>
  );
}
