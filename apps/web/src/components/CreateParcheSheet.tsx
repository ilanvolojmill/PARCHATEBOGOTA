import { useState, useRef, useEffect } from "react";
import { useParche } from "../context/ParcheContext";
import { VIBE_LABELS, VIBE_ORDER } from "../lib/constants";
import { isInBogota, requestUserLocation } from "../lib/geo";
import type { ParcheVibe } from "../lib/types";
import { compressImage } from "../lib/image";
import { takeNativePhoto } from "../lib/native";
import { normalizeWhatsApp } from "../lib/share";
import { SheetShell } from "./SheetShell";
import { Icons } from "./Icons";
import { InviteToggle } from "./InviteToggle";

const VIBES: ParcheVibe[] = VIBE_ORDER;

export function CreateParcheSheet() {
  const {
    createOpen, closeCreate, publishParche, updateParche, editParcheId, parches, showToast,
  } = useParche();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [vibe, setVibe] = useState<ParcheVibe>("rumba");
  const [whatsapp, setWhatsapp] = useState("");
  const [inviteOnly, setInviteOnly] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editParcheId;

  useEffect(() => {
    if (!createOpen) return;
    if (editParcheId) {
      const p = parches.find((x) => x.id === editParcheId);
      if (p) {
        setTitle(p.title);
        setDescription(p.description);
        setVibe(p.vibe);
        setWhatsapp(p.whatsapp ?? "");
        setInviteOnly(!!p.inviteOnly);
        setPhotoUrl(p.photoUrl);
        setCoords(p.coords);
      }
    } else {
      setTitle("");
      setDescription("");
      setVibe("rumba");
      setWhatsapp("");
      setInviteOnly(false);
      setPhotoUrl(null);
      setCoords(null);
    }
  }, [createOpen, editParcheId, parches]);


  if (!createOpen) return null;

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    void (async () => {
      try {
        const compressed = await compressImage(file);
        setPhotoUrl(compressed);
      } catch {
        const reader = new FileReader();
        reader.onload = () => setPhotoUrl(reader.result as string);
        reader.readAsDataURL(file);
      }
    })();
  };

  const handleNativeCamera = async () => {
    const shot = await takeNativePhoto();
    if (!shot) return;
    try {
      setPhotoUrl(await compressImage(shot));
    } catch {
      setPhotoUrl(shot);
    }
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

  const handlePublish = () => {
    if (!title.trim()) {
      showToast("El título es obligatorio", "error");
      return;
    }
    const rawWa = whatsapp.trim();
    let wa: string | undefined;
    if (rawWa) {
      wa = normalizeWhatsApp(rawWa);
      if (!wa) {
        showToast("WhatsApp inválido. Usa 10 dígitos o +57…", "error");
        return;
      }
    }
    if (isEditing && editParcheId) {
      setPublishing(true);
      updateParche(editParcheId, {
        title: title.trim(),
        description: description.trim() || "Sin descripción",
        vibe,
        whatsapp: wa,
        inviteOnly,
      });
      setPublishing(false);
      return;
    }
    if (!photoUrl || !coords) {
      showToast("Completa título, foto y ubicación", "error");
      return;
    }
    setPublishing(true);
    publishParche({
      title: title.trim(),
      description: description.trim() || "Sin descripción",
      photoUrl,
      coords,
      vibe,
      whatsapp: wa,
      inviteOnly,
    });
    setPublishing(false);
  };

  return (
    <SheetShell onClose={closeCreate} labelledBy="create-parche-title" className="create-sheet">
        <header className="create-header">
          <button type="button" className="text-btn" onClick={closeCreate}>
            Cancelar
          </button>
          <h2 id="create-parche-title">{isEditing ? "Editar parche" : "Publicar parche"}</h2>
          <button
            type="button"
            className="text-btn accent"
            onClick={handlePublish}
            disabled={publishing}
          >
            {isEditing ? "Guardar" : "Publicar"}
          </button>
        </header>

        <div className="create-body">
          {!isEditing && (
            <>
              <button
                type="button"
                className={`photo-upload ${photoUrl ? "has-photo" : ""}`}
                onClick={() => fileRef.current?.click()}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="Vista previa" />
                ) : (
                  <>
                    <Icons.Camera />
                    <span>Sube una foto del parche</span>
                  </>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={handlePhoto}
              />
              <button type="button" className="text-btn" onClick={() => void handleNativeCamera()}>
                Usar cámara nativa (app)
              </button>
            </>
          )}

          {isEditing && photoUrl && (
            <figure className="edit-photo-preview">
              <img src={photoUrl} alt="Foto del parche" />
            </figure>
          )}

          <label className="field">
            <span>Nombre del parche</span>
            <input
              type="text"
              placeholder="Ej: Rumba en Chapinero"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
            />
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
            <textarea
              placeholder="Cómo llegar, qué hay, dress code..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={280}
            />
          </label>

          <div className="field">
            <span>Vibra</span>
            <div className="vibe-picker">
              {VIBES.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`vibe-chip ${vibe === v ? "active" : ""}`}
                  onClick={() => setVibe(v)}
                >
                  {VIBE_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          <InviteToggle kind="parche" checked={inviteOnly} onChange={setInviteOnly} />

          {!isEditing && (
            <button
              type="button"
              className={`locate-btn ${coords ? "located" : ""}`}
              onClick={handleLocate}
              disabled={locating}
            >
              <Icons.Crosshair />
              {locating
                ? "Obteniendo ubicación..."
                : coords
                  ? "Ubicación lista ✓"
                  : "Usar mi ubicación actual"}
            </button>
          )}
        </div>
    </SheetShell>
  );
}
