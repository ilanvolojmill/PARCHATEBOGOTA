import { useAuth } from "../context/AuthContext";

export function BannedScreen() {
  const { signOut } = useAuth();

  return (
    <div className="app-root config-error">
      <section className="config-error-panel">
        <h1>Cuenta suspendida</h1>
        <p className="config-error-lead">
          Tu cuenta fue suspendida por incumplir las normas de la comunidad.
        </p>
        <p className="config-error-detail">
          Si crees que es un error, escribe a ivolojsavdie@gmail.com
        </p>
        <button type="button" className="btn btn-primary btn-full" onClick={() => signOut()}>
          Cerrar sesión
        </button>
      </section>
    </div>
  );
}
