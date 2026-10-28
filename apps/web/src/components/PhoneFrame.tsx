import { useEffect, useRef, useState, type ReactNode } from "react";
import { MobilePreview } from "./MobilePreview";

const STORAGE_KEY = "parchexbogota-shell";
type ShellMode = "mobile" | "web";
const LIVE = import.meta.env.PROD;

const MENU_BASE = 260;
const MENU_GROW = 140;
const REVEAL_ZONE = 480;

export function PhoneFrame({ children }: { children: ReactNode }) {
  const [wide, setWide] = useState(false);
  const [mode, setMode] = useState<ShellMode>("web");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "mobile" || saved === "app") setMode("mobile");
    else if (saved === "web") setMode("web");

    const mq = window.matchMedia("(min-width: 1100px)");
    const apply = () => setWide(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const web = LIVE ? wide : wide && mode === "web";
  const preview = !LIVE && wide && mode === "mobile";

  useEffect(() => {
    const root = wrapRef.current;
    if (!web || !root) return;

    let shown = 0;
    let target = 0;
    let focusHeld = false;
    let raf = 0;
    let px = REVEAL_ZONE + 1;
    let py = 0;

    const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tick = () => {
      raf = 0;
      if (reducedMotion()) shown = target;
      else shown += (target - shown) * 0.14;
      if (Math.abs(target - shown) < 0.004) shown = target;
      root.style.setProperty("--nav-reveal", shown.toFixed(3));
      root.classList.toggle("nav-hint-quiet", shown > 0.5);
      if (shown !== target) raf = window.requestAnimationFrame(tick);
    };

    const kick = () => {
      if (!raf) raf = window.requestAnimationFrame(tick);
    };

    const approachAt = (x: number) => (x >= REVEAL_ZONE ? 0 : Math.max(0, (REVEAL_ZONE - x) / REVEAL_ZONE));

    const pointerInside = (x: number, y: number) => {
      const radius = (MENU_BASE + shown * MENU_GROW) / 2;
      const dy = y - window.innerHeight / 2;
      return x >= -12 && x * x + dy * dy <= (radius + 20) * (radius + 20);
    };

    const syncTarget = (overMenu: boolean) => {
      const approach = approachAt(px);
      const desired = focusHeld ? Math.max(approach, 1) : approach;
      target = overMenu ? Math.max(desired, shown) : desired;
      kick();
    };

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      const node = e.target as HTMLElement | null;
      const overMenu = pointerInside(px, py) || !!node?.closest?.(".bottom-nav");
      syncTarget(overMenu);
    };
    const onLeave = () => {
      px = REVEAL_ZONE + 1;
      syncTarget(false);
    };
    const onFocusIn = (e: FocusEvent) => {
      const node = e.target as HTMLElement | null;
      if (node?.closest(".bottom-nav")) {
        focusHeld = true;
        syncTarget(true);
      }
    };
    const onFocusOut = () => {
      window.requestAnimationFrame(() => {
        const active = document.activeElement as HTMLElement | null;
        focusHeld = !!active?.closest(".bottom-nav");
        syncTarget(pointerInside(px, py));
      });
    };

    root.style.setProperty("--nav-reveal", "0");
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      if (raf) window.cancelAnimationFrame(raf);
      root.style.removeProperty("--nav-reveal");
      root.classList.remove("nav-hint-quiet");
    };
  }, [web]);

  const choose = (next: ShellMode) => {
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const formatSwitch = !LIVE && wide ? (
    <div className="shell-switch" role="group" aria-label="Formato">
      <button type="button" aria-pressed={web} onClick={() => choose("web")}>
        Web
      </button>
      <button type="button" aria-pressed={preview} onClick={() => choose("mobile")}>
        Móvil
      </button>
    </div>
  ) : null;

  if (preview) {
    return (
      <div ref={wrapRef} className="demo-wrap shell-mobile">
        {formatSwitch}
        <MobilePreview />
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={`demo-wrap ${web ? "shell-web" : LIVE ? "shell-live" : "shell-app"}`}>
      {!LIVE && !web && <p className="demo-tag">Parcháte Bogotá</p>}
      {formatSwitch}
      <div className="phone" role="presentation">
        <span className="phone-btn phone-btn-vol" aria-hidden />
        <span className="phone-btn phone-btn-power" aria-hidden />
        <div className="phone-notch" aria-hidden>
          <span className="phone-speaker" />
          <span className="phone-camera" />
        </div>
        <div className="phone-screen">{children}</div>
        <span className="phone-home-bar" aria-hidden />
      </div>
    </div>
  );
}
