export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "parchexbogota-theme";

export function readStoredTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "dark" || raw === "light") return raw;
  } catch { /* noop */ }
  return "dark";
}

export function writeStoredTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch { /* noop */ }
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme");
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", mode === "dark" ? "#141210" : "#f4f2ee");
  }

  const apple = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (apple) {
    apple.setAttribute("content", mode === "dark" ? "black-translucent" : "default");
  }

  void syncNativeChrome(mode);
}

async function syncNativeChrome(mode: ThemeMode) {
  try {
    const { isNativeApp } = await import("./native");
    if (!isNativeApp()) return;
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: mode === "dark" ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({
      color: mode === "dark" ? "#141210" : "#f4f2ee",
    });
  } catch { /* plugin opcional */ }
}
