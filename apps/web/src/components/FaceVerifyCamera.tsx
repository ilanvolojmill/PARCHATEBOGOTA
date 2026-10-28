import { useRef, useState } from "react";
import { Icons } from "./Icons";

interface FaceVerifyCameraProps {
  photoUrl: string | null;
  onCapture: (dataUrl: string) => void;
  onClear: () => void;
  scanning?: boolean;
}

export function FaceVerifyCamera({
  photoUrl,
  onCapture,
  onClear,
  scanning = false,
}: FaceVerifyCameraProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [usingCamera, setUsingCamera] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onCapture(reader.result as string);
    reader.readAsDataURL(file);
    setUsingCamera(false);
  };

  return (
    <div className={`face-camera ${scanning ? "scanning" : ""}`}>
      {photoUrl ? (
        <>
          <img src={photoUrl} alt="Tu selfie" className="face-preview" />
          {scanning && (
            <>
              <div className="face-scan-line" />
              <div className="face-scan-grid" />
            </>
          )}
          {!scanning && (
            <button type="button" className="face-retake" onClick={onClear}>
              <Icons.Camera /> Repetir foto
            </button>
          )}
        </>
      ) : (
        <div className="face-camera-empty">
          <div className="face-oval-guide" />
          <Icons.User />
          <p>Centra tu rostro en el óvalo</p>
          <div className="face-camera-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setUsingCamera(true);
                fileRef.current?.click();
              }}
            >
              <Icons.Camera /> Tomar selfie
            </button>
            <button
              type="button"
              className="text-btn"
              onClick={() => fileRef.current?.click()}
            >
              Subir desde galería
            </button>
          </div>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture={usingCamera ? "user" : undefined}
        hidden
        onChange={handleFile}
      />
    </div>
  );
}
