import { useParche } from "../context/ParcheContext";
import { track } from "../lib/analytics";
import {
  copyToClipboard,
  downloadImageForStory,
  shareContent,
  shareWhatsApp,
  buildShareUrl,
} from "../lib/share";
import { SheetShell } from "./SheetShell";
import { Icons } from "./Icons";

export function ShareSheet() {
  const { shareOpen, shareTarget, closeShare, showToast } = useParche();
  if (!shareOpen || !shareTarget) return null;

  const handleNative = async () => {
    await shareContent(shareTarget);
    track("Share", { type: shareTarget.type, channel: "native" });
    closeShare();
  };

  const handleWhatsApp = () => {
    shareWhatsApp(shareTarget);
    track("Share", { channel: "whatsapp" });
    closeShare();
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(buildShareUrl(shareTarget.type, shareTarget.id));
    showToast(ok ? "Enlace copiado" : "No se pudo copiar", ok ? "success" : "error");
    closeShare();
  };

  const handleInstagram = async () => {
    await downloadImageForStory(shareTarget.photoUrl, "parchexbogota-story.jpg");
    await copyToClipboard(buildShareUrl(shareTarget.type, shareTarget.id));
    showToast("Foto descargada + enlace copiado. Súbelo a Instagram Stories", "info");
    track("Share", { channel: "instagram" });
    closeShare();
  };

  return (
    <SheetShell onClose={closeShare} labelledBy="share-sheet-title" className="share-sheet">
        <h2 id="share-sheet-title">Compartir</h2>
        <p className="create-hint">{shareTarget.title}</p>
        <div className="share-actions">
          <button type="button" className="share-btn" onClick={handleWhatsApp}>
            WhatsApp
          </button>
          <button type="button" className="share-btn" onClick={handleInstagram}>
            Instagram Story
          </button>
          <button type="button" className="share-btn" onClick={handleNative}>
            <Icons.Share /> Compartir
          </button>
          <button type="button" className="share-btn" onClick={handleCopy}>
            Copiar enlace
          </button>
        </div>
    </SheetShell>
  );
}
