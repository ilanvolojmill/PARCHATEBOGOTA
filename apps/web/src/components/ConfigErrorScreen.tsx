import { getConfigError } from "../lib/env";

export function ConfigErrorScreen() {
  const error = getConfigError();

  return (
    <div className="app-root config-error">
      <section className="config-error-panel">
        <h1>Parcháte Bogotá</h1>
        <p className="config-error-lead">La app no puede arrancar en producción sin backend configurado.</p>
        {error && <p className="config-error-detail">{error}</p>}
        <ul className="config-error-list">
          <li>Configura <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en tu hosting.</li>
          <li>Ejecuta las migraciones SQL en Supabase (ver <code>PASO_A_PASO_PUBLICAR.md</code>).</li>
          <li>Redeploy después de guardar las variables.</li>
        </ul>
      </section>
    </div>
  );
}
