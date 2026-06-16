"use client";
// Gobble Maps consumer — install promotion banner.
//
// Shows whenever the app is NOT already installed (not in standalone display
// mode) and the user hasn't dismissed it — on every platform, including iOS.
//
// Install action:
//  - Android / desktop Chromium: the browser fires `beforeinstallprompt`,
//    which we capture and replay as the native install dialog.
//  - iOS Safari / iOS Chrome: there is NO programmatic install API, so the
//    button reveals the manual "Share → Add to Home Screen" instruction.

import { useEffect, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";

const DISMISS_KEY = "gb_install_dismissed";
const STORE_EVENT = "gb-install-store";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Capture the install event at module scope so we never miss it.
let stashedPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    stashedPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event(STORE_EVENT));
  });
  window.addEventListener("appinstalled", () => {
    stashedPrompt = null;
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore unavailable storage
    }
    window.dispatchEvent(new Event(STORE_EVENT));
  });
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return window.matchMedia("(display-mode: standalone)").matches || nav === true;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as Mac; detect touch + Mac as iPad too.
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (/Macintosh/.test(ua) && "ontouchend" in document)
  );
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(STORE_EVENT, onChange);
  return () => window.removeEventListener(STORE_EVENT, onChange);
}

/** Visible whenever the app isn't installed and the banner wasn't dismissed. */
function getSnapshot(): boolean {
  if (isStandalone()) return false;
  try {
    return localStorage.getItem(DISMISS_KEY) !== "1";
  } catch {
    return true;
  }
}

export function InstallBanner() {
  const show = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const [hint, setHint] = useState<string | null>(null);

  // Hide instantly if the app gets installed while the banner is open.
  useEffect(() => {
    const onInstalled = () => window.dispatchEvent(new Event(STORE_EVENT));
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(STORE_EVENT));
  };

  const onInstall = () => {
    const p = stashedPrompt;
    if (p) {
      // Native install dialog (Android / desktop Chromium).
      stashedPrompt = null;
      window.dispatchEvent(new Event(STORE_EVENT));
      void p.prompt().then(() =>
        p.userChoice.then((choice) => {
          if (choice.outcome === "accepted") dismiss();
        })
      );
      return;
    }
    // No programmatic install (iOS, or browsers that haven't fired the event):
    // show the manual instruction instead.
    setHint(
      isIOS()
        ? "Tap the Share button, then choose “Add to Home Screen”."
        : "Open your browser menu and choose “Install app” / “Add to Home Screen”."
    );
  };

  return (
    <div
      style={{
        background: "var(--gb-deep)",
        color: "#fff",
        padding: "8px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{ flex: 1, fontSize: 12.5, lineHeight: 1.35, fontWeight: 600 }}
        >
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
      {hint && (
        <span
          style={{
            fontSize: 11.5,
            lineHeight: 1.4,
            fontWeight: 600,
            color: "rgba(255,255,255,0.92)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="arrowUR" size={13} color="#fff" strokeWidth={2.2} />
          {hint}
        </span>
      )}
    </div>
  );
}
