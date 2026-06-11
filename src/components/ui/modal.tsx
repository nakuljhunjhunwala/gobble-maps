"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/icons";

export interface ModalProps {
  title: ReactNode;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ title, wide = false, onClose, children, footer }: ModalProps) {
  return (
    <div className="ad-modal-overlay" onClick={onClose}>
      <div
        className={"ad-modal" + (wide ? " ad-modal-wide" : "")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ad-modal-head">
          <h3 className="ad-h3">{title}</h3>
          <button type="button" className="ad-iconbtn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={15} strokeWidth={2.4} />
          </button>
        </div>
        <div className="ad-modal-body">{children}</div>
        {footer && <div className="ad-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
