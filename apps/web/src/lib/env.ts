const url = import.meta.env.VITE_SUPABASE_URL ?? "";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(url && key);

export const isProductionBuild = import.meta.env.PROD;

/** En build de producción, Supabase es obligatorio */
export const requiresSupabase = isProductionBuild;

export const isAppReady = !requiresSupabase || isSupabaseConfigured;

export function getConfigError(): string | null {
  if (!requiresSupabase) return null;
  if (!url) return "Falta VITE_SUPABASE_URL en variables de entorno";
  if (!key) return "Falta VITE_SUPABASE_ANON_KEY en variables de entorno";
  if (!url.includes("supabase.co") && !url.includes("localhost")) {
    return "VITE_SUPABASE_URL no parece válida";
  }
  return null;
}

export const APP_URL =
  import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "https://parchexbogota.com");

export const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || (isProductionBuild ? "" : "bogota2026");

/** PIN solo en modo demo local (sin Supabase). En remoto se usa is_admin. */
export const isDemoAdminPinEnabled = !isSupabaseConfigured;
