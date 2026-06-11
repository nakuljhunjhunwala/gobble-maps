"use client";

import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/icons";

export interface IconButtonProps {
  icon: IconName;
  title: string;
  danger?: boolean;
  onClick?: () => void;
  size?: number;
  strokeWidth?: number;
  disabled?: boolean;
}

export function IconButton({
  icon,
  title,
  danger = false,
  onClick,
  size = 15,
  strokeWidth = 2,
  disabled,
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn("ad-iconbtn", danger && "ad-iconbtn-danger")}
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={icon} size={size} strokeWidth={strokeWidth} />
    </button>
  );
}
