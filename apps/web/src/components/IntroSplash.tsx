import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "parchexbogota-intro-shown";

/**
 * Splash de apertura: rojo de marca → se difumina en 2s.
 * Luego puedes reemplazar el contenido por tu animación custom.
 */
export function IntroSplash({ onReveal }: { onReveal?: () => void }) {
  const [visible, setVisible] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const [fading, setFading] = useState(false);
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  useEffect(() => {
    if (!visible) return;
    onRevealRef.current?.();

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch { /* noop */ }
      setVisible(false);
      return;
    }

    const fadeAt = window.setTimeout(() => setFading(true), 1100);
    const doneAt = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch { /* noop */ }
      setVisible(false);
    }, 2000);

    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(doneAt);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`intro-splash ${fading ? "is-fading" : ""}`}
      role="presentation"
      aria-hidden
    >
      <div className="intro-splash-fill" />
      <div className="intro-splash-mark" />
    </div>
  );
}
