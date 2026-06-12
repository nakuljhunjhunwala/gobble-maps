"use client";

import { Icon } from "@/components/icons";

export interface LoginPromptProps {
  open: boolean;
  action: string;
  onClose: () => void;
  onLogin: () => void;
}

// ── Soft login prompt (FR-7) ─────────────────────────────────
export function LoginPrompt({ open, action, onClose, onLogin }: LoginPromptProps) {
  if (!open) return null;
  return (
    <div className="gb-overlay" onClick={onClose}>
      <div className="gb-sheet" style={{ maxHeight: "46%" }} onClick={(e) => e.stopPropagation()}>
        <div className="gb-sheet-handle"></div>
        <div
          style={{
            padding: "6px 24px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span className="gb-brand-mark" style={{ width: 46, height: 46, borderRadius: 14 }}>
            <Icon name="heart" size={22} color="#fff" strokeWidth={2} />
          </span>
          <h3 className="gb-h2">Log in to {action}</h3>
          <p className="gb-sub" style={{ maxWidth: 250 }}>
            Log in to save places, track your visits, and create custom lists. Browsing never
            requires an account.
          </p>
          <button
            className="gb-btn"
            style={{ width: "100%", marginTop: 6 }}
            onClick={() => {
              onClose();
              onLogin();
            }}
          >
            Log in or sign up
          </button>
          <button className="gb-link" style={{ color: "var(--gb-mut)" }} onClick={onClose}>
            Keep browsing
          </button>
        </div>
      </div>
    </div>
  );
}
