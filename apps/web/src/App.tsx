import { useEffect, useState, type ReactNode } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ParcheProvider, useParche } from "./context/ParcheContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ConfigErrorScreen } from "./components/ConfigErrorScreen";
import { BannedScreen } from "./screens/BannedScreen";
import { isAppReady } from "./lib/env";
import { hapticLight } from "./lib/native";
import { Icons } from "./components/Icons";
import { ParcheSheet } from "./components/ParcheSheet";
import { SpotDetailSheet } from "./components/SpotDetailSheet";
import { CreateParcheSheet } from "./components/CreateParcheSheet";
import { CreateSpotSheet } from "./components/CreateSpotSheet";
import { EditProfileSheet } from "./components/EditProfileSheet";
import { InviteRequestSheet } from "./components/InviteRequestSheet";
import { PeerProfileSheet } from "./components/PeerProfileSheet";
import { ReportSheet } from "./components/ReportSheet";
import { ShareSheet } from "./components/ShareSheet";
import { LegalSheet } from "./components/LegalSheet";
import { IdentityVerifySheet } from "./components/IdentityVerifySheet";
import { CookieBanner } from "./components/CookieBanner";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { GUEST_MESSAGE } from "./components/GuestNotice";
import { MapScreen } from "./screens/MapScreen";
import { SpotsScreen } from "./screens/SpotsScreen";
import { MessagesScreen } from "./screens/MessagesScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { AdminScreen } from "./screens/AdminScreen";
import type { Tab, ToastMessage } from "./lib/types";
import { PhoneFrame } from "./components/PhoneFrame";
import { AgeGate, hasConfirmedAge } from "./components/AgeGate";
import { IntroSplash } from "./components/IntroSplash";
import "./App.css";

const NAV: { tab: Tab; label: string; icon: keyof typeof Icons }[] = [
  { tab: "map", label: "Mapa", icon: "Map" },
  { tab: "spots", label: "Spots", icon: "Spots" },
  { tab: "create", label: "Publicar", icon: "Plus" },
  { tab: "messages", label: "Mensajes", icon: "Send" },
  { tab: "profile", label: "Perfil", icon: "User" },
];

function ToastBanner({ toast }: { toast: ToastMessage | null }) {
  const [shown, setShown] = useState<ToastMessage | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (toast) {
      setShown(toast);
      setLeaving(false);
      return;
    }
    if (!shown) return;
    setLeaving(true);
    const id = window.setTimeout(() => {
      setShown(null);
      setLeaving(false);
    }, 220);
    return () => window.clearTimeout(id);
  }, [toast, shown]);

  if (!shown) return null;

  return (
    <p
      className={`toast toast-${shown.type ?? "info"} ${leaving ? "is-leaving" : ""}`}
      role="status"
      aria-live={shown.type === "error" ? "assertive" : "polite"}
    >
      {shown.text}
    </p>
  );
}

function AppShell() {
  const { configured, loading, isGuest, profile: authProfile } = useAuth();
  const {
    onboardingDone, tab, setTab, openCreate, toast, activeParches, deckSpots,
    remoteMode, unreadDmCount, openInbox, profile, showToast,
  } = useParche();

  if (configured && loading) {
    return (
      <div className="app-root" role="status" aria-live="polite" aria-busy="true">
        <div className="app-loading">
          <span className="sr-only">Cargando sesión…</span>
          <span className="skeleton skeleton-title" />
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-block" />
        </div>
      </div>
    );
  }

  if (profile.isBanned || authProfile?.isBanned) {
    return (
      <div className="app-root">
        <BannedScreen />
      </div>
    );
  }

  // Visitantes (sin sesión) llegan directo al mapa en modo solo lectura.
  if (!isGuest && !onboardingDone) {
    return (
      <div className="app-root">
        <OnboardingScreen />
        <CookieBanner />
      </div>
    );
  }

  const handleNav = (t: Tab) => {
    void hapticLight();
    if (isGuest && t !== "map") {
      showToast(GUEST_MESSAGE, "info");
      return;
    }
    if (t === "create") openCreate();
    else if (t === "messages") openInbox();
    else setTab(t);
  };

  const tagLabel = tab === "spots"
    ? `${deckSpots.length} spots${remoteMode ? " en vivo" : ""}`
    : `${activeParches.length} parches activos`;

  const inboxLabel = unreadDmCount > 0
    ? `Mensajes, ${unreadDmCount} sin leer`
    : "Mensajes";

  return (
    <div className="app-root">
      <IntroSplash onReveal={() => setTab("map")} />
      <header className="app-topbar">
        <div className="app-topbar-brand">
          <span className="app-brand">Parcháte bogotá</span>
          <span className="app-tag">{tagLabel}</span>
        </div>
        {!isGuest && (
          <button type="button" className="inbox-top-btn" onClick={openInbox} aria-label={inboxLabel}>
            <Icons.Send />
            {unreadDmCount > 0 && (
              <span className="nav-badge" aria-hidden>{unreadDmCount}</span>
            )}
          </button>
        )}
      </header>

      <main className="app-main">
        {(isGuest || tab === "map") && <MapScreen />}
        {!isGuest && tab === "spots" && <SpotsScreen />}
        {!isGuest && tab === "messages" && <MessagesScreen />}
        {!isGuest && tab === "profile" && <ProfileScreen />}
      </main>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {NAV.map(({ tab: t, label, icon }) => {
          const Icon = Icons[icon];
          const locked = isGuest && t !== "map";
          const active = t === "create" ? false : (isGuest ? t === "map" : tab === t);
          const badge = t === "messages" && !isGuest ? unreadDmCount : 0;
          const ariaLabel = locked
            ? `${label} (requiere registro)`
            : badge > 0 ? `${label}, ${badge} sin leer` : label;
          return (
            <button
              key={t}
              type="button"
              className={`nav-item ${t === "create" ? "nav-create" : ""} ${active ? "active" : ""} ${locked ? "nav-locked" : ""}`}
              onClick={() => handleNav(t)}
              aria-disabled={locked || undefined}
              aria-label={ariaLabel}
              aria-current={active ? "page" : undefined}
            >
              {t === "create" ? (
                <>
                  <span className="create-btn" aria-hidden><Icon /></span>
                  <span className="nav-create-label">{label}</span>
                </>
              ) : (
                <>
                  <span className="nav-icon-wrap" aria-hidden>
                    <Icon />
                    {badge > 0 && <span className="nav-badge nav-item-badge">{badge > 9 ? "9+" : badge}</span>}
                  </span>
                  <span className="nav-label">{label}</span>
                </>
              )}
            </button>
          );
        })}
      </nav>

      {!isGuest && (
        <>
          <ParcheSheet />
          <SpotDetailSheet />
          <CreateParcheSheet />
          <CreateSpotSheet />
          <EditProfileSheet />
          <InviteRequestSheet />
          <ReportSheet />
          <ShareSheet />
          <IdentityVerifySheet />
          <PeerProfileSheet />
          <AdminScreen />
        </>
      )}
      <LegalSheet />
      <CookieBanner />

      <ToastBanner toast={toast} />
    </div>
  );
}

function AppWithAgeGate({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState(hasConfirmedAge);
  if (!ok) return <AgeGate onConfirm={() => setOk(true)} />;
  return <>{children}</>;
}

export default function App() {
  if (!isAppReady) {
    return (
      <ThemeProvider>
        <PhoneFrame>
          <ConfigErrorScreen />
        </PhoneFrame>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <PhoneFrame>
        <AppWithAgeGate>
          <AuthProvider>
            <ParcheProvider>
              <AppShell />
            </ParcheProvider>
          </AuthProvider>
        </AppWithAgeGate>
      </PhoneFrame>
    </ThemeProvider>
  );
}
