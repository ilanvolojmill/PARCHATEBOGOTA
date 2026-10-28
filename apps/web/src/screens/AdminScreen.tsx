import { useState } from "react";
import { useParche } from "../context/ParcheContext";
import type { Report } from "../lib/types";

function hostIdForReport(
  r: Report,
  parches: { id: string; hostId?: string }[],
  spots: { id: string; hostId?: string }[]
): string | null {
  if (r.targetType === "user") return r.targetId;
  if (r.targetType === "parche") return parches.find((p) => p.id === r.targetId)?.hostId ?? null;
  if (r.targetType === "spot") return spots.find((s) => s.id === r.targetId)?.hostId ?? null;
  return null;
}

export function AdminScreen() {
  const {
    adminOpen, closeAdmin, adminAuthed, loginAdmin, profile, remoteMode,
    reports, parches, spots, moderateHide, moderateDismissReport, banUser, unbanUser,
  } = useParche();
  const [pin, setPin] = useState("");
  const [unbanId, setUnbanId] = useState("");

  if (!adminOpen) return null;

  if (!adminAuthed) {
    if (remoteMode && profile.isAdmin) {
      loginAdmin("");
      return null;
    }
    return (
      <aside className="admin-overlay">
        <section className="admin-panel">
          <h2>Panel de moderación</h2>
          {remoteMode ? (
            <p>Solo cuentas con <code>is_admin</code> en Supabase pueden entrar.</p>
          ) : (
            <p>Modo demo: ingresa el PIN local</p>
          )}
          {!remoteMode && (
            <>
              <input
                type="password"
                className="onboarding-input"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN"
              />
              <button type="button" className="btn btn-primary btn-full" onClick={() => loginAdmin(pin)}>
                Entrar
              </button>
            </>
          )}
          <button type="button" className="text-btn" onClick={closeAdmin}>Cancelar</button>
        </section>
      </aside>
    );
  }

  const pending = reports.filter((r) => r.status === "pending");

  return (
    <aside className="admin-overlay">
      <section className="admin-panel admin-panel-wide">
        <header className="create-header">
          <h2>Moderación</h2>
          <button type="button" className="text-btn" onClick={closeAdmin}>Salir</button>
        </header>
        <h3>Reportes pendientes ({pending.length})</h3>
        <ul className="admin-list">
          {pending.length === 0 && <li className="comments-empty">Sin reportes pendientes</li>}
          {pending.map((r) => {
            const hostId = hostIdForReport(r, parches, spots);
            return (
              <li key={r.id} className="admin-item">
                <strong>{r.targetLabel}</strong>
                <span>{r.reason}</span>
                <small>por @{r.reporterHandle}</small>
                <div className="admin-actions">
                  {r.targetType !== "user" && (
                    <button
                      type="button"
                      className="text-btn accent"
                      onClick={() => moderateHide(r.targetType as "parche" | "spot", r.targetId)}
                    >
                      Ocultar
                    </button>
                  )}
                  {hostId && (
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => banUser(hostId)}
                    >
                      Banear usuario
                    </button>
                  )}
                  <button type="button" className="text-btn" onClick={() => moderateDismissReport(r.id)}>
                    Descartar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <h3>Desbanear usuario</h3>
        <div className="admin-unban">
          <input
            className="onboarding-input"
            placeholder="UUID del usuario"
            value={unbanId}
            onChange={(e) => setUnbanId(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (unbanId.trim()) {
                unbanUser(unbanId.trim());
                setUnbanId("");
              }
            }}
          >
            Desbanear
          </button>
        </div>
        <h3>Contenido activo</h3>
        <p className="create-hint">{parches.filter((p) => !p.hidden).length} parches · {spots.filter((s) => !s.hidden).length} spots</p>
      </section>
    </aside>
  );
}
