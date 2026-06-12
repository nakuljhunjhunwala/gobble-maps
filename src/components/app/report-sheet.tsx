"use client";
// Gobble Maps consumer — Report-an-issue sheet, ported from GReportSheet in
// design/gobble/screens-detail.jsx. Submits via the submitReport server
// action (inserts issue_reports with place_name + reporter_username snapshots).

import { useState } from "react";
import { GSheet } from "./sheet";
import { useToast } from "@/components/ui/toast";
import { submitReport } from "@/lib/consumer/user-actions";

export interface ReportSheetProps {
  placeId: string;
  placeName: string;
  onClose: () => void;
}

export function ReportSheet({ placeId, placeName, onClose }: ReportSheetProps) {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    const res = await submitReport(placeId, placeName, trimmed);
    setBusy(false);
    if (res.ok) {
      onClose();
      toast(`Thanks @${res.username}! We'll look into this.`);
    }
  };

  return (
    <GSheet onClose={onClose} maxH="56%">
      <div
        style={{
          padding: "2px 20px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div>
          <h3 className="gb-h2" style={{ fontSize: 19 }}>
            Report an issue
          </h3>
          <p className="gb-sub" style={{ marginTop: 3 }}>
            {placeName} · goes straight to the curator
          </p>
        </div>
        <textarea
          className="gb-input"
          rows={4}
          style={{ resize: "none", lineHeight: 1.5 }}
          placeholder="e.g. The phone number is incorrect, or this place has shut down…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="gb-btn" onClick={() => void submit()}>
          Submit report
        </button>
      </div>
    </GSheet>
  );
}
