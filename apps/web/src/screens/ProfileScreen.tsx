import { useState } from "react";
import { useParche } from "../context/ParcheContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { formatTimeAgo, getDirectionsUrl, getWazeUrl } from "../lib/geo";
import { openPrivacyPolicy } from "../lib/legalUrl";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { Icons } from "../components/Icons";

export function ProfileScreen() {
  const {
    profile, parches, userParches, savedSpots, userSpots, spots,
    openEditProfile, openLegal, openAdmin, enablePush, pushEnabled,
    selectSpot, openInbox, openCreate, unreadDmCount, remoteMode, deleteAccount, exportMyData, offlineQueueCount,
    unsaveSpot,
    openIdentity,
  } = useParche();
  const { signOut } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const [deleting, setDeleting] = useState(false);
  const myParches = parches.filter((p) => userParches.includes(p.id));
  const mySpots = spots.filter((s) => userSpots.includes(s.id));

  const handleDelete = async () => {
    if (!confirm("¿Eliminar tu cuenta y datos asociados? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    try {
      await deleteAccount();
      await signOut();
    } catch {
      alert("No se pudo eliminar la cuenta. Escribe a ivolojsavdie@gmail.com");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="profile-screen">
      <div className="profile-col profile-col-main">
      <div className="profile-header">
        <div className="profile-identity">
          <div className="profile-avatar-wrap">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="profile-avatar" />
            ) : (
              <div className="profile-avatar placeholder">{profile.name[0]}</div>
            )}
            {profile.verified && <VerifiedBadge size="sm" />}
          </div>
          <h2>{profile.name}</h2>
          <span className="profile-handle">@{profile.handle}</span>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        </div>
        <div className="profile-data">
        <h3 className="section-title profile-web-only">Datos de usuario</h3>
        {profile.identityStatus === "verified" ? (
          <span className="verified-status verified-status-ok">
            <Icons.Shield /> Cédula verificada por Didit · puedes publicar
          </span>
        ) : (
          <button type="button" className="verify-cta" onClick={openIdentity}>
            <Icons.Shield /> Verificar cédula para publicar
          </button>
        )}
        <p className="profile-selfie-note">
          {profile.identityStatus === "pending"
            ? "Didit está confirmando tu cédula. Mientras tanto no puedes publicar."
            : "La selfie de perfil no basta. Para publicar, Didit tiene que aprobar la cédula."}
        </p>
        <button type="button" className="settings-btn" onClick={openIdentity}>
          {profile.identityStatus === "verified"
            ? "Ver ficha de identidad"
            : profile.identityStatus === "pending"
              ? "Cédula en revisión…"
              : profile.identityStatus === "rejected"
                ? "Reintentar con Didit"
                : "Verificar identidad con cédula"}
        </button>
        {remoteMode && <p className="remote-badge">En vivo</p>}
        {offlineQueueCount > 0 && (
          <p className="offline-queue-badge">{offlineQueueCount} acciones pendientes offline</p>
        )}
        <button type="button" className="settings-btn" onClick={openInbox}>
          Mensajes {unreadDmCount > 0 ? `(${unreadDmCount})` : ""}
        </button>
        <button type="button" className="edit-profile-btn" onClick={openEditProfile}>
          Editar perfil
        </button>
        <div className="profile-stats">
          <div>
            <strong>{savedSpots.length}</strong>
            <span>Spots guardados</span>
          </div>
          <div>
            <strong>{myParches.filter((p) => p.expiresAt > Date.now()).length}</strong>
            <span>Parches activos</span>
          </div>
        </div>
        </div>
      </div>

      <button type="button" className="profile-publish profile-web-only" onClick={openCreate}>
        <span className="profile-publish-plus" aria-hidden>+</span>
        Publicar
      </button>
      </div>

      <div className="profile-col profile-col-lists">
      <h3 className="section-title">Spots guardados</h3>
      {savedSpots.length === 0 ? (
        <p className="empty-msg">
          Desliza a la derecha en Spots para guardar lugares donde quieres parchear.
        </p>
      ) : (
        <div className="saved-spots">
          {savedSpots.map((s) => (
            <article key={s.id} className="saved-spot-card">
              <button
                type="button"
                className="saved-spot-open"
                onClick={() => selectSpot(s)}
              >
                <img src={s.photoUrl} alt="" />
                <span className="sr-only">Ver {s.title}</span>
              </button>
              <div className="saved-spot-body">
                <button type="button" className="saved-spot-open-text" onClick={() => selectSpot(s)}>
                  <span className="saved-spot-title">{s.title}</span>
                  <span className="saved-spot-hood">{s.neighborhood}</span>
                </button>
                <div className="saved-spot-nav">
                  <a href={getDirectionsUrl(s.coords)} target="_blank" rel="noopener noreferrer" className="mini-nav">
                    <Icons.Navigation /> Maps
                  </a>
                  <a href={getWazeUrl(s.coords)} target="_blank" rel="noopener noreferrer" className="mini-nav">
                    Waze
                  </a>
                </div>
              </div>
              <button
                type="button"
                className="saved-spot-remove"
                onClick={() => unsaveSpot(s.id)}
                aria-label={`Quitar «${s.title}» de guardados`}
              >
                <Icons.Trash />
              </button>
            </article>
          ))}
        </div>
      )}

      <h3 className="section-title">Mis parches en vivo</h3>
      {myParches.length === 0 ? (
        <p className="empty-msg">Aún no has publicado ningún parche en el mapa.</p>
      ) : (
        <div className="my-parches">
          {myParches.map((p) => (
            <div key={p.id} className="my-parche-item">
              <img src={p.photoUrl} alt="" />
              <div>
                <span>{p.title}</span>
                <small>{formatTimeAgo(p.createdAt)}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {mySpots.length > 0 && (
        <>
          <h3 className="section-title">Mis spots en la nube</h3>
          <div className="my-parches">
            {mySpots.map((s) => (
              <div key={s.id} className="my-parche-item">
                <img src={s.photoUrl} alt="" />
                <div>
                  <span>{s.title}</span>
                  <small>{s.neighborhood} · {formatTimeAgo(s.createdAt)}</small>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      </div>

      <div className="profile-col profile-col-side">
      <section className="profile-bio-card profile-web-only" aria-label="Biografía personal y pública">
        <h3 className="profile-bio-title">Biografía personal y pública</h3>
        {profile.bio ? (
          <p className="profile-bio-text">{profile.bio}</p>
        ) : (
          <p className="profile-bio-text profile-bio-empty">
            Aún no has escrito tu biografía. Cuéntale a Bogotá quién eres.
          </p>
        )}
        <button type="button" className="profile-bio-edit" onClick={openEditProfile}>
          Editar biografía
        </button>
      </section>

      <section className="profile-settings">
        <h3 className="section-title">Ajustes</h3>
        <button
          type="button"
          className="settings-btn theme-toggle-row"
          onClick={toggleDark}
          aria-pressed={isDark}
        >
          <span>Modo noche</span>
          <span className={`theme-switch ${isDark ? "on" : ""}`} aria-hidden>
            <span className="theme-switch-knob" />
          </span>
        </button>
        <button type="button" className="settings-btn" onClick={() => enablePush()}>
          {pushEnabled
            ? "Alertas locales activas (push remoto requiere Firebase)"
            : "Activar alertas (locales; push remoto con Firebase)"}
        </button>
        <button type="button" className="settings-btn" onClick={() => void exportMyData()}>
          Exportar mis datos (ARCO)
        </button>
        <button type="button" className="settings-btn" onClick={openPrivacyPolicy}>
          Política de privacidad
        </button>
        <button type="button" className="settings-btn" onClick={() => openLegal("terms")}>
          Términos y condiciones
        </button>
        {(profile.isAdmin || !remoteMode) && (
          <button type="button" className="settings-btn admin-link" onClick={openAdmin}>
            Panel de moderación
          </button>
        )}
        <button type="button" className="settings-btn" onClick={() => signOut()}>
          Cerrar sesión
        </button>
        <button
          type="button"
          className="settings-btn danger-link"
          disabled={deleting}
          onClick={() => void handleDelete()}
        >
          {deleting ? "Eliminando…" : "Eliminar cuenta"}
        </button>
      </section>
      </div>
    </div>
  );
}
