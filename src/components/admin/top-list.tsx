import { Icon } from "@/components/icons";

export interface TopListRow {
  rank: number;
  name: string;
  count: number;
  photoUrl?: string;
}

export interface TopListProps {
  rows: TopListRow[];
  /** Count suffix, e.g. 'saves' / 'visits' / 'shares'. */
  unit?: string;
}

// Ranked top-5 list with 30px thumbs (ported from prototype ATopList).
export function TopList({ rows, unit }: TopListProps) {
  const visible = rows.slice(0, 5);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {visible.map((row, i) => (
        <div
          key={`${row.rank}-${row.name}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "7px 0",
            borderBottom:
              i < visible.length - 1 ? "1px solid var(--gb-line)" : "none",
          }}
        >
          <span
            style={{
              width: 18,
              fontSize: 11,
              fontWeight: 800,
              color: row.rank <= 3 ? "var(--gb-deep)" : "var(--gb-mut)",
            }}
          >
            {row.rank}
          </span>
          {row.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.photoUrl}
              alt=""
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "var(--gb-sky-50)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="pinOutline" size={14} color="var(--gb-deep)" />
            </span>
          )}
          <span
            style={{
              flex: 1,
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--gb-ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.name}
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--gb-mut)" }}>
            {row.count}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
