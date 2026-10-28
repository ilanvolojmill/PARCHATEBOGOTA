import type { ContentTargetType, ShareTarget } from "./types";
import { APP_URL } from "./env";

export function buildShareUrl(type: ContentTargetType, id: string): string {
  const base = APP_URL.replace(/\/$/, "");
  return `${base}/?${type}=${id}`;
}

export function parseDeepLink(): { type: ContentTargetType; id: string } | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const parche = params.get("parche");
  if (parche) return { type: "parche", id: parche };
  const spot = params.get("spot");
  if (spot) return { type: "spot", id: spot };
  return null;
}

export function clearDeepLink() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("parche");
  url.searchParams.delete("spot");
  window.history.replaceState({}, "", url.pathname + url.search);
}

export async function shareContent(target: ShareTarget) {
  const url = buildShareUrl(target.type, target.id);
  const text = `${target.title} — Parcháte Bogotá\n${url}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: target.title, text, url });
      return "native";
    } catch {
      /* user cancelled */
    }
  }
  return copyToClipboard(text);
}

export async function shareWhatsApp(target: ShareTarget) {
  const url = buildShareUrl(target.type, target.id);
  const text = encodeURIComponent(`${target.title} — mira este parche en Bogotá: ${url}`);
  window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
}

export function shareInstagramHint(target: ShareTarget) {
  const url = buildShareUrl(target.type, target.id);
  return {
    url,
    hint: "Descarga la foto del parche y compártela en Instagram Stories. Enlace copiado al portapapeles.",
  };
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function downloadImageForStory(photoUrl: string, filename: string) {
  try {
    const res = await fetch(photoUrl);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    return true;
  } catch {
    return false;
  }
}

/** Normaliza a dígitos con indicativo (Colombia 57 si son 10 dígitos que empiezan en 3). */
export function normalizeWhatsApp(input: string): string | undefined {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 10) return undefined;
  if (digits.length === 10 && digits.startsWith("3")) return `57${digits}`;
  return digits;
}

export function formatWhatsAppDisplay(whatsapp: string): string {
  const n = normalizeWhatsApp(whatsapp) ?? whatsapp.replace(/\D/g, "");
  if (n.startsWith("57") && n.length === 12) {
    return `+57 ${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;
  }
  return n.startsWith("+") ? n : `+${n}`;
}

export function whatsAppChatUrl(whatsapp: string, pretext?: string): string {
  const n = normalizeWhatsApp(whatsapp) ?? whatsapp.replace(/\D/g, "");
  const q = pretext ? `?text=${encodeURIComponent(pretext)}` : "";
  return `https://wa.me/${n}${q}`;
}

