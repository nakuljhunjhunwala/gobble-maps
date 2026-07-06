"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import {
  importPlaces,
  type ImportResult,
} from "@/app/admin/(panel)/places/actions";

type SuccessResult = Extract<ImportResult, { ok: true }>;

export function ImportDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [result, setResult] = useState<SuccessResult | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    const text = await file.text();
    startTransition(async () => {
      const res = await importPlaces(text);
      if (res.ok) setResult(res);
      else setError(res.error);
    });
  };

  const done = () => {
    router.refresh();
    onClose();
  };

  return (
    <Modal
      title="Import places from CSV"
      wide
      onClose={result ? done : onClose}
      footer={
        result ? (
          <button type="button" className="gb-btn gb-btn-sm" onClick={done}>
            Done
          </button>
        ) : (
          <>
            <button
              type="button"
              className="gb-btn gb-btn-sm"
              disabled={pending}
              onClick={() => fileRef.current?.click()}
            >
              {pending ? "Importing…" : "Choose CSV file"}
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
        )
      }
    >
      {!result ? (
        <div
          style={{
            fontSize: 13.5,
            lineHeight: 1.55,
            color: "var(--gb-ink)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <p>
            Upload a CSV exported from this page (or one matching its columns).
            Rows with a blank <strong>id</strong> create new places; rows with an{" "}
            <strong>id</strong> update that place.
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              color: "var(--gb-mut)",
              fontSize: 12.5,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <li>Photos are not imported — manage images in the editor.</li>
            <li>New cuisine / vibe / area labels are created automatically.</li>
            <li>Invalid rows are skipped and listed after import.</li>
          </ul>
          {error && (
            <p style={{ color: "#B4514B", fontWeight: 700, fontSize: 13 }}>
              {error}
            </p>
          )}
        </div>
      ) : (
        <div
          style={{
            fontSize: 13.5,
            lineHeight: 1.55,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <p>
            <strong>{result.created}</strong> created ·{" "}
            <strong>{result.updated}</strong> updated ·{" "}
            <strong style={{ color: result.failed ? "#B4514B" : "inherit" }}>
              {result.failed}
            </strong>{" "}
            failed
          </p>
          {result.createdTags.length > 0 && (
            <div style={{ fontSize: 12.5, color: "var(--gb-mut)" }}>
              New filter options created: {result.createdTags.join(", ")}
            </div>
          )}
          {result.errors.length > 0 && (
            <div
              style={{
                maxHeight: 220,
                overflowY: "auto",
                border: "1px solid var(--gb-line)",
                borderRadius: 10,
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {result.errors.map((er, i) => (
                <div key={i} style={{ fontSize: 12.5 }}>
                  <strong>Row {er.row}</strong> ({er.name}):{" "}
                  <span style={{ color: "#B4514B" }}>{er.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: "none" }}
        onChange={(e) => void onFile(e)}
      />
    </Modal>
  );
}
