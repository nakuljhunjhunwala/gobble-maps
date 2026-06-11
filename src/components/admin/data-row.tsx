import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";

export interface DataRowProps {
  /** Custom leading node (e.g. a photo thumb). Takes precedence over `icon`. */
  thumb?: ReactNode;
  /** Leading icon rendered in the .ad-detail-ic square. */
  icon?: IconName;
  /** Color for the leading icon. */
  iconColor?: string;
  /** Main column: name line + sub lines. */
  main: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  style?: CSSProperties;
}

// The shared .ad-row shell used by Places / Users / Reports / TBT lists.
export function DataRow({
  thumb,
  icon,
  iconColor = "var(--gb-deep)",
  main,
  badges,
  actions,
  style,
}: DataRowProps) {
  return (
    <div className="ad-row" style={style}>
      {thumb}
      {!thumb && icon && (
        <span className="ad-detail-ic">
          <Icon name={icon} size={15} color={iconColor} />
        </span>
      )}
      <div className="ad-row-main">{main}</div>
      {badges && <div className="ad-row-badges">{badges}</div>}
      {actions && <div className="ad-row-actions">{actions}</div>}
    </div>
  );
}
