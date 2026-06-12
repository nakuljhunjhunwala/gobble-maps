"use client";
// Gobble Maps consumer — bottom sheet, ported from GSheet in
// design/gobble/components.jsx. Overlay click closes; inner clicks don't.
import type { ReactNode } from "react";

export interface GSheetProps {
  onClose: () => void;
  children: ReactNode;
  /** max-height of the sheet (prototype variants: '78%', '60%', etc.) */
  maxH?: string;
}

export function GSheet({ onClose, children, maxH = "78%" }: GSheetProps) {
  return (
    <div className="gb-overlay" onClick={onClose}>
      <div
        className="gb-sheet"
        style={{ maxHeight: maxH }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gb-sheet-handle"></div>
        {children}
      </div>
    </div>
  );
}
