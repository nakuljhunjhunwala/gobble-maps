export interface ColChartPoint {
  label: string;
  count: number;
}

export interface ColChartProps {
  data: ColChartPoint[];
  height?: number;
}

// Pure-div gradient column chart (ported from prototype AColChart).
export function ColChart({ data, height = 120 }: ColChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 10,
        height,
        paddingTop: 8,
      }}
    >
      {data.map((d) => (
        <div
          key={d.label}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            height: "100%",
            justifyContent: "flex-end",
          }}
        >
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--gb-mut)" }}>
            {d.count}
          </span>
          <div
            style={{
              width: "100%",
              maxWidth: 38,
              borderRadius: "6px 6px 2px 2px",
              background: "linear-gradient(180deg, var(--gb-sky), var(--gb-deep))",
              height: Math.max(6, (d.count / max) * (height - 44)),
            }}
          ></div>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--gb-mut)" }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}
