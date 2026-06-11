import type { CSSProperties, ReactNode } from "react";

export type BadgeTone = "green" | "red" | "amber" | "grey" | "ink" | "sky";

const TONES: Record<BadgeTone, CSSProperties> = {
  grey: { background: "#EFF3F6", color: "#5E7C8C" },
  sky: { background: "#EAF5FC", color: "#1D7FB8" },
  green: { background: "#E8F5EC", color: "#15803D" },
  red: { background: "#FBEAE8", color: "#B4514B" },
  amber: { background: "#FFF4DE", color: "#8A6116" },
  ink: { background: "#14313F", color: "#fff" },
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

// Ported from prototype ABadge — styles itself inline like .gb-badge.
export function Badge({ tone = "grey", children }: BadgeProps) {
  return (
    <span className="ad-badge gb-badge" style={TONES[tone]}>
      {children}
    </span>
  );
}
