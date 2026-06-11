import type { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: number | string;
  hint?: ReactNode;
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="ad-card ad-stat">
      <span className="ad-stat-label">{label}</span>
      <span className="ad-stat-value">
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </span>
      {hint && <span className="ad-stat-hint">{hint}</span>}
    </div>
  );
}
