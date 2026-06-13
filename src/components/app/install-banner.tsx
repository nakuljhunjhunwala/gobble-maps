"use client";
// Gobble Maps consumer — native install promotion.
//
// The banner ONLY appears when the browser reports the app is installable
// (the 'beforeinstallprompt' event has fired). "Install" then triggers the
// browser's own native install dialog — the same flow as the install icon
// Chromium shows in the address bar (which appears automatically on a valid,
// installable PWA, exactly like YouTube et al.).
//
// iOS Safari has no programmatic install API, so no banner shows there — iOS
// users install via Safari's Share → Add to Home Screen, which Apple surfaces
// itself. We deliberately don't render a manual how-to guide.

import { useEffect, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/ui/toast";

const DISMISS_KEY = "gb_install_dismissed";
const STORE_EVENT = "gb-install-store";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Capture the event at module scope so we never miss it, and notify the store
// so the banner can appear the moment the browser deems the app installable.
let stashedPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    stashedPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event(STORE_EVENT));
  });
  window.addEventListener("appinstalled", () => {
    stashedPrompt = null;
    window.dispatchEvent(new Event(STORE_EVENT));
  });
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return window.matchMedia("(display-mode: standalone)").matches || nav === true;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(STORE_EVENT, onChange);
  return () => window.removeEventListener(STORE_EVENT, onChange);
}
function getSnapshot(): boolean {
  return (
    stashedPrompt !== null &&
    !isStandalone() &&
    localStorage.getItem(DISMISS_KEY) !== "1"
  );
}

export function InstallBanner() {
  const show = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const { toast } = useToast();

  useEffect(() => {
    const onInstalled = () =>
      toast("Installed — find Gobble Maps on your home screen.");
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, [toast]);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    window.dispatchEvent(new Event(STORE_EVENT));
  };

  const onInstall = () => {
    const p = stashedPrompt;
    if (!p) return;
    // A prompt can only be used once; consume it and hide the banner.
    stashedPrompt = null;
    window.dispatchEvent(new Event(STORE_EVENT));
    void p.prompt().then(() =>
      p.userChoice.then((choice) => {
        if (choice.outcome === "accepted") dismiss();
      })
    );
  };

  return (
    <div
      style={{
        background: "var(--gb-deep)",
        color: "#fff",
        padding: "8px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.35, fontWeight: 600 }}>
        Get the Gobble Maps app — install it for offline, full-screen access.
      </span>
      <button
        onClick={onInstall}
        style={{
          flexShrink: 0,
          background: "#fff",
          color: "var(--gb-deep)",
          border: "none",
          borderRadius: 8,
          padding: "5px 12px",
          fontSize: 12.5,
          fontWeight: 800,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Install
      </button>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          cursor: "pointer",
          padding: 2,
        }}
      >
        <Icon name="x" size={16} color="#fff" strokeWidth={2.4} />
      </button>
    </div>
  );
}
