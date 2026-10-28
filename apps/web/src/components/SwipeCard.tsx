import { useRef, useState, type PointerEvent } from "react";
import { VIBE_COLORS, VIBE_LABELS } from "../lib/constants";
import type { Spot } from "../lib/types";
import { InviteBadge } from "./InviteBadge";

const SWIPE_THRESHOLD = 100;
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

interface SwipeCardProps {
  spot: Spot;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
}

export function SwipeCard({ spot, onSwipeLeft, onSwipeRight, isTop }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const startRef = useRef({ x: 0, y: 0 });

  const rotation = drag.x * 0.08;
  const saveOpacity = Math.min(Math.max(drag.x / SWIPE_THRESHOLD, 0), 1);
  const nopeOpacity = Math.min(Math.max(-drag.x / SWIPE_THRESHOLD, 0), 1);

  const finishSwipe = (dx: number) => {
    if (dx > SWIPE_THRESHOLD) {
      flyOut("right");
      setTimeout(onSwipeRight, 320);
    } else if (dx < -SWIPE_THRESHOLD) {
      flyOut("left");
      setTimeout(onSwipeLeft, 320);
    } else {
      setDrag({ x: 0, y: 0, active: false });
    }
  };

  const flyOut = (dir: "left" | "right") => {
    if (cardRef.current) {
      cardRef.current.style.transition = `transform 280ms ${EASE}, opacity 220ms ${EASE}`;
      cardRef.current.style.transform = `translateX(${dir === "right" ? 500 : -500}px) rotate(${dir === "right" ? 20 : -20}deg)`;
      cardRef.current.style.opacity = "0";
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!isTop) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX - drag.x, y: e.clientY - drag.y };
    setDrag((d) => ({ ...d, active: true }));
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!drag.active || !isTop) return;
    setDrag({
      x: e.clientX - startRef.current.x,
      y: (e.clientY - startRef.current.y) * 0.3,
      active: true,
    });
  };

  const onPointerUp = () => {
    if (!drag.active) return;
    finishSwipe(drag.x);
    setDrag((d) => ({ ...d, active: false }));
  };

  const style = isTop
    ? {
        transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)`,
        transition: drag.active ? "none" : `transform 280ms ${EASE}`,
        zIndex: 10,
        cursor: drag.active ? "grabbing" : "grab",
      }
    : {
        zIndex: 1,
        transform: "scale(0.96) translateY(8px)",
        opacity: 0.72,
        transition: "opacity 160ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1)",
      };

  return (
    <div
      ref={cardRef}
      className="swipe-card"
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img src={spot.photoUrl} alt={spot.title} className="swipe-card-img" draggable={false} />
      <div className="swipe-card-gradient" />
      {isTop && (
        <>
          <span className="swipe-stamp swipe-stamp-save" style={{ opacity: saveOpacity }}>
            GUARDAR
          </span>
          <span className="swipe-stamp swipe-stamp-nope" style={{ opacity: nopeOpacity }}>
            NOPE
          </span>
        </>
      )}
      <div className="swipe-card-info">
        <div className="swipe-badges">
          <span
            className="swipe-vibe"
            style={{ background: VIBE_COLORS[spot.vibe] }}
          >
            {VIBE_LABELS[spot.vibe]}
          </span>
          {spot.inviteOnly && <InviteBadge />}
        </div>
        <h3>{spot.title}</h3>
        <p className="swipe-neighborhood">{spot.neighborhood}</p>
      </div>
    </div>
  );
}
