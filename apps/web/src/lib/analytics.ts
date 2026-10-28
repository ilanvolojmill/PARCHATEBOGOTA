import { PLAUSIBLE_DOMAIN } from "./constants";

type EventProps = Record<string, string | number | boolean | undefined>;

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN ?? "";
const queue: Array<{ event: string; props?: EventProps }> = [];

declare global {
  interface Window {
    mixpanel?: {
      init: (token: string, opts?: Record<string, unknown>) => void;
      track: (event: string, props?: EventProps) => void;
      identify: (id: string) => void;
      people?: { set: (props: EventProps) => void };
    };
  }
}

function loadMixpanel() {
  if (!MIXPANEL_TOKEN || typeof window === "undefined") return;
  if (window.mixpanel) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";
  s.onload = () => {
    window.mixpanel?.init(MIXPANEL_TOKEN, { track_pageview: true, persistence: "localStorage" });
    queue.forEach(({ event, props }) => track(event, props));
    queue.length = 0;
  };
  document.head.appendChild(s);
}

export function initAnalytics() {
  loadMixpanel();
  if (typeof window === "undefined" || !PLAUSIBLE_DOMAIN) return;
  if (document.querySelector('script[data-plausible]')) return;
  const s = document.createElement("script");
  s.defer = true;
  s.dataset.domain = PLAUSIBLE_DOMAIN;
  s.src = "https://plausible.io/js/script.js";
  s.dataset.plausible = "true";
  document.head.appendChild(s);
}

export function identifyUser(userId: string, props?: EventProps) {
  window.mixpanel?.identify(userId);
  if (props) window.mixpanel?.people?.set(props);
}

export function track(event: string, props?: EventProps) {
  if (typeof window === "undefined") return;

  window.mixpanel?.track(event, props);

  if (PLAUSIBLE_DOMAIN && "plausible" in window) {
    (window as Window & { plausible?: (e: string, o?: { props: EventProps }) => void }).plausible?.(
      event,
      props ? { props } : undefined
    );
  } else if (import.meta.env.DEV) {
    console.info("[analytics]", event, props ?? "");
  } else if (!MIXPANEL_TOKEN) {
    queue.push({ event, props });
  }
}

export function trackNeighborhood(neighborhood: string, action: string) {
  track("Neighborhood Action", { neighborhood, action });
}

export function trackFilters(event: string, filters: { vibe?: string; neighborhood?: string; maxDistanceKm?: number | null }) {
  track(event, {
    vibe: filters.vibe,
    neighborhood: filters.neighborhood,
    maxDistanceKm: filters.maxDistanceKm ?? undefined,
  });
}
