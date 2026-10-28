import { useEffect, useState } from "react";

/*
 * Vista previa del sitio en el navegador de un teléfono.
 * Cada pantalla es un iframe de la propia app: al medir <768px de ancho
 * la app ya se muestra a pantalla completa, igual que en un móvil real.
 */

const IPHONE = { w: 413, h: 872 };
const SAMSUNG = { w: 376, h: 796 };
const GAP = 72;
const SIDE_PAD = 140;
const VERT_PAD = 130;

function useFitScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const calc = () => {
      const byH = (window.innerHeight - VERT_PAD) / IPHONE.h;
      const byW = (window.innerWidth - SIDE_PAD) / (IPHONE.w + SAMSUNG.w + GAP);
      setScale(Math.max(0.45, Math.min(1, byH, byW)));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return scale;
}

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

const StatusIcons = () => (
  <span className="mdev-status-icons" aria-hidden>
    <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
      <rect x="0" y="8" width="3" height="4" rx="0.8" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
      <rect x="10" y="3" width="3" height="9" rx="0.8" />
      <rect x="15" y="0" width="3" height="12" rx="0.8" />
    </svg>
    <svg width="16" height="12" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <path d="M2 6.5a15 15 0 0 1 20 0" />
      <path d="M6 11a9 9 0 0 1 12 0" />
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
    <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
      <rect x="0.6" y="0.6" width="22" height="10.8" rx="3.2" stroke="currentColor" opacity="0.5" />
      <rect x="2.2" y="2.2" width="17" height="7.6" rx="1.8" fill="currentColor" />
      <rect x="24" y="4" width="1.6" height="4" rx="0.8" fill="currentColor" opacity="0.5" />
    </svg>
  </span>
);

const toolIcon = (d: string) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

function IphoneSafari({ src }: { src: string }) {
  return (
    <div className="mdev mdev-iphone" style={{ width: IPHONE.w, height: IPHONE.h }}>
      <div className="mdev-screen">
        <div className="mdev-status mdev-status-ios" aria-hidden>
          <span className="mdev-time">9:41</span>
          <span className="mdev-island" />
          <StatusIcons />
        </div>
        <div className="mdev-view">
          <iframe title="Parcháte Bogotá en Safari (iPhone)" src={src} />
        </div>
        <div className="mdev-safari" aria-hidden>
          <div className="mdev-safari-url">
            <span className="mdev-aa">
              A<small>A</small>
            </span>
            <span className="mdev-url-text">
              <LockIcon /> parchatebogota.app
            </span>
            {toolIcon("M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7")}
          </div>
          <div className="mdev-safari-tools">
            {toolIcon("M15 5l-7 7 7 7")}
            {toolIcon("M9 5l7 7-7 7")}
            {toolIcon("M12 15V3m0 0L8 7m4-4l4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1")}
            {toolIcon("M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16l-8-4-8 4z")}
            {toolIcon("M8 3h11a2 2 0 0 1 2 2v11M3 8h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z")}
          </div>
          <span className="mdev-home-indicator" />
        </div>
      </div>
    </div>
  );
}

function SamsungChrome({ src }: { src: string }) {
  return (
    <div className="mdev mdev-samsung" style={{ width: SAMSUNG.w, height: SAMSUNG.h }}>
      <div className="mdev-screen">
        <div className="mdev-status mdev-status-and" aria-hidden>
          <span className="mdev-time">12:30</span>
          <span className="mdev-punch" />
          <StatusIcons />
        </div>
        <div className="mdev-chrome" aria-hidden>
          <span className="mdev-chrome-pill">
            <LockIcon />
            <span>parchatebogota.app</span>
          </span>
          <span className="mdev-chrome-tabs">1</span>
          <span className="mdev-chrome-more">
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className="mdev-view">
          <iframe title="Parcháte Bogotá en Chrome (Samsung Galaxy)" src={src} />
        </div>
        <div className="mdev-androidnav" aria-hidden>
          <span />
        </div>
      </div>
    </div>
  );
}

export function MobilePreview() {
  const scale = useFitScale();
  const src = "/";

  const slot = (dim: { w: number; h: number }) => ({
    width: dim.w * scale,
    height: dim.h * scale,
  });

  return (
    <div className="mobile-preview">
      <div className="mobile-stage" style={{ gap: GAP * scale }}>
        <figure className="mobile-device">
          <div className="mdev-slot" style={slot(IPHONE)}>
            <div className="mdev-scale" style={{ transform: `scale(${scale})` }}>
              <IphoneSafari src={src} />
            </div>
          </div>
          <figcaption>iPhone · Safari</figcaption>
        </figure>
        <figure className="mobile-device">
          <div className="mdev-slot" style={slot(SAMSUNG)}>
            <div className="mdev-scale" style={{ transform: `scale(${scale})` }}>
              <SamsungChrome src={src} />
            </div>
          </div>
          <figcaption>Samsung Galaxy · Chrome</figcaption>
        </figure>
      </div>
    </div>
  );
}
