/** Error reporting opcional. Activa con VITE_SENTRY_DSN. */

let inited = false;

export async function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || inited || typeof window === "undefined") return;
  inited = true;

  window.addEventListener("error", (e) => {
    console.error("[sentry-fallback]", e.error ?? e.message);
    void postBeacon(dsn, {
      message: String(e.message),
      stack: e.error?.stack,
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    console.error("[sentry-fallback]", e.reason);
    void postBeacon(dsn, {
      message: String(e.reason),
    });
  });
}

export function captureError(error: unknown, context?: string) {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  console.error(context ?? "error", error);
  if (!dsn) return;
  void postBeacon(dsn, {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
  });
}

async function postBeacon(dsn: string, payload: Record<string, unknown>) {
  try {
    // Placeholder: con DSN real integra @sentry/browser.
    // Mientras tanto solo logueamos en consola para no romper builds.
    if (import.meta.env.DEV) {
      console.info("[observability]", dsn.slice(0, 24), payload);
    }
  } catch {
    /* noop */
  }
}
