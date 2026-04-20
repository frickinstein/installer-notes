declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params?: Record<string, string | number>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", name, params);
  }
}

export function setUserProperties(props: Record<string, string>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("set", "user_properties", props);
  }
}
