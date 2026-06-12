// Gobble Maps consumer — Photo component, ported from GPhoto in
// design/gobble/components.jsx. Renders the real storage photo when a path
// exists, else the prototype's oklch gradient placeholder with the type icon.
// Server-safe (no hooks).
import type { CSSProperties } from "react";
import { Icon, type IconName } from "@/components/icons";
import { photoUrl } from "@/lib/admin/format";
import { GOBBLE_TYPES } from "@/lib/consumer/place-types";
import type { PlaceType } from "@/lib/types";

export { GOBBLE_TYPES };

/** Re-export the DB place type under the legacy name to avoid churn. */
export type PlaceTypeKey = PlaceType;

export interface PhotoProps {
  /** place-photos storage path; falls back to gradient placeholder when absent */
  path?: string | null;
  hue?: number;
  type?: PlaceTypeKey;
  alt: string;
  className?: string;
  style?: CSSProperties;
  /** placeholder icon size (prototype: 36 default, 26 in row cards) */
  iconSize?: number;
}

export function Photo({
  path,
  hue = 205,
  type,
  alt,
  className,
  style,
  iconSize = 36,
}: PhotoProps) {
  if (path) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl(path)}
        alt={alt}
        className={className}
        loading="lazy"
        style={{ objectFit: "cover", display: "block", ...style }}
      />
    );
  }
  const icon: IconName = type ? GOBBLE_TYPES[type].icon : "pinOutline";
  return (
    <div
      role="img"
      aria-label={alt}
      className={className}
      style={{
        background: `linear-gradient(150deg, oklch(0.88 0.055 ${hue}) 0%, oklch(0.74 0.085 ${hue + 25}) 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 90% at 18% 12%, rgba(255,255,255,0.4), transparent 55%)",
        }}
      ></div>
      <Icon
        name={icon}
        size={iconSize}
        color={`oklch(0.45 0.07 ${hue})`}
        strokeWidth={1.5}
        style={{ opacity: 0.5, position: "relative" }}
      />
    </div>
  );
}
