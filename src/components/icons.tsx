// Gobble Maps — icon set (stroke line icons, 24 viewBox)
// Ported verbatim from design/gobble/components.jsx (GIcon).
import type { CSSProperties, ReactElement } from "react";

const ICON_PATHS = {
  fork: <g><path d="M7 3v5a2 2 0 0 0 2 2h0V3M9 10v11M5 3v5"/><path d="M16 3c-1.5 1-2.5 3.5-2.5 6 0 2 .9 3 2.5 3v9M16 3c1 .8 1.8 3 1.8 5"/></g>,
  coffee: <g><path d="M4 9h11v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9z"/><path d="M15 10h2a2.5 2.5 0 0 1 0 5h-2M7 5.5c0-1 .8-1 .8-2M11 5.5c0-1 .8-1 .8-2"/></g>,
  cocktail: <g><path d="M5 4h14l-7 8-7-8zM12 12v7M8.5 21h7"/><path d="M9 7.5h6"/></g>,
  cake: <g><path d="M6 11c0-3 2.5-5 6-5s6 2 6 5c0 1.2-1 2-2 1.6-.8-.3-1.3-.3-2 0-.7.4-1.3.4-2 0-.7-.3-1.2-.3-2 0-1 .4-2-.4-2-1.6h-2z" transform="translate(0,-1)"/><path d="M7 11l1.4 8.2c.1.5.5.8 1 .8h5.2c.5 0 .9-.3 1-.8L17 11M12 3v2"/></g>,
  cart: <g><path d="M3 8l2-4h14l2 4H3zM5 8v9M19 8v9M5 13h14"/><circle cx="8" cy="19.5" r="1.5"/><circle cx="16" cy="19.5" r="1.5"/></g>,
  beer: <g><path d="M6 8h10v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z"/><path d="M16 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M6 8c-1.2-.5-2-1.5-2-2.7C4 3.6 5.4 3 6.5 3 7 1.8 8.3 1.2 9.6 1.6c.8-.8 2.6-.8 3.4.2 1.6-.5 3 .6 3 2.2 0 1.4-.8 2.4-2 2.8" transform="translate(0,1)"/><path d="M9 12v6M13 12v6"/></g>,
  search: <g><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></g>,
  sliders: <g><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></g>,
  heart: <path d="M12 20.5S3.5 15.5 3.5 9.3C3.5 6.4 5.7 4.5 8 4.5c1.7 0 3.2.9 4 2.3.8-1.4 2.3-2.3 4-2.3 2.3 0 4.5 1.9 4.5 4.8 0 6.2-8.5 11.2-8.5 11.2z"/>,
  bookmark: <path d="M6 4.5h12a1 1 0 0 1 1 1V21l-7-4.2L5 21V5.5a1 1 0 0 1 1-1z" transform="translate(0,-1)"/>,
  check: <path d="M4.5 12.5l5 5L19.5 6.5"/>,
  share: <g><path d="M12 3v12M8 6.5L12 3l4 3.5"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></g>,
  chevL: <path d="M14.5 4.5L7 12l7.5 7.5"/>,
  chevR: <path d="M9.5 4.5L17 12l-7.5 7.5"/>,
  chevD: <path d="M5 9l7 7 7-7"/>,
  star: <path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2-5.6-3.2L6.4 20l1.3-6.2L3 9.5l6.3-.7L12 3z"/>,
  nav: <path d="M21 3L10 21l-1.5-7.5L1 12 21 3z" transform="translate(1,0) scale(0.92)"/>,
  phone: <path d="M5 4h4l1.5 5L8 11a13 13 0 0 0 5 5l2-2.5 5 1.5v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>,
  instagram: <g><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor"/></g>,
  clock: <g><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/></g>,
  list: <g><path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></g>,
  user: <g><circle cx="12" cy="8" r="4"/><path d="M4.5 21c1-4 4-6 7.5-6s6.5 2 7.5 6"/></g>,
  home: <path d="M4 11l8-7.5L20 11v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9z"/>,
  map: <g><path d="M9 4L3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4zM9 4v14M15 6v14"/></g>,
  x: <path d="M6 6l12 12M18 6L6 18"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  flag: <path d="M5 21V4c4-2.2 8 2.2 12 0v10c-4 2.2-8-2.2-12 0"/>,
  music: <g><path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></g>,
  dice: <g><rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/></g>,
  leaf: <path d="M5 20C5 10 11 4 20 4c0 9-6 15-15 16zM5 20c2-5 5-8 9-10"/>,
  lock: <g><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></g>,
  globe: <g><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c-2.5 2.3-3.8 5.2-3.8 8.5s1.3 6.2 3.8 8.5c2.5-2.3 3.8-5.2 3.8-8.5s-1.3-6.2-3.8-8.5z"/></g>,
  arrowUR: <path d="M7 17L17 7M9 7h8v8"/>,
  info: <g><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><circle cx="12" cy="8" r="0.7" fill="currentColor"/></g>,
  train: <g><rect x="6" y="3.5" width="12" height="13" rx="3"/><path d="M6 11h12M9.5 20.5L8 23M14.5 20.5L16 23M9 16.5L8 20.5h8l-1-4"/><circle cx="9.5" cy="13.8" r="0.7" fill="currentColor"/><circle cx="14.5" cy="13.8" r="0.7" fill="currentColor"/></g>,
  pinOutline: <g><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></g>,
  edit: <path d="M16.5 4.5l3 3L8 19l-4 1 1-4L16.5 4.5z"/>,
  logout: <g><path d="M14 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8"/><path d="M10 12h10M17 8.5l3.5 3.5L17 15.5"/></g>,
  offline: <g><path d="M1.5 1.5l21 21" /><path d="M5 10a11 11 0 0 1 4-2.5M2 7.5A15 15 0 0 1 5.6 5M12 14.5a4.5 4.5 0 0 1 3.5 1.6M22 7.5a15 15 0 0 0-7-3.9M18.8 10.7A11 11 0 0 0 14 8.3"/><circle cx="12" cy="20" r="1" fill="currentColor"/></g>,
  play: <path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>,
} satisfies Record<string, ReactElement>;

export type IconName = keyof typeof ICON_PATHS;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  className?: string;
  style?: CSSProperties;
}

export function Icon({
  name,
  size = 16,
  color = "currentColor",
  strokeWidth = 2,
  fill = "none",
  className,
  style,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, display: "block", color, ...style }}
    >
      {ICON_PATHS[name] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}
