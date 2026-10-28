import { useState } from "react";
import { useParche } from "../context/ParcheContext";
import { FaceVerifyCamera } from "./FaceVerifyCamera";
import { Icons } from "./Icons";
import {
  getVerifyStepLabel,
  confirmSelfieFlow,
} from "../lib/verify";
import { SheetShell } from "./SheetShell";

export function EditProfileSheet() {
  const { editProfileOpen, closeEditProfile, profile, updateProfile, verifyProfile } = useParche();
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [mode, setMode] = useState<"edit" | "verify">("edit");
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifyError, setVerifyError] = useState<string | null>(null);


  if (!editProfileOpen) return null;

  const handleSave = () => {
    updateProfile({ name: name.trim(), bio: bio.trim() });
    closeEditProfile();
  };

  const handleVerify = async () => {
    if (!facePhoto) return;
    setVerifying(true);
    setVerifyError(null);
    const result = await confirmSelfieFlow(setVerifyStep);
    setVerifying(false);
    if (result.phase === "rejected") {
      setVerifyError(result.message);
      return;
    }
    verifyProfile(facePhoto, result.verificationId!);
    setMode("edit");
    setFacePhoto(null);
  };

  return (
    <SheetShell onClose={closeEditProfile} labelledBy="edit-profile-title" className="edit-profile-sheet">
        <header className="create-header">
          <button type="button" className="text-btn" onClick={closeEditProfile}>
            Cerrar
          </button>
          <h2 id="edit-profile-title">{mode === "verify" ? "Foto de perfil" : "Editar perfil"}</h2>
          {mode === "edit" ? (
            <button type="button" className="text-btn accent" onClick={handleSave}>
              Guardar
            </button>
          ) : (
            <span />
          )}
        </header>

        <div className="create-body">
          {mode === "edit" ? (
            <>
              <label className="field">
                <span>Nombre</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={24}
                />
              </label>
              <label className="field">
                <span>Usuario</span>
                <input type="text" value={`@${profile.handle}`} disabled className="input-disabled" />
              </label>
              <label className="field">
                <span>Bio</span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={120}
                />
              </label>
              {!profile.verified && (
                <button type="button" className="btn btn-primary btn-full" onClick={() => setMode("verify")}>
                  <Icons.Shield /> Subir foto de perfil
                </button>
              )}
              {profile.verified && (
                <button type="button" className="locate-btn" onClick={() => setMode("verify")}>
                  <Icons.Camera /> Actualizar foto de perfil
                </button>
              )}
            </>
          ) : (
            <>
              <p className="create-hint">
                Sube una selfie clara para tu perfil. No es verificación de identidad oficial.
              </p>
              <FaceVerifyCamera
                photoUrl={facePhoto}
                onCapture={setFacePhoto}
                onClear={() => {
                  setFacePhoto(null);
                  setVerifyError(null);
                }}
                scanning={verifying}
              />
              {verifying && (
                <div className="verify-progress">
                  <div className="verify-progress-bar">
                    <span style={{ width: `${Math.min((verifyStep / 4) * 100, 100)}%` }} />
                  </div>
                  <p>{getVerifyStepLabel(verifyStep)}</p>
                </div>
              )}
              {verifyError && <p className="verify-error">{verifyError}</p>}
              <div className="onboarding-actions">
                <button type="button" className="text-btn" onClick={() => setMode("edit")} disabled={verifying}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!facePhoto || verifying}
                  onClick={handleVerify}
                >
                  {verifying ? "Verificando…" : "Verificar"}
                </button>
              </div>
            </>
          )}
        </div>
    </SheetShell>
  );
}
