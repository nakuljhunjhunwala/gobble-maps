export interface BarListRow {
  label: string;
  value: number;
  /** Right-hand text; defaults to the raw value (e.g. pass '38%' for percents). */
  display?: string;
}

export interface BarListProps {
  rows: BarListRow[];
}

// Horizontal pill bars (ported from prototype ABars).
export function BarList({ rows }: BarListProps) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r) => (
        <div
          key={r.label}
          style={{
            display: "grid",
            gridTemplateColumns: "110px 1fr 38px",
            gap: 8,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--gb-ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {r.label}
          </span>
          <div style={{ height: 7, borderRadius: 99, background: "var(--gb-sky-50)" }}>
            <div
              style={{
                width: `${(r.value / max) * 100}%`,
                height: "100%",
                borderRadius: 99,
                background: "var(--gb-deep)",
              }}
            ></div>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--gb-mut)",
              textAlign: "right",
            }}
          >
            {r.display ?? r.value}
          </span>
        </div>
      ))}
    </div>
  );
}
