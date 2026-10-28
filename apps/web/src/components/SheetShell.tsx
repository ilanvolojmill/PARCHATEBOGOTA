import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useModalEscape } from "../hooks/useModalEscape";

const CLOSE_AT = 96;

interface SheetShellProps {
  onClose: () => void;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}

/** Hoja inferior que sigue el dedo en el asa y se puede cancelar. */
export function SheetShell({ onClose, labelledBy, className = "", children }: SheetShellProps) {
  useModalEscape(true, onClose);
  const [y, setY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const origin = useRef(0);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 280);
    return () => window.clearTimeout(id);
  }, []);

  const reduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (reduced()) return;
    if (!(e.target as HTMLElement).closest(".sheet-handle")) return;
    origin.current = e.clientY - y;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!dragging) return;
    setY(Math.max(0, e.clientY - origin.current));
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (y > CLOSE_AT) onClose();
    else setY(0);
  };

  const shade = Math.max(0.15, 1 - y / 320);

  return (
    <div
      className="sheet-backdrop"
      style={{ ["--sheet-shade" as string]: shade }}
      onClick={onClose}
      role="presentation"
    >
      <section
        className={`sheet ${className} ${dragging ? "is-dragging" : ""} ${ready ? "is-ready" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        style={{
          transform: y > 0 ? `translateY(${y}px)` : undefined,
          transition: dragging ? "none" : "transform var(--dur-exit) var(--ease-out)",
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="sheet-handle" aria-hidden />
        {children}
      </section>
    </div>
  );
}
