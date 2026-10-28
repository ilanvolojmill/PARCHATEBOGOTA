import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useParche } from "../context/ParcheContext";
import { FaceVerifyCamera } from "../components/FaceVerifyCamera";
import { VerifiedBadge } from "../components/VerifiedBadge";
import {
  getVerifyStepLabel,
  sanitizeHandle,
  confirmSelfieFlow,
} from "../lib/verify";

type OnboardPhase = "intro" | "profile" | "photo" | "success";

function nameFromUser(user: ReturnType<typeof useAuth>["user"]): string {
  if (!user) return "";
  const meta = user.user_metadata ?? {};
  return (
    meta.full_name ||
    meta.name ||
    meta.given_name ||
    user.email?.split("@")[0] ||
    ""
  );
}

export function OnboardingScreen() {
  const { user, configured } = useAuth();
  const { completeOnboarding, finishOnboarding } = useParche();
  const [introStep, setIntroStep] = useState(0);
  const [phase, setPhase] = useState<OnboardPhase>(configured ? "profile" : "intro");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    const n = nameFromUser(user);
    if (n && !name) {
      setName(n);
      setHandle(sanitizeHandle(n) + ".bog");
    }
  }, [user, name]);

  const introSlides = [
    {
      emoji: "1",
      title: "Parcháte Bogotá",
      text: "Parches y lugares en Bogotá, en un mapa claro.",
    },
    {
      emoji: "2",
      title: "Entra con tu cuenta",
      text: "Google, Microsoft o Apple. Luego eliges tu usuario.",
    },
    {
      emoji: "3",
      title: "Publica con foto",
      text: "Una foto de cara en el perfil. Simple y reconocible.",
    },
  ];

  const handleNameChange = (value: string) => {
    setName(value);
    if (!handle || handle === sanitizeHandle(name) + ".bog") {
      setHandle(sanitizeHandle(value) + ".bog");
    }
  };

  const runPhotoConfirm = async () => {
    if (!facePhoto) return;
    setVerifying(true);
    setVerifyError(null);
    setVerifyStep(0);
    const result = await confirmSelfieFlow(setVerifyStep);
    setVerifying(false);

    if (result.phase === "rejected") {
      setVerifyError(result.message);
      return;
    }

    await completeOnboarding({
      name: name.trim(),
      handle: sanitizeHandle(handle.replace(/\.bog$/, "")) + ".bog",
      bio: bio.trim(),
      facePhotoUrl: facePhoto,
      avatarUrl: facePhoto,
      verified: true,
      verifiedAt: Date.now(),
      verificationId: result.verificationId,
    });
    setPhase("success");
  };

  if (phase === "success") {
    return (
      <div className="onboarding onboarding-success">
        <VerifiedBadge size="md" showLabel />
        <h1>¡Listo, {name.split(" ")[0]}!</h1>
        <p>Tu cuenta, @usuario y foto quedaron listos. Ya puedes explorar y publicar.</p>
        <div className="success-avatar-wrap">
          {facePhoto && <img src={facePhoto} alt="" className="success-avatar" />}
          <VerifiedBadge size="sm" />
        </div>
        <button type="button" className="btn btn-primary btn-full" onClick={() => void finishOnboarding()}>
          Explorar Bogotá
        </button>
      </div>
    );
  }

  if (phase === "photo") {
    return (
      <div className="onboarding onboarding-verify">
        <div className="onboarding-content full">
          <h1>Foto de tu cara</h1>
          <p>
            Sube una selfie clara. Se guarda en tu perfil para que la comunidad sepa quién publica.
            No es verificación de cédula.
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
            <button type="button" className="text-btn" onClick={() => setPhase("profile")} disabled={verifying}>
              Atrás
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!facePhoto || verifying}
              onClick={() => void runPhotoConfirm()}
            >
              {verifying ? "Guardando…" : "Confirmar foto"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "profile") {
    const handleValid = sanitizeHandle(handle.replace(/\.bog$/, "")).length >= 3;
    return (
      <div className="onboarding">
        <div className="onboarding-content full">
          <h1>Tu perfil</h1>
          <p>
            {configured
              ? "Elige cómo te ven en Parcháte Bogotá."
              : "Crea tu perfil. En producción entrarás primero con tu cuenta."}
          </p>

          <label className="field">
            <span>Nombre</span>
            <input
              type="text"
              placeholder="Tu nombre o apodo"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              maxLength={24}
              autoFocus
            />
          </label>

          <label className="field">
            <span>Username</span>
            <div className="handle-input">
              <span>@</span>
              <input
                type="text"
                value={handle.replace(/\.bog$/, "")}
                onChange={(e) => setHandle(sanitizeHandle(e.target.value) + ".bog")}
                maxLength={20}
              />
              <span className="handle-suffix">.bog</span>
            </div>
          </label>

          <label className="field">
            <span>Bio (opcional)</span>
            <textarea
              placeholder="Qué te gusta, dónde sueles parchear..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              maxLength={120}
            />
          </label>

          <button
            type="button"
            className="btn btn-primary btn-full"
            disabled={!name.trim() || !handleValid}
            onClick={() => setPhase("photo")}
          >
            Continuar — subir foto
          </button>
        </div>
      </div>
    );
  }

  const s = introSlides[introStep];
  return (
    <div className="onboarding">
      <div className="onboarding-visual">
        <span className="onboarding-emoji" aria-hidden>
          {s.emoji}
        </span>
      </div>
      <div className="onboarding-content">
        <h1>{s.title}</h1>
        <p>{s.text}</p>
        <div
          className="onboarding-dots"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={introSlides.length}
          aria-valuenow={introStep + 1}
          aria-label={`Paso ${introStep + 1} de ${introSlides.length}`}
        >
          {introSlides.map((_, i) => (
            <span key={i} className={`dot ${i === introStep ? "active" : ""}`} />
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-full"
          onClick={() => {
            if (introStep === introSlides.length - 1) setPhase("profile");
            else setIntroStep(introStep + 1);
          }}
        >
          {introStep === introSlides.length - 1 ? "Crear perfil" : "Siguiente"}
        </button>
      </div>
    </div>
  );
}
