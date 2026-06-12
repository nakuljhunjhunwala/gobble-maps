"use client";
// Gobble Maps consumer — slim dismissible "install the app" banner.
// Sits in normal flow at the very top of the shell (NOT fixed). Hidden when the
// app is already installed (standalone display-mode / iOS navigator.standalone)
// or when previously dismissed (localStorage 'gb_install_dismissed').
//
// Android/desktop: captures the 'beforeinstallprompt' event, preventDefault,
// stashes it, and 'Install' calls prompt(). iOS Safari has no such event, so
// 'Install' reveals a one-line Add-to-Home-Screen hint instead.

import { useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";

const DISMISS_KEY = "gb_install_dismissed";
const VISIBILITY_EVENT = "gb-install-visibility";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Capture the event as early as possible (module scope) so we don't miss it
// before the component mounts. Browsers fire it once shortly after load.
let stashedPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    stashedPrompt = e as BeforeInstallPromptEvent;
  });
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const standaloneNav = (window.navigator as Navigator & { standalone?: boolean })
    .standalone;
  return (
    window.matchMedia("(display-mode: standalone)").matches || standaloneNav === true
  );
}

// External store: whether the banner should be visible (not installed, not
// dismissed). Using useSyncExternalStore keeps the server/first-client render
// in agreement (getServerSnapshot → false) without setState inside an effect.
function subscribeVisibility(onChange: () => void): () => void {
  window.addEventListener(VISIBILITY_EVENT, onChange);
  return () => window.removeEventListener(VISIBILITY_EVENT, onChange);
}
function getVisibilitySnapshot(): boolean {
  return !isStandalone() && localStorage.getItem(DISMISS_KEY) !== "1";
}

export function InstallBanner() {
  const show = useSyncExternalStore(
    subscribeVisibility,
    getVisibilitySnapshot,
    () => false
  );
  const [showIosHint, setShowIosHint] = useState(false);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    window.dispatchEvent(new Event(VISIBILITY_EVENT));
  };

  const onInstall = () => {
    if (stashedPrompt) {
      const p = stashedPrompt;
      stashedPrompt = null;
      void p.prompt().then(() =>
        p.userChoice.then((choice) => {
          if (choice.outcome === "accepted") dismiss();
        })
      );
      return;
    }
    // iOS Safari (no beforeinstallprompt): reveal the manual hint.
    setShowIosHint(true);
  };

  return (
    <div
      style={{
        background: "var(--gb-deep)",
        color: "#fff",
        padding: "8px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.35, fontWeight: 600 }}>
          Get the Gobble Maps app — install it on your home screen.
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
      {showIosHint && (
        <span style={{ fontSize: 11.5, lineHeight: 1.35, opacity: 0.95 }}>
          Open the Share menu → Add to Home Screen
        </span>
      )}
    </div>
  );
}
