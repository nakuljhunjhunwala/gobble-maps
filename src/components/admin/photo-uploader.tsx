"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/icons";

/** Public URL for a place-photos storage path (client-safe). */
export function publicPhotoUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/place-photos/${storagePath}`;
}

/** Longest edge after compression. */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

/**
 * Re-encode an image client-side before upload: resizes to MAX_EDGE and
 * converts to JPEG. The canvas round-trip also strips ALL metadata
 * (EXIF/GPS/etc.) — nothing we don't want ever reaches storage.
 */
async function compressImage(source: Blob): Promise<Blob> {
  // imageOrientation honours EXIF rotation before we strip it.
  const bitmap = await createImageBitmap(source, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  // White backdrop so transparent PNGs don't turn black as JPEG.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) throw new Error("Image re-encode failed");
  return blob;
}

export interface PhotoUploaderProps {
  /** Place id (client-generated for new places) — used as the storage folder. */
  placeId: string;
  /** Current storage paths, in display order. */
  paths: string[];
  onChange: (paths: string[]) => void;
  max?: number;
}

export function PhotoUploader({
  placeId,
  paths,
  onChange,
  max = 6,
}: PhotoUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [urlMode, setUrlMode] = useState(false);
  const [urlValue, setUrlValue] = useState("");

  /** Compress + upload a blob to Supabase Storage, then append the path. */
  const ingest = async (source: Blob) => {
    setError("");
    setUploading(true);
    try {
      const compressed = await compressImage(source);
      const supabase = createClient();
      const path = `${placeId}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("place-photos")
        .upload(path, compressed, { contentType: "image/jpeg" });
      if (uploadError) {
        setError(uploadError.message);
        return;
      }
      onChange([...paths, path]);
    } catch {
      setError("Couldn't process that image — try a different one.");
    } finally {
      setUploading(false);
    }
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || uploading || paths.length >= max) return;
    await ingest(file);
  };

  const onAddFromUrl = async () => {
    const url = urlValue.trim();
    if (!url || uploading || paths.length >= max) return;
    setError("");
    // The outer code only fetches the proxy and reports failure; ingest owns
    // the uploading flag for the compress + upload step.
    try {
      const res = await fetch(
        `/api/admin/photo-proxy?url=${encodeURIComponent(url)}`
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(body?.error ?? "Couldn't fetch that image.");
        return;
      }
      const blob = await res.blob();
      await ingest(blob);
      setUrlValue("");
      setUrlMode(false);
    } catch {
      setError("Couldn't fetch that image — check the URL.");
    }
  };

  const remove = async (path: string) => {
    setError("");
    const supabase = createClient();
    const { error: removeError } = await supabase.storage
      .from("place-photos")
      .remove([path]);
    if (removeError) {
      setError(removeError.message);
      return;
    }
    onChange(paths.filter((p) => p !== path));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {paths.map((path) => (
          <div key={path} style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={publicPhotoUrl(path)}
              alt=""
              style={{
                width: 64,
                height: 64,
                borderRadius: 10,
                objectFit: "cover",
                display: "block",
              }}
            />
            <button
              type="button"
              className="ad-photo-x"
              aria-label="Remove photo"
              onClick={() => void remove(path)}
            >
              <Icon name="x" size={10} strokeWidth={3} color="#fff" />
            </button>
          </div>
        ))}
        {uploading && (
          <div className="ad-photo-add" style={{ cursor: "default" }}>
            Uploading…
          </div>
        )}
        {!uploading && paths.length < max && (
          <>
            <button
              type="button"
              className="ad-photo-add"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="plus" size={18} color="var(--gb-mut)" strokeWidth={2.2} />{" "}
              Upload
            </button>
            <button
              type="button"
              className="ad-photo-add"
              onClick={() => setUrlMode((v) => !v)}
              title="Add a photo from a direct image URL"
            >
              <Icon name="globe" size={16} color="var(--gb-mut)" strokeWidth={2.2} />{" "}
              From URL
            </button>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => void onFile(e)}
        />
      </div>
      {urlMode && !uploading && paths.length < max && (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            className="gb-input"
            style={{ flex: 1, padding: "8px 11px", fontSize: 12.5 }}
            placeholder="https://… direct image URL"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void onAddFromUrl();
              }
            }}
          />
          <button
            type="button"
            className="gb-btn gb-btn-sm"
            onClick={() => void onAddFromUrl()}
          >
            Add
          </button>
        </div>
      )}
      {error && (
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#B4514B" }}>
          {error}
        </span>
      )}
      <span style={{ fontSize: 11, color: "var(--gb-mut)" }}>
        Photos are compressed to JPEG (max 1600px) and stripped of metadata
        before upload.
      </span>
    </div>
  );
}
