import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FieldProps {
  label: ReactNode;
  note?: ReactNode;
  span2?: boolean;
  children: ReactNode;
}

export function Field({ label, note, span2 = false, children }: FieldProps) {
  return (
    <label className={cn("ad-field", span2 && "ad-span2")}>
      <span className="ad-flabel">{label}</span>
      {children}
      {note && <span style={{ fontSize: 11, color: "var(--gb-mut)" }}>{note}</span>}
    </label>
  );
}
