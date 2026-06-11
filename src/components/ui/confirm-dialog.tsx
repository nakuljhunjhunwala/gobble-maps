"use client";

import { Modal } from "@/components/ui/modal";

export interface ConfirmDialogProps {
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  message,
  confirmLabel = "Yes, do it",
  danger = true,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      title="Are you sure?"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="gb-btn gb-btn-sm"
            style={danger ? { background: "#B4514B" } : undefined}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            className="gb-btn gb-btn-sm"
            style={{ background: "#EFF3F6", color: "var(--gb-ink)" }}
            onClick={onClose}
          >
            Cancel
          </button>
        </>
      }
    >
      <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--gb-ink)" }}>{message}</p>
    </Modal>
  );
}
