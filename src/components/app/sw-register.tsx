"use client";

// Registers the hand-rolled service worker (public/sw.js) in production only.
// Re-checks for an updated SW whenever the tab becomes visible again, so users
// who keep the installed PWA open still pick up new deploys.
import { useEffect } from "react";

export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        registration = reg;
      })
      .catch(() => {
        // Registration failures are non-fatal — the app still works online.
      });

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        registration?.update().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
