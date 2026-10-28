/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_PLAUSIBLE_DOMAIN?: string;
  readonly VITE_MIXPANEL_TOKEN?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_ADMIN_PIN?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
